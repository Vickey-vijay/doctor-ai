"""System prompt design + JSON triage schema enforcement and robust parsing.

The assistant behaves like a doctor consulting a patient: it greets, asks follow-up questions
to build a picture across turns ("gathering"), and only delivers a final structured triage once
it has enough information ("concluded"). Every response carries a natural-language `reply` for the
chat bubble plus the structured triage fields for the card.
"""
import re
import json
import logging

logger = logging.getLogger(__name__)

# The exact three urgency tiers — no other value is ever valid.
VALID_TIERS = {"self_care", "consult_doctor", "seek_emergency"}
VALID_STATUS = {"gathering", "concluded"}

DEFAULT_DISCLAIMER = (
    "This is a preliminary triage assessment, not a medical diagnosis. "
    "MediQuick AI cannot replace a qualified healthcare professional. "
    "If you are worried about your health, please consult a doctor. "
    "In an emergency, call your local emergency number immediately."
)

# {persona} and {specialty} are filled per turn from the active specialist agent.
SYSTEM_PROMPT_TEMPLATE = """You are MediQuick AI, a preliminary medical TRIAGE assistant that talks with the patient like a caring doctor.

ACTIVE ROLE: {specialty}.
{persona}

CRITICAL IDENTITY:
- You are NOT a doctor and NOT a diagnostic tool. You perform preliminary triage only.
- You never give a definitive diagnosis — you say a symptom "may be consistent with X", never "you have X".
- You never prescribe medication, dosages, or specific drugs.
- You triage: you assess how URGENT the concern is and WHICH kind of doctor is appropriate.

HOW TO CONVERSE (very important):
- Speak warmly and naturally, the way a good doctor talks to a patient. Acknowledge what they said.
- Do NOT dump a list of conditions immediately. First ASK to understand: onset, duration, severity,
  what makes it better or worse, and other relevant details — one short, focused set of questions at a time.
- Keep gathering across turns until you are reasonably confident, then conclude.

OUTPUT FORMAT — THIS IS MANDATORY:
- Respond with a SINGLE valid JSON object and NOTHING else. No prose before or after. No markdown fences.
- Use this exact schema and key names:
{{
  "reply": "your warm, natural conversational message to show the patient in the chat",
  "assessment_status": "gathering | concluded",
  "possible_conditions": ["condition 1", "condition 2"],
  "urgency_tier": "self_care | consult_doctor | seek_emergency",
  "urgency_reason": "one or two short sentences explaining the chosen tier",
  "specialist_type": "the kind of doctor most appropriate, e.g. Dermatologist / Cardiologist / General Physician",
  "follow_up_questions": ["question 1", "question 2"],
  "disclaimer": "a brief clinical disclaimer"
}}

RULES:
1. "assessment_status" is "gathering" while you are still asking questions, and "concluded" only when
   you are giving your final triage for now. On the FIRST turn it is almost always "gathering".
2. While "gathering": put your empathetic acknowledgement and your questions in "reply", and list those
   same questions in "follow_up_questions". "possible_conditions" may be tentative or empty.
3. When "concluded": "reply" should summarise your assessment in plain, reassuring language; populate
   "possible_conditions" (1-3 items) and a clear "urgency_tier".
4. "urgency_tier" MUST be exactly one of: "self_care", "consult_doctor", "seek_emergency".
5. EMERGENCY OVERRIDE — if the patient describes any of: chest pain/pressure/tightness, difficulty
   breathing or shortness of breath, loss of consciousness or fainting, severe or uncontrolled bleeding,
   signs of stroke (face drooping, arm weakness, slurred speech), a severe allergic reaction (swelling of
   throat/face, trouble breathing), or a suspected major fracture — then IMMEDIATELY set
   "assessment_status" to "concluded" and "urgency_tier" to "seek_emergency". Do not keep gathering.
6. Recommend the single most appropriate "specialist_type" for the concern.
7. If an image is provided that is not a body part or is irrelevant, say so clearly in "reply" and
   "possible_conditions".
8. Always include a "disclaimer". Keep language clear, calm, and non-alarming, but never understate a
   genuine emergency.

Return ONLY the JSON object."""


def build_system_prompt(specialty_display: str, persona: str) -> str:
    """Render the system prompt for the currently active specialist agent."""
    return SYSTEM_PROMPT_TEMPLATE.format(specialty=specialty_display, persona=persona)


def build_messages(system_prompt: str, conversation_history: list[dict], user_message: str) -> list[dict]:
    """Assemble the NIM messages array: system prompt + prior turns + the new user message."""
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})
    return messages


def _coerce_schema(data: dict) -> dict:
    """Force a parsed dict into the canonical triage schema, filling/repairing any missing parts."""
    conditions = data.get("possible_conditions") or []
    if isinstance(conditions, str):
        conditions = [conditions]

    tier = str(data.get("urgency_tier", "")).strip().lower()
    if tier not in VALID_TIERS:
        tier = "consult_doctor"  # safest fallback

    status = str(data.get("assessment_status", "")).strip().lower()
    if status not in VALID_STATUS:
        # If the model gave real conditions, treat it as concluded; otherwise still gathering.
        status = "concluded" if conditions else "gathering"

    # Emergency is never left "gathering".
    if tier == "seek_emergency":
        status = "concluded"

    follow_ups = data.get("follow_up_questions") or []
    if isinstance(follow_ups, str):
        follow_ups = [follow_ups]

    reply = str(data.get("reply", "")).strip()
    if not reply:
        # Derive a sensible chat message if the model omitted one.
        reply = str(data.get("urgency_reason", "")).strip() or "Thank you for sharing that. Could you tell me a little more?"

    return {
        "reply": reply,
        "assessment_status": status,
        "possible_conditions": list(conditions),
        "urgency_tier": tier,
        "urgency_reason": str(data.get("urgency_reason", "")).strip()
        or "Further information is needed to refine this assessment.",
        "specialist_type": str(data.get("specialist_type", "")).strip() or "General Physician",
        "follow_up_questions": list(follow_ups),
        "disclaimer": str(data.get("disclaimer", "")).strip() or DEFAULT_DISCLAIMER,
    }


def parse_triage_json(raw_response: str) -> dict:
    """Parse the model's raw text into the triage schema; handles fences, partial JSON, and plain text."""
    if not raw_response or not raw_response.strip():
        return _text_fallback("")

    text = raw_response.strip()

    # 1) Strip a ```json ... ``` (or plain ```) fence if present.
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()

    # 2) Direct parse.
    try:
        return _coerce_schema(json.loads(text))
    except (json.JSONDecodeError, TypeError):
        pass

    # 3) Grab the outermost {...} block and try again (handles leading/trailing prose).
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return _coerce_schema(json.loads(brace.group(0)))
        except (json.JSONDecodeError, TypeError):
            pass

    # 4) Last resort: wrap the plain text into the schema with a safe tier.
    logger.warning("parse_triage_json: falling back to plain-text wrapping.")
    return _text_fallback(raw_response)


def _text_fallback(raw_text: str) -> dict:
    """Wrap unparseable model output into a safe, schema-compliant triage dict."""
    snippet = raw_text.strip()[:500] if raw_text else ""
    return {
        "reply": snippet
        or "I'm sorry — I had trouble processing that. Could you describe your main symptom again?",
        "assessment_status": "gathering",
        "possible_conditions": [],
        "urgency_tier": "consult_doctor",
        "urgency_reason": "The assistant could not produce a structured assessment. Please consult a doctor to be safe.",
        "specialist_type": "General Physician",
        "follow_up_questions": [
            "Can you describe your main symptom in a little more detail?",
            "How long have you had these symptoms?",
        ],
        "disclaimer": DEFAULT_DISCLAIMER,
    }
