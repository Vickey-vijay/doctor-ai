"""Multi-turn conversation context — loads SQLite history and builds the NIM messages array."""
import logging

from sqlalchemy.orm import Session as DbSession

from config import settings
from models import Message

logger = logging.getLogger(__name__)


class ContextManager:
    """Accumulates a session's prior messages and formats them for the NVIDIA NIM API."""

    def __init__(self, db: DbSession, session_id: str):
        """Bind the manager to a database session and a triage chat session id."""
        self.db = db
        self.session_id = session_id

    def _history(self) -> list[Message]:
        """Return this session's messages ordered oldest-first."""
        return (
            self.db.query(Message)
            .filter(Message.session_id == self.session_id)
            .order_by(Message.timestamp.asc())
            .all()
        )

    def get_nim_messages(self) -> list[dict]:
        """Build the prior-turns messages array for NIM, capped to the last N pairs to limit tokens."""
        rows = self._history()

        # Cap at the last MAX_CONTEXT_TURNS pairs (each pair ≈ user + assistant = 2 rows).
        max_rows = settings.max_context_turns * 2
        if len(rows) > max_rows:
            rows = rows[-max_rows:]

        messages: list[dict] = []
        for row in rows:
            content = row.content
            # When a past turn carried an image, leave a textual breadcrumb so the model has context
            # even though the raw image bytes are not replayed (privacy-by-design: images are never stored).
            if row.image_included and row.role == "user":
                content = f"{content}\n[Note: the user also uploaded an image with this message.]"
            messages.append({"role": row.role, "content": content})
        return messages

    def add_message(self, message_id: str, role: str, content: str,
                    triage_json: str | None = None, image_included: bool = False) -> Message:
        """Persist a single user/assistant message to SQLite and return the ORM row."""
        row = Message(
            id=message_id,
            session_id=self.session_id,
            role=role,
            content=content,
            triage_json=triage_json,
            image_included=image_included,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row
