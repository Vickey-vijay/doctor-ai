"""Dashboard router — GET /dashboard — summarised triage resolutions for the current user."""
import json
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import Session as ChatSession, Message, User
from routers.auth import get_current_user
from services import specialists

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def dashboard(
    user: User = Depends(get_current_user), db: DbSession = Depends(get_db)
) -> dict:
    """Return per-session concluded summaries plus simple aggregate stats for the user.

    Note: summaries contain conditions, urgency, and specialist only — no medication or
    prescription content, consistent with the triage-not-diagnose design.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    cards: list[dict] = []
    tier_counts = {"self_care": 0, "consult_doctor": 0, "seek_emergency": 0}

    for s in sessions:
        if not s.summary_json:
            continue  # only concluded sessions appear on the dashboard
        summary = json.loads(s.summary_json)
        tier = summary.get("urgency_tier")
        if tier in tier_counts:
            tier_counts[tier] += 1
        cards.append({
            "session_id": s.id,
            "title": s.title,
            "possible_conditions": summary.get("possible_conditions", []),
            "urgency_tier": tier,
            "urgency_reason": summary.get("urgency_reason"),
            "specialist_type": summary.get("specialist_type"),
            "specialty_display": summary.get("specialty_display")
            or specialists.display_name(s.assigned_specialty),
            "concluded_at": summary.get("concluded_at"),
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    return {
        "user": {"full_name": user.full_name, "email": user.email},
        "stats": {
            "total_sessions": len(sessions),
            "concluded_sessions": len(cards),
            "tier_counts": tier_counts,
        },
        "resolutions": cards,
    }
