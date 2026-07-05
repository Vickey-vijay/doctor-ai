"""Image validation + preprocessing: validate, resize, re-encode JPEG, base64 — privacy by design.

Images are processed entirely in memory and never written to disk.
"""
import io
import base64
import logging

from PIL import Image

from config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIDE_PX = 1024     # NIM has image-size limits; cap the longest side
JPEG_QUALITY = 85


class ImageError(Exception):
    """Raised when an uploaded image is invalid, too large, or the wrong format."""


def process_image(file_bytes: bytes, content_type: str, filename: str) -> dict:
    """Validate and normalise an uploaded image, returning {image_b64, mime_type, original_filename}."""
    # ── Format check ────────────────────────────────────────────────────────
    if content_type not in ALLOWED_MIME:
        raise ImageError(
            f"Unsupported image type '{content_type}'. Please upload a JPEG, PNG, or WEBP image."
        )

    # ── Size check ──────────────────────────────────────────────────────────
    max_bytes = settings.max_image_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise ImageError(
            f"Image is too large ({len(file_bytes) / 1024 / 1024:.1f} MB). "
            f"Maximum allowed is {settings.max_image_size_mb} MB."
        )

    # ── Decode + validate it is a real image ──────────────────────────────────
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()  # cheap integrity check
        img = Image.open(io.BytesIO(file_bytes))  # reopen after verify() consumes the file
    except Exception as exc:  # noqa: BLE001 — any decode failure means an invalid image
        raise ImageError("The uploaded file is not a valid image.") from exc

    # ── Normalise colour mode ─────────────────────────────────────────────────
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # ── Resize (preserve aspect ratio) ────────────────────────────────────────
    img.thumbnail((MAX_SIDE_PX, MAX_SIDE_PX), Image.LANCZOS)

    # ── Re-encode as JPEG q85 and base64-encode ───────────────────────────────
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=JPEG_QUALITY)
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    logger.info("image processed | %s | %dx%d | %d B -> %d B (b64)",
                filename, img.width, img.height, len(file_bytes), len(image_b64))

    return {
        "image_b64": image_b64,
        "mime_type": "image/jpeg",
        "original_filename": filename,
    }
