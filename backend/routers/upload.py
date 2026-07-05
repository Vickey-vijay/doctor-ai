"""Upload router — POST /upload — validates and preprocesses an image into base64 (in memory only)."""
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from models import User
from routers.auth import get_current_user
from services.image_pipeline import process_image, ImageError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict:
    """Accept a JPEG/PNG/WEBP upload and return {image_b64, mime_type, original_filename}."""
    file_bytes = await file.read()
    try:
        result = process_image(
            file_bytes=file_bytes,
            content_type=(file.content_type or "").lower(),
            filename=file.filename or "upload",
        )
    except ImageError as exc:
        # Expected validation failures → 400 with a clear, user-facing message.
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error while processing upload.")
        raise HTTPException(status_code=500, detail="Failed to process the image.") from exc
    return result
