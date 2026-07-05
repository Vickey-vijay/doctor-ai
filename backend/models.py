"""SQLAlchemy ORM models for MediQuick AI: User, Session, and Message."""
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """A registered user — owns triage sessions and an optional health profile."""

    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)

    # ── Optional health profile (collected at registration or later) ────────────
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)            # "male" / "female" / "other"
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    allergies = Column(Text, nullable=True)
    known_conditions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Session.created_at.desc()",
    )


class Session(Base):
    """Represents a triage chat session — holds metadata and links to messages."""

    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String, nullable=False)

    # The specialist agent currently handling this session (canonical key, e.g. "dermatology").
    assigned_specialty = Column(String, nullable=True)
    # Snapshot of the latest concluded triage (JSON) — powers the dashboard summary.
    summary_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="sessions")
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="Message.timestamp",
    )


class Message(Base):
    """Represents a single user or assistant message within a triage session."""

    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)         # "user" or "assistant"
    content = Column(Text, nullable=False)        # natural-language text shown in chat
    image_included = Column(Boolean, default=False)
    triage_json = Column(Text, nullable=True)     # JSON-encoded triage card (assistant only)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="messages")
