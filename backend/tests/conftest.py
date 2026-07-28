"""Shared pytest fixtures: an isolated temp SQLite DB, a TestClient, and authenticated users.

The real backend/.env pins DATABASE_URL to sqlite:///./mediquick.db, so the temp-file DB
override below MUST happen before any backend module (config/database/main) is imported —
otherwise the app would bind to the real production database.
"""
import os
import sys
import uuid
import atexit
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# ── Point at an isolated temp SQLite file before config.py's load_dotenv() can read .env ──
# python-dotenv's load_dotenv() does not override variables already present in os.environ,
# so setting this first guarantees the real mediquick.db is never touched by tests.
_TMP_DB_FD, _TMP_DB_PATH = tempfile.mkstemp(suffix=".db", prefix="mediquick_test_")
os.close(_TMP_DB_FD)
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB_PATH}"
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-key-not-a-real-key")


def _cleanup_tmp_db() -> None:
    """Best-effort removal of the temp test database file on interpreter exit."""
    try:
        os.remove(_TMP_DB_PATH)
    except OSError:
        pass


atexit.register(_cleanup_tmp_db)

import pytest  # noqa: E402 — must follow the DATABASE_URL override above
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

import models  # noqa: E402,F401 — side-effect import registers ORM models on Base.metadata
from database import Base, engine, get_db  # noqa: E402
from main import app  # noqa: E402

# Create all tables once against the isolated temp-file engine.
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    """Yield a DB session bound to the isolated test database, in place of the real get_db."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture()
def client():
    """A TestClient wired to the isolated test database (never the real mediquick.db)."""
    with TestClient(app) as test_client:
        yield test_client


def _register_and_login(client: TestClient, email: str | None = None,
                         password: str = "TestPass123", full_name: str = "Test User") -> dict:
    """Register a fresh user (or reuse the given email) and log in; return a Bearer header dict."""
    email = email or f"test_{uuid.uuid4().hex[:12]}@example.com"
    client.post("/auth/register", json={
        "email": email, "password": password, "full_name": full_name,
    })
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def make_auth_headers(client):
    """Factory fixture: call to register+login a brand-new user and get their auth header."""
    def _make(email: str | None = None) -> dict:
        return _register_and_login(client, email=email)
    return _make


@pytest.fixture()
def auth_headers(make_auth_headers):
    """A ready-made Bearer auth header for a single fresh, logged-in test user."""
    return make_auth_headers()
