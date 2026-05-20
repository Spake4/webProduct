from fastapi import APIRouter
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DB
from app.models.gallery import GalleryItem
from app.models.task import Task
from app.schemas.gallery import GalleryItemOut, GalleryResponse

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("", response_model=GalleryResponse)
async def get_gallery(db: DB, page: int = 1, per_page: int = 20) -> GalleryResponse:
    offset = (page - 1) * per_page

    count_result = await db.execute(
        select(func.count()).select_from(GalleryItem).where(GalleryItem.is_public == True)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(GalleryItem)
        .options(
            selectinload(GalleryItem.task).selectinload(Task.service)
        )
        .where(GalleryItem.is_public == True)
        .order_by(GalleryItem.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items = result.scalars().all()

    out = []
    for item in items:
        item_dict = {
            "id": item.id,
            "task_id": item.task_id,
            "user_id": item.user_id,
            "output_image_url": item.output_image_url,
            "likes_count": item.likes_count,
            "is_public": item.is_public,
            "created_at": item.created_at,
            "service": item.task.service if item.task else None,
        }
        out.append(GalleryItemOut.model_validate(item_dict))

    return GalleryResponse(items=out, total=total, page=page, per_page=per_page)


@router.post("/{item_id}/like")
async def like_item(item_id: str, _user: CurrentUser, db: DB) -> dict:
    result = await db.execute(select(GalleryItem).where(GalleryItem.id == item_id))
    item = result.scalar_one_or_none()
    if item:
        item.likes_count += 1
        await db.commit()
    return {"ok": True}
