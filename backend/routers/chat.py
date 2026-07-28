"""Chat router — POST /chat — the main multimodal triage endpoint with specialist routing."""
import json
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import Session as ChatSession, User
from routers.auth import get_current_user
from services import nvidia_nim, prompt_engine, specialists
from services.context_manager import ContextManager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


# ── Request / response schemas ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    """Body for POST /chat."""
    session_id: str | None = Field(default=None, description="Existing session id, or null to start new")
    message: str = Field(..., min_length=1, description="The user's symptom description")
    image_b64: str | None = Field(default=None, description="Optional base64 image from /upload")
    image_mime: str | None = Field(default=None, description="MIME type of the image, e.g. image/jpeg")


class ChatResponse(BaseModel):
    """Response for POST /chat."""
    session_id: str
    message_id: str
    reply: str
    triage: dict
    assessment_status: str
    specialty: str            # canonical key now handling the session
    specialty_display: str    # human-readable name
    handoff: bool             # True if the specialist changed on this turn


def _title_from(message: str) -> str:
    """Derive a short session title from the first user message (first 40 chars)."""
    title = message.strip().replace("\n", " ")
    return (title[:40] + "…") if len(title) > 40 else title


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
) -> ChatResponse:
    """Run one triage turn: load context, call the active specialist agent, parse, route, persist."""
    # ── 1. Resolve or create the session (owned by the current user) ──────────
    if request.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == request.session_id, ChatSession.user_id == user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
    else:
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title=_title_from(request.message),
            assigned_specialty=None,
            created_at=datetime.now(timezone.utc),
        )
        db.add(session)
        db.commit()
        logger.info("new session created | user=%s | %s", user.email, session.id)

    session_id = session.id
    ctx = ContextManager(db, session_id)

    # ── 2. Active specialist agent leads this turn (General Physician by default) ─
    active_specialty = session.assigned_specialty or specialists.DEFAULT_SPECIALTY
    system_prompt = prompt_engine.build_system_prompt(
        specialists.display_name(active_specialty),
        specialists.persona(active_specialty),
        prompt_engine.format_patient_context(user),
    )

    history = ctx.get_nim_messages()
    messages = prompt_engine.build_messages(system_prompt, history, request.message)

    # ── 3. Call NIM (multimodal if an image is attached) ──────────────────────
    has_image = bool(request.image_b64)
    if has_image:
        nim_response = await nvidia_nim.send_multimodal_request(
            messages, request.image_b64, request.image_mime or "image/jpeg"
        )
    else:
        nim_response = await nvidia_nim.send_text_request(messages)

    # ── 4. Handle a NIM failure gracefully (never crash the route) ────────────
    if nim_response.get("error"):
        triage = {
            "reply": nim_response.get("message", "The AI service is temporarily unavailable. Please try again shortly."),
            "assessment_status": "gathering",
            "possible_conditions": [],
            "urgency_tier": "consult_doctor",
            "urgency_reason": nim_response.get("message", "The AI service is temporarily unavailable."),
            "specialist_type": specialists.display_name(active_specialty),
            "follow_up_questions": ["Would you like to try again in a few moments?"],
            "disclaimer": prompt_engine.DEFAULT_DISCLAIMER,
            "service_error": True,
        }
    else:
        raw_text = nvidia_nim.extract_text(nim_response)

        # The model occasionally breaks the JSON-only contract (e.g. an off-topic or
        # ambiguous image). One strict reformat retry recovers most of these before we
        # fall back to wrapping raw prose into the schema.
        if prompt_engine.try_extract_json(raw_text) is None:
            logger.warning("chat: model reply was not valid JSON, retrying with a reformat reminder")
            retry_messages = messages + [
                {"role": "assistant", "content": raw_text[:800]},
                {"role": "user", "content": "That reply was not valid JSON. Respond again with ONLY the JSON object in the required schema — no other text."},
            ]
            if has_image:
                retry_response = await nvidia_nim.send_multimodal_request(
                    retry_messages, request.image_b64, request.image_mime or "image/jpeg"
                )
            else:
                retry_response = await nvidia_nim.send_text_request(retry_messages)
            if not retry_response.get("error"):
                raw_text = nvidia_nim.extract_text(retry_response)

        triage = prompt_engine.parse_triage_json(raw_text)

    if not triage.get("disclaimer"):
        triage["disclaimer"] = prompt_engine.DEFAULT_DISCLAIMER

    reply = triage.get("reply") or triage.get("urgency_reason") or ""
    status = triage.get("assessment_status", "gathering")

    # ── 5. Specialist routing / handoff ───────────────────────────────────────
    # The model recommends a specialist each turn; if a concrete (non-general) specialty
    # emerges and differs from the current one, hand the session over to that agent.
    recommended = specialists.resolve_specialty(triage.get("specialist_type"))
    handoff = False
    if recommended != specialists.DEFAULT_SPECIALTY and recommended != active_specialty:
        session.assigned_specialty = recommended
        handoff = True
        logger.info("handoff | session=%s | %s -> %s", session_id, active_specialty, recommended)
    elif session.assigned_specialty is None:
        session.assigned_specialty = active_specialty  # lock in General Physician explicitly

    current_specialty = session.assigned_specialty or specialists.DEFAULT_SPECIALTY

    # ── 6. Persist both turns ─────────────────────────────────────────────────
    ctx.add_message(str(uuid.uuid4()), "user", request.message, image_included=has_image)
    assistant_id = str(uuid.uuid4())
    ctx.add_message(
        assistant_id, "assistant", reply or json.dumps(triage), triage_json=json.dumps(triage)
    )

    # ── 7. On conclusion, snapshot the triage as the session summary (dashboard) ─
    if status == "concluded":
        session.summary_json = json.dumps({
            "possible_conditions": triage.get("possible_conditions", []),
            "urgency_tier": triage.get("urgency_tier"),
            "urgency_reason": triage.get("urgency_reason"),
            "specialist_type": triage.get("specialist_type"),
            "specialty": current_specialty,
            "specialty_display": specialists.display_name(current_specialty),
            "concluded_at": datetime.now(timezone.utc).isoformat(),
        })
    db.commit()

    return ChatResponse(
        session_id=session_id,
        message_id=assistant_id,
        reply=reply,
        triage=triage,
        assessment_status=status,
        specialty=current_specialty,
        specialty_display=specialists.display_name(current_specialty),
        handoff=handoff,
    )
