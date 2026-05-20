from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB
from app.models.service import Service
from app.schemas.service import ServiceOut

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
async def list_services(db: DB) -> list[ServiceOut]:
    result = await db.execute(
        select(Service).where(Service.is_active == True).order_by(Service.category, Service.name)
    )
    services = result.scalars().all()
    return [ServiceOut.model_validate(s) for s in services]


@router.get("/{slug}", response_model=ServiceOut)
async def get_service(slug: str, db: DB) -> ServiceOut:
    result = await db.execute(select(Service).where(Service.slug == slug))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Сервис не найден")
    return ServiceOut.model_validate(service)
