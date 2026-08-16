"""NVIDIA NIM API client — async text and multimodal (vision) requests to Llama 3.2 Vision."""
import time
import logging
import httpx

from config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://integrate.api.nvidia.com/v1"
CHAT_ENDPOINT = f"{BASE_URL}/chat/completions"

# Clinical-consistency defaults (low temperature for deterministic triage)
MAX_TOKENS = 1500
TEMPERATURE = 0.3
# NIM vision calls normally answer in 14-42s. Cap the primary attempt at 45s so that when the
# hosted model is oversubscribed we fail over quickly instead of making the user wait ~100s.
REQUEST_TIMEOUT = 45.0
FALLBACK_TIMEOUT = 45.0

# Statuses that mean "this model is unavailable right now" rather than "your request was bad",
# so they are worth retrying on the smaller fallback model.
_FAILOVER_STATUSES = {429, 500, 502, 503, 504}

# Circuit breaker: once the primary model has failed, skip it for this long instead of making
# every subsequent user wait out the full timeout again. Without this, an outage on NVIDIA's side
# would add ~45s to every single message.
PRIMARY_COOLDOWN_SECONDS = 300.0
_primary_down_until: float = 0.0


def _primary_is_cooling_down() -> bool:
    """True while the primary model is in its post-failure cooldown window."""
    return time.monotonic() < _primary_down_until


def _open_circuit() -> None:
    """Mark the primary model as unavailable for the cooldown period."""
    global _primary_down_until
    _primary_down_until = time.monotonic() + PRIMARY_COOLDOWN_SECONDS


def _close_circuit() -> None:
    """Clear the cooldown after the primary model answers successfully again."""
    global _primary_down_until
    _primary_down_until = 0.0


def _headers() -> dict:
    """Return the Authorization + Accept headers for NIM, reading the key from env."""
    return {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


async def _attempt(payload: dict, timeout: float) -> dict:
    """Make ONE call to NIM. Returns the parsed JSON, or a structured error dict (never raises)."""
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(CHAT_ENDPOINT, headers=_headers(), json=payload)

        elapsed = time.perf_counter() - started

        if response.status_code == 200:
            data = response.json()
            logger.info("NIM ok | model=%s | %.2fs | prompt_msgs=%d",
                        payload.get("model"), elapsed, len(payload.get("messages", [])))
            return data

        # ── Map known error statuses to friendly, structured errors ──────────
        if response.status_code == 401:
            logger.error("NIM auth error (401) — invalid or missing API key.")
            return {"error": True, "type": "auth_error", "status": 401,
                    "message": "Authentication with NVIDIA NIM failed. Check the API key."}
        if response.status_code == 429:
            logger.warning("NIM rate limit (429) | model=%s", payload.get("model"))
            return {"error": True, "type": "rate_limit", "status": 429,
                    "message": "NVIDIA NIM rate limit reached. Please wait a moment and retry."}
        if response.status_code in (500, 502, 503, 504):
            logger.error("NIM upstream error (%d) | model=%s", response.status_code, payload.get("model"))
            return {"error": True, "type": "timeout", "status": response.status_code,
                    "message": "The AI service is temporarily unavailable. Please try again shortly."}

        logger.error("NIM unexpected status %d: %s", response.status_code, response.text[:300])
        return {"error": True, "type": "api_error", "status": response.status_code,
                "message": f"NVIDIA NIM returned status {response.status_code}."}

    except httpx.TimeoutException:
        logger.error("NIM timed out after %.0fs | model=%s", timeout, payload.get("model"))
        return {"error": True, "type": "timeout", "status": None,
                "message": "The AI service took too long to respond. Please try again."}
    except httpx.RequestError as exc:
        logger.error("NIM network error: %s", exc)
        return {"error": True, "type": "network_error", "status": None,
                "message": "Could not reach the AI service. Check your internet connection."}


def _should_failover(result: dict) -> bool:
    """True when the primary model looks unavailable (timeout/overloaded), not when the request was bad."""
    if not result.get("error"):
        return False
    if result.get("type") == "timeout":
        return True
    return result.get("status") in _FAILOVER_STATUSES


async def _post(payload: dict) -> dict:
    """Call NIM on the configured model, transparently failing over to the fallback model.

    The hosted 90B vision model is periodically oversubscribed and stops responding. Rather than
    leaving the user with an error, retry once on the smaller sibling model so triage still works.
    """
    if not settings.nvidia_nim_api_key:
        return {"error": True, "type": "config_error",
                "message": "NVIDIA_NIM_API_KEY is not set in the environment (.env)."}

    fallback = (settings.nvidia_nim_fallback_model or "").strip()
    primary = payload.get("model")
    have_fallback = bool(fallback) and fallback != primary

    # While the primary is known-down, go straight to the fallback so users are not made to
    # wait out the timeout on every message.
    if have_fallback and _primary_is_cooling_down():
        logger.info("NIM primary '%s' in cooldown — using fallback '%s' directly.", primary, fallback)
        direct = await _attempt({**payload, "model": fallback}, FALLBACK_TIMEOUT)
        if not direct.get("error"):
            return direct
        # Fallback failed too; give the primary a chance again rather than staying stuck.
        _close_circuit()
        return direct

    result = await _attempt(payload, REQUEST_TIMEOUT)
    if not result.get("error"):
        _close_circuit()
        return result

    if _should_failover(result) and have_fallback:
        logger.warning("NIM primary model '%s' unavailable — retrying on fallback '%s'.",
                       primary, fallback)
        _open_circuit()
        retry = await _attempt({**payload, "model": fallback}, FALLBACK_TIMEOUT)
        if not retry.get("error"):
            logger.info("NIM fallback model '%s' served this request.", fallback)
        else:
            logger.error("NIM fallback model '%s' also failed.", fallback)
        return retry

    return result


async def send_text_request(messages: list[dict]) -> dict:
    """Send a text-only chat completion to NIM; returns the raw response dict or a structured error."""
    payload = {
        "model": settings.nvidia_nim_model,
        "messages": messages,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "top_p": 1.0,
        "stream": False,
    }
    return await _post(payload)


async def send_multimodal_request(messages: list[dict], image_b64: str,
                                  image_mime: str = "image/jpeg") -> dict:
    """Send a text+image chat completion to NIM; the image is attached to the final user message."""
    if not messages:
        return {"error": True, "type": "input_error", "message": "No messages provided."}

    # Rebuild the last user message as a multimodal content array (text + image_url)
    enriched = [dict(m) for m in messages]
    last = enriched[-1]
    user_text = last.get("content", "")
    if isinstance(user_text, list):  # already multimodal — leave as-is
        content_array = user_text
    else:
        content_array = [{"type": "text", "text": user_text}]
    content_array.append({
        "type": "image_url",
        "image_url": {"url": f"data:{image_mime};base64,{image_b64}"},
    })
    enriched[-1] = {"role": last.get("role", "user"), "content": content_array}

    payload = {
        "model": settings.nvidia_nim_model,
        "messages": enriched,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "top_p": 1.0,
        "stream": False,
    }
    return await _post(payload)


def extract_text(nim_response: dict) -> str:
    """Pull the assistant's text content out of a successful NIM response; '' if not present."""
    try:
        return nim_response["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        return ""
