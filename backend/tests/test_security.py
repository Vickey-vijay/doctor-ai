"""Unit tests for password hashing and JWT helpers in services/security.py."""
from services import security


def test_hash_password_round_trip():
    """A password hashed then verified with the same plaintext succeeds."""
    hashed = security.hash_password("Sup3rSecret!")
    assert hashed != "Sup3rSecret!"
    assert security.verify_password("Sup3rSecret!", hashed) is True


def test_verify_password_wrong_password_rejected():
    """Verifying with the wrong plaintext password fails."""
    hashed = security.hash_password("CorrectHorse")
    assert security.verify_password("WrongPassword", hashed) is False


def test_verify_password_garbage_hash_returns_false():
    """An invalid/garbage hash string is rejected rather than raising."""
    assert security.verify_password("whatever", "not-a-valid-hash") is False


def test_create_and_decode_access_token_round_trip():
    """A token created for a user id decodes back to that same id."""
    token = security.create_access_token("user-123")
    assert security.decode_access_token(token) == "user-123"


def test_decode_access_token_tampered_returns_none():
    """A token with a corrupted signature fails verification and returns None."""
    token = security.create_access_token("user-456")
    header, payload, signature = token.split(".")
    # Corrupt an EARLY signature character, not the last one: base64url's final character
    # carries only padding bits, so several different characters decode to the same signature
    # bytes and the token would still verify (that made this assertion flaky).
    tampered_signature = ("B" if signature[0] != "B" else "C") + signature[1:]
    tampered = f"{header}.{payload}.{tampered_signature}"
    assert security.decode_access_token(tampered) is None


def test_decode_access_token_garbage_returns_none():
    """Decoding a non-JWT string returns None instead of raising."""
    assert security.decode_access_token("this.is.not.a.jwt") is None


def test_decode_access_token_empty_string_returns_none():
    """Decoding an empty string returns None instead of raising."""
    assert security.decode_access_token("") is None
