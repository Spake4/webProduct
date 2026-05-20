from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.schemas.service import ServiceOut


class TaskCreate(BaseModel):
    service_id: str
    input_image_url: str
    params: dict[str, Any] = {}


class TaskOut(BaseModel):
    id: str
    user_id: str
    service_id: str
    service: ServiceOut | None = None
    status: str
    input_image_url: str
    output_image_url: str | None = None
    params: dict[str, Any]
    created_at: datetime
    completed_at: datetime | None = None
    error_msg: str | None = None

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    items: list[TaskOut]
    total: int
    page: int
    per_page: int


class UploadResponse(BaseModel):
    url: str
    filename: str
