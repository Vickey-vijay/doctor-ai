"""End-to-end API tests via TestClient — auth, session ownership, and the /chat flow.

The NVIDIA NIM client is always monkeypatched here so no test ever makes a real network call.
"""
import json
import uuid
from unittest.mock import AsyncMock

CANNED_TRIAGE = {
    "reply": "Thanks for sharing that. How long have you had this headache?",
    "assessment_status": "gathering",
    "possible_conditions": [],
    "urgency_tier": "self_care",
    "urgency_reason": "Not enough information yet to assess urgency.",
    "specialist_type": "General Physician",
    "follow_up_questions": ["How long have you had this headache?"],
    "disclaimer": "This is a preliminary triage assessment, not a medical diagnosis.",
}


def _canned_nim_response() -> dict:
    """Shape a canned response exactly like the real NIM chat/completions payload."""
    return {"choices": [{"message": {"content": json.dumps(CANNED_TRIAGE)}}]}


def _mock_nim(monkeypatch) -> None:
    """Patch both NIM entry points so /chat never hits the real network during tests."""
    monkeypatch.setattr(
        "services.nvidia_nim.send_text_request", AsyncMock(return_value=_canned_nim_response())
    )
    monkeypatch.setattr(
        "services.nvidia_nim.send_multimodal_request", AsyncMock(return_value=_canned_nim_response())
    )


# ── Meta ─────────────────────────────────────────────────────────────────────────
def test_health(client):
    """/health returns a simple ok status."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Auth ─────────────────────────────────────────────────────────────────────────
def test_register_then_login_happy_path(client):
    """A newly registered user can immediately log in with the same credentials."""
    email = f"reg_{uuid.uuid4().hex[:10]}@example.com"
    password = "GoodPass123"

    reg = client.post("/auth/register", json={
        "email": email, "password": password, "full_name": "Reg User",
    })
    assert reg.status_code == 200, reg.text
    assert reg.json()["user"]["email"] == email
    assert reg.json()["access_token"]

    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    assert login.json()["access_token"]


def test_login_wrong_password_rejected(client):
    """Logging in with an incorrect password is rejected with 401."""
    email = f"wrong_{uuid.uuid4().hex[:10]}@example.com"
    client.post("/auth/register", json={
        "email": email, "password": "GoodPass123", "full_name": "User",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "BadPassword"})
    assert resp.status_code == 401


# ── Protected routes reject unauthenticated requests ──────────────────────────────
def test_sessions_requires_auth(client):
    """GET /sessions returns 401 without a Bearer token."""
    assert client.get("/sessions").status_code == 401


def test_dashboard_requires_auth(client):
    """GET /dashboard returns 401 without a Bearer token."""
    assert client.get("/dashboard").status_code == 401


def test_chat_requires_auth(client):
    """POST /chat returns 401 without a Bearer token."""
    resp = client.post("/chat", json={"message": "I have a headache"})
    assert resp.status_code == 401


def test_upload_requires_auth(client):
    """POST /upload returns 401 without a Bearer token."""
    resp = client.post("/upload", files={"file": ("test.jpg", b"fake-bytes", "image/jpeg")})
    assert resp.status_code == 401


# ── Dashboard ─────────────────────────────────────────────────────────────────────
def test_dashboard_with_valid_token_returns_expected_keys(client, auth_headers):
    """A fresh user's dashboard has the expected shape and zero sessions."""
    resp = client.get("/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"user", "stats", "resolutions"}
    assert body["stats"]["total_sessions"] == 0
    assert body["stats"]["concluded_sessions"] == 0
    assert body["resolutions"] == []


# ── Session ownership isolation ───────────────────────────────────────────────────
def test_cannot_read_another_users_session(client, make_auth_headers, monkeypatch):
    """A session created by one user is invisible (404) to a different user."""
    _mock_nim(monkeypatch)
    headers_a = make_auth_headers()
    headers_b = make_auth_headers()

    created = client.post("/chat", json={"message": "I have a persistent rash"}, headers=headers_a)
    assert created.status_code == 200, created.text
    session_id = created.json()["session_id"]

    own_view = client.get(f"/sessions/{session_id}/messages", headers=headers_a)
    assert own_view.status_code == 200

    other_view = client.get(f"/sessions/{session_id}/messages", headers=headers_b)
    assert other_view.status_code == 404


# ── /chat with mocked NIM ─────────────────────────────────────────────────────────
def test_chat_happy_path_with_mocked_nim(client, auth_headers, monkeypatch):
    """A /chat turn with the NIM client mocked returns the parsed triage schema, no network call."""
    _mock_nim(monkeypatch)
    resp = client.post(
        "/chat",
        json={"message": "I have had a mild headache since this morning."},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["session_id"]
    assert body["assessment_status"] == "gathering"
    assert body["triage"]["urgency_tier"] == "self_care"
    assert body["specialty"] == "general_physician"
    assert body["specialty_display"] == "General Physician"


def test_chat_creates_session_visible_in_sessions_list(client, auth_headers, monkeypatch):
    """After a /chat turn, the new session shows up in GET /sessions for that user."""
    _mock_nim(monkeypatch)
    chat_resp = client.post("/chat", json={"message": "My throat hurts"}, headers=auth_headers)
    assert chat_resp.status_code == 200
    session_id = chat_resp.json()["session_id"]

    listing = client.get("/sessions", headers=auth_headers)
    assert listing.status_code == 200
    ids = [s["id"] for s in listing.json()]
    assert session_id in ids
