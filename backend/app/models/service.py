import uuid

from sqlalchemy import String, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False, default="🔧")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    preview_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    comfyui_workflow: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="service", lazy="select")  # type: ignore[name-defined]
