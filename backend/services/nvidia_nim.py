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
REQUEST_TIMEOUT = 100.0  # seconds — NIM vision calls have been observed taking 40-90s


def _headers() -> dict:
    """Return the Authorization + Accept headers for NIM, reading the key from env."""
    return {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


async def _post(payload: dict) -> dict:
    """POST a payload to NIM and return the parsed JSON, or a structured error dict (never raises)."""
    if not settings.nvidia_nim_api_key:
        return {"error": True, "type": "config_error",
                "message": "NVIDIA_NIM_API_KEY is not set in the environment (.env)."}

    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
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
            return {"error": True, "type": "auth_error",
                    "message": "Authentication with NVIDIA NIM failed. Check the API key."}
        if response.status_code == 429:
            logger.warning("NIM rate limit (429).")
            return {"error": True, "type": "rate_limit",
                    "message": "NVIDIA NIM rate limit reached. Please wait a moment and retry."}
        if response.status_code in (502, 503, 504):
            logger.error("NIM upstream/timeout (%d).", response.status_code)
            return {"error": True, "type": "timeout",
                    "message": "The AI service is temporarily unavailable. Please try again shortly."}

        logger.error("NIM unexpected status %d: %s", response.status_code, response.text[:300])
        return {"error": True, "type": "api_error",
                "message": f"NVIDIA NIM returned status {response.status_code}."}

    except httpx.TimeoutException:
        logger.error("NIM request timed out after %.0fs.", REQUEST_TIMEOUT)
        return {"error": True, "type": "timeout",
                "message": "The AI service took too long to respond. Please try again."}
    except httpx.RequestError as exc:
        logger.error("NIM network error: %s", exc)
        return {"error": True, "type": "network_error",
                "message": "Could not reach the AI service. Check your internet connection."}


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
