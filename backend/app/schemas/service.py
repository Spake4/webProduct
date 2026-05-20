from pydantic import BaseModel


class ServiceOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category: str
    icon: str
    is_active: bool
    preview_url: str | None = None

    model_config = {"from_attributes": True}
