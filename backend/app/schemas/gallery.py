from datetime import datetime
from pydantic import BaseModel

from app.schemas.service import ServiceOut


class GalleryItemOut(BaseModel):
    id: str
    task_id: str
    user_id: str
    output_image_url: str
    likes_count: int
    is_public: bool
    created_at: datetime
    service: ServiceOut | None = None

    model_config = {"from_attributes": True}


class GalleryResponse(BaseModel):
    items: list[GalleryItemOut]
    total: int
    page: int
    per_page: int
