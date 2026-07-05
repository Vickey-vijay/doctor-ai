"""Sessions router — list, fetch history, rename, and delete the current user's triage sessions."""
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import Session as ChatSession, Message, User
from routers.auth import get_current_user
from services import specialists

logger = logging.getLogger(__name__)
router = APIRouter(tags=["sessions"])


class RenameRequest(BaseModel):
    """Body for POST /sessions/{id}/rename."""
    title: str = Field(..., min_length=1, max_length=120)


def _owned_session(session_id: str, user: User, db: DbSession) -> ChatSession:
    """Fetch a session that belongs to the current user, or raise 404."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session


@router.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user), db: DbSession = Depends(get_db)
) -> list[dict]:
    """Return the current user's sessions newest-first, with specialist and summary metadata."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    out: list[dict] = []
    for s in sessions:
        count = db.query(Message).filter(Message.session_id == s.id).count()
        summary = json.loads(s.summary_json) if s.summary_json else None
        out.append({
            "id": s.id,
            "title": s.title,
            "specialty": s.assigned_specialty,
            "specialty_display": specialists.display_name(s.assigned_specialty),
            "urgency_tier": summary.get("urgency_tier") if summary else None,
            "concluded": summary is not None,
            "message_count": count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return out


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)
) -> dict:
    """Return the full ordered message history for one of the user's sessions."""
    session = _owned_session(session_id, user, db)
    rows = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    messages = [{
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "image_included": m.image_included,
        "triage": json.loads(m.triage_json) if m.triage_json else None,
        "timestamp": m.timestamp.isoformat() if m.timestamp else None,
    } for m in rows]

    return {
        "session_id": session_id,
        "title": session.title,
        "specialty": session.assigned_specialty,
        "specialty_display": specialists.display_name(session.assigned_specialty),
        "messages": messages,
    }


@router.post("/sessions/{session_id}/rename")
async def rename_session(
    session_id: str, body: RenameRequest,
    user: User = Depends(get_current_user), db: DbSession = Depends(get_db),
) -> dict:
    """Update a session's title and return the new value."""
    session = _owned_session(session_id, user, db)
    session.title = body.title.strip()
    db.commit()
    return {"session_id": session_id, "title": session.title}


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)
) -> dict:
    """Delete one of the user's sessions and all of its messages (cascade)."""
    session = _owned_session(session_id, user, db)
    db.delete(session)
    db.commit()
    return {"deleted": session_id}
