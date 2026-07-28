"""Unit tests for image validation/preprocessing in services/image_pipeline.py."""
import base64
import io

import pytest
from PIL import Image

from services.image_pipeline import process_image, ImageError, MAX_SIDE_PX


def _jpeg_bytes(width: int = 200, height: int = 150, color=(120, 40, 200)) -> bytes:
    """Build an in-memory JPEG image and return its raw bytes."""
    buf = io.BytesIO()
    Image.new("RGB", (width, height), color=color).save(buf, format="JPEG")
    return buf.getvalue()


def _png_bytes(width: int = 200, height: int = 150, color=(10, 200, 40)) -> bytes:
    """Build an in-memory PNG image and return its raw bytes."""
    buf = io.BytesIO()
    Image.new("RGB", (width, height), color=color).save(buf, format="PNG")
    return buf.getvalue()


def test_process_image_valid_jpeg_returns_base64():
    """A valid JPEG upload is accepted and returns a non-empty base64 payload."""
    result = process_image(_jpeg_bytes(), "image/jpeg", "photo.jpg")
    assert result["mime_type"] == "image/jpeg"
    assert result["original_filename"] == "photo.jpg"
    assert len(result["image_b64"]) > 0
    decoded = Image.open(io.BytesIO(base64.b64decode(result["image_b64"])))
    assert decoded.format == "JPEG"


def test_process_image_valid_png_returns_base64():
    """A valid PNG upload is accepted, validated, and re-encoded to JPEG."""
    result = process_image(_png_bytes(), "image/png", "photo.png")
    assert result["mime_type"] == "image/jpeg"
    assert len(result["image_b64"]) > 0
    decoded = Image.open(io.BytesIO(base64.b64decode(result["image_b64"])))
    assert decoded.format == "JPEG"


def test_process_image_oversized_rejected():
    """An image larger than the configured MAX_IMAGE_SIZE_MB is rejected before decoding."""
    oversized = b"\xff" * (6 * 1024 * 1024)  # 6 MB > default 5 MB limit
    with pytest.raises(ImageError):
        process_image(oversized, "image/jpeg", "huge.jpg")


def test_process_image_wrong_mime_rejected():
    """An unsupported MIME type is rejected regardless of the actual bytes."""
    with pytest.raises(ImageError):
        process_image(_jpeg_bytes(), "application/pdf", "file.pdf")


def test_process_image_non_image_bytes_rejected():
    """Bytes that are not a decodable image are rejected even with an allowed MIME type."""
    with pytest.raises(ImageError):
        process_image(b"this is definitely not an image", "image/jpeg", "fake.jpg")


def test_process_image_large_image_downscaled():
    """An oversized image is downscaled so its longest side never exceeds MAX_SIDE_PX."""
    big = _jpeg_bytes(width=2000, height=1500)
    result = process_image(big, "image/jpeg", "big.jpg")
    decoded = Image.open(io.BytesIO(base64.b64decode(result["image_b64"])))
    assert max(decoded.width, decoded.height) <= MAX_SIDE_PX
