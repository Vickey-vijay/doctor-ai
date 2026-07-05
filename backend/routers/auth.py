"""Auth router — register, login, current-user, and profile update. Also exposes get_current_user."""
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import User
from services import security

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    """Body for POST /auth/register."""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=120)
    age: int | None = Field(default=None, ge=0, le=120)
    sex: str | None = None
    height_cm: float | None = Field(default=None, ge=0, le=300)
    weight_kg: float | None = Field(default=None, ge=0, le=500)
    allergies: str | None = None
    known_conditions: str | None = None


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    """Body for PUT /auth/profile — all fields optional."""
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    age: int | None = Field(default=None, ge=0, le=120)
    sex: str | None = None
    height_cm: float | None = Field(default=None, ge=0, le=300)
    weight_kg: float | None = Field(default=None, ge=0, le=500)
    allergies: str | None = None
    known_conditions: str | None = None


def _user_public(user: User) -> dict:
    """Serialise a User to a safe public dict (never includes the password hash)."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "age": user.age,
        "sex": user.sex,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "allergies": user.allergies,
        "known_conditions": user.known_conditions,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Dependency: resolve the current user from the Bearer token ─────────────────
def get_current_user(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> User:
    """Validate the Authorization: Bearer <jwt> header and return the matching User, or 401."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1].strip()
    user_id = security.decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/register")
async def register(body: RegisterRequest, db: DbSession = Depends(get_db)) -> dict:
    """Create a new account and return an access token plus the public user object."""
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=security.hash_password(body.password),
        full_name=body.full_name.strip(),
        age=body.age,
        sex=body.sex,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        allergies=body.allergies,
        known_conditions=body.known_conditions,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("new user registered | %s", email)
    token = security.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _user_public(user)}


@router.post("/login")
async def login(body: LoginRequest, db: DbSession = Depends(get_db)) -> dict:
    """Authenticate by email + password and return an access token plus the public user object."""
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not security.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = security.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _user_public(user)}


@router.get("/me")
async def me(user: User = Depends(get_current_user)) -> dict:
    """Return the currently authenticated user's public profile."""
    return _user_public(user)


@router.put("/profile")
async def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
) -> dict:
    """Update the current user's profile fields (only those provided)."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _user_public(user)
