from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DB
from app.models.task import Task
from app.models.service import Service
from app.schemas.task import TaskCreate, TaskOut, TaskListResponse
from app.workers.tasks import process_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/create", response_model=TaskOut, status_code=201)
async def create_task(payload: TaskCreate, user: CurrentUser, db: DB) -> TaskOut:
    # Validate service
    svc_result = await db.execute(
        select(Service).where(Service.id == payload.service_id, Service.is_active == True)
    )
    service = svc_result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Сервис не найден или недоступен")

    # Create task
    task = Task(
        user_id=user.id,
        service_id=payload.service_id,
        input_image_url=payload.input_image_url,
        params=payload.params,
        status="pending",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Queue Celery task
    process_task.delay(task.id)

    # Load service for response
    result = await db.execute(
        select(Task).options(selectinload(Task.service)).where(Task.id == task.id)
    )
    task_with_svc = result.scalar_one()
    return TaskOut.model_validate(task_with_svc)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, user: CurrentUser, db: DB) -> TaskOut:
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.service))
        .where(Task.id == task_id, Task.user_id == user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return TaskOut.model_validate(task)


@router.get("", response_model=TaskListResponse)
async def list_tasks(user: CurrentUser, db: DB, page: int = 1, per_page: int = 20) -> TaskListResponse:
    offset = (page - 1) * per_page

    count_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.user_id == user.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Task)
        .options(selectinload(Task.service))
        .where(Task.user_id == user.id)
        .order_by(Task.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    tasks = result.scalars().all()

    return TaskListResponse(
        items=[TaskOut.model_validate(t) for t in tasks],
        total=total,
        page=page,
        per_page=per_page,
    )
