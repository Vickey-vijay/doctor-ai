"""SQLAlchemy SQLite database setup, session management, and table initialisation."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

# check_same_thread=False is required for SQLite used with FastAPI async
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def create_tables() -> None:
    """Create all database tables if they do not already exist."""
    import models  # noqa: F401 — side-effect import registers models on Base.metadata
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a database session and ensure it is closed after the request completes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
