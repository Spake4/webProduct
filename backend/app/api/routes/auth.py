from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import DB
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, AuthResponse, UserOut, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: DB) -> AuthResponse:
    # Check email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже используется")

    # Check username
    result2 = await db.execute(select(User).where(User.username == payload.username))
    if result2.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Имя пользователя занято")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        user=UserOut.model_validate(user),
        tokens=TokenResponse(access_token=token),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin, db: DB) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token(user.id)
    return AuthResponse(
        user=UserOut.model_validate(user),
        tokens=TokenResponse(access_token=token),
    )
