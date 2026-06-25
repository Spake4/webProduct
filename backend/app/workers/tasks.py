import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.models.task import Task
from app.models.gallery import GalleryItem
from app.services.comfyui import ComfyUIService
from app.services.storage import StorageService
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _make_session() -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def run_async(coro):  # type: ignore[no-untyped-def]
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3)  # type: ignore[misc]
def process_task(self, task_id: str) -> None:
    run_async(_process_task_async(task_id))


async def _set_progress(db: AsyncSession, task: Task, progress: int) -> None:
    task.progress = progress
    await db.commit()


async def _process_task_async(task_id: str) -> None:
    comfyui = ComfyUIService()
    storage = StorageService()
    SessionLocal = _make_session()

    async with SessionLocal() as db:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            logger.error(f"Task {task_id} not found")
            return

        from app.models.service import Service
        svc_result = await db.execute(select(Service).where(Service.id == task.service_id))
        service = svc_result.scalar_one_or_none()

        if not service:
            await _fail_task(db, task, "Сервис не найден")
            return

        try:
            task.status = "processing"
            task.progress = 5
            await db.commit()

            # Download and upload input image to ComfyUI
            input_bytes = storage.download_from_url(task.input_image_url)
            comfy_filename = await comfyui.upload_image(input_bytes, f"input_{task_id}.png")
            await _set_progress(db, task, 15)

            # Inject workflow params
            workflow = comfyui.inject_image_into_workflow(
                service.comfyui_workflow,
                comfy_filename,
                task.params or {},
            )

            # Queue prompt in ComfyUI
            prompt_id = await comfyui.queue_prompt(workflow)
            task.comfyui_prompt_id = prompt_id
            await _set_progress(db, task, 25)

            # Wait for ComfyUI to finish, updating progress in real time
            async def update_progress(pct: int) -> None:
                await _set_progress(db, task, pct)

            history = await comfyui.wait_for_completion(
                prompt_id, on_progress=update_progress
            )

            # Download result and upload to storage
            output_bytes = await comfyui.get_output_image(history)
            if not output_bytes:
                await _fail_task(db, task, "ComfyUI не вернул изображение")
                return

            output_url = storage.upload_bytes(output_bytes, f"output_{task_id}.png")

            task.status = "completed"
            task.progress = 100
            task.output_image_url = output_url
            task.completed_at = datetime.now(timezone.utc)

            gallery_item = GalleryItem(
                task_id=task_id,
                user_id=task.user_id,
                output_image_url=output_url,
                is_public=True,
            )
            db.add(gallery_item)
            await db.commit()

        except Exception as exc:
            logger.exception(f"Task {task_id} failed: {exc}")
            await _fail_task(db, task, str(exc))


async def _fail_task(db: AsyncSession, task: Task, error: str) -> None:
    task.status = "failed"
    task.progress = 0
    task.error_msg = error
    task.completed_at = datetime.now(timezone.utc)
    await db.commit()
