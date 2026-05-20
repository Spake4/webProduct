import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.deps import CurrentUser
from app.services.storage import StorageService
from app.schemas.task import UploadResponse

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


@router.post("", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    _user: CurrentUser = None,  # type: ignore[assignment]
) -> UploadResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Только JPG, PNG, WEBP")

    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Файл слишком большой (макс {MAX_SIZE_MB}MB)")

    storage = StorageService()
    filename = f"{uuid.uuid4().hex}_{file.filename or 'image.png'}"
    url = storage.upload_bytes(data, filename, file.content_type or "image/jpeg")

    return UploadResponse(url=url, filename=filename)
