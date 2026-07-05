"""Password hashing (PBKDF2-SHA256) and JWT issue/verify helpers."""
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from config import settings

# PBKDF2-SHA256 is pure-Python — no native compiler needed on Windows, and it is a
# sound, widely-used password hash. (bcrypt/argon2 would also work but add a build step.)
_pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Return a salted PBKDF2-SHA256 hash of the given plaintext password."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plaintext password against a stored hash."""
    try:
        return _pwd_context.verify(plain, hashed)
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    """Issue a signed JWT carrying the user id as the subject, with an expiry."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Verify a JWT and return its subject (user id), or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
