"""Environment configuration loader using python-dotenv."""
import os
import logging
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Centralised config — every value comes from the .env file, never hardcoded."""

    nvidia_nim_api_key: str = os.environ.get("NVIDIA_NIM_API_KEY", "")
    nvidia_nim_model: str = os.environ.get(
        "NVIDIA_NIM_MODEL", "meta/llama-3.2-90b-vision-instruct"
    )
    database_url: str = os.environ.get("DATABASE_URL", "sqlite:///./mediquick.db")
    max_image_size_mb: int = int(os.environ.get("MAX_IMAGE_SIZE_MB", "5"))
    max_context_turns: int = int(os.environ.get("MAX_CONTEXT_TURNS", "10"))
    log_level: str = os.environ.get("LOG_LEVEL", "INFO")

    # ── Authentication ──────────────────────────────────────────────────────────
    jwt_secret: str = os.environ.get("JWT_SECRET", "change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = int(os.environ.get("JWT_EXPIRE_HOURS", "168"))  # 7 days


settings = Settings()
