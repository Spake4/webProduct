# AI Image Editor

Веб-платформа для редактирования изображений с помощью искусственного интеллекта на базе ComfyUI и FLUX.1.

## Возможности

- 🚗 **Перекраска автомобиля** — смена цвета кузова с помощью AI
- 🖼️ **Реставрация фото** — восстановление старых повреждённых фото, удаление трещин и царапин, раскрашивание
- 🎨 **Аниме стиль** — превращение фото в иллюстрацию Studio Ghibli
- 🖌️ **Масляная живопись** — стилизация под классическое масло
- ✏️ **Карандашный скетч** — художественный рисунок карандашом
- 💧 **Акварель** — нежная акварельная живопись
- ✨ **Улучшение фото** — повышение качества и резкости через AI

## Стек

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS (тёмная тема, glass morphism)
- Framer Motion — анимации
- Zustand — состояние приложения
- React Query — запросы к API с polling
- Sonner — toast уведомления
- Before/After слайдер — сравнение результатов

### Backend
- **FastAPI** + Uvicorn — REST API
- **SQLAlchemy** (async) + **PostgreSQL** — база данных
- **Celery** + **Redis** — очередь и обработка задач
- **MinIO** — хранение изображений (S3-совместимое)
- **ComfyUI** — AI движок (FLUX.1-dev-kontext BF16)
- **JWT** — авторизация

## Быстрый старт

### Требования
- Docker & Docker Compose
- GPU с поддержкой CUDA (рекомендуется 24GB+ VRAM)
- ComfyUI с моделями FLUX.1

### Установка

```bash
git clone https://github.com/Spake4/webProduct.git
cd webProduct

# Настройка окружения
cp backend/.env.example backend/.env
# Заполните backend/.env своими значениями

# Запуск
docker compose up -d
```

Сайт: `http://localhost:3000`  
API docs: `http://localhost:8000/api/docs`

### Переменные окружения

Создайте `backend/.env` на основе `backend/.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@postgres:5432/ai_editor
REDIS_URL=redis://:PASSWORD@redis:6379/0
SECRET_KEY=your-secret-key-32-chars-minimum
STORAGE_ENDPOINT=http://minio:9000
STORAGE_ACCESS_KEY=your-minio-user
STORAGE_SECRET_KEY=your-minio-password
STORAGE_BUCKET=ai-editor
STORAGE_PUBLIC_URL=http://YOUR_FRONTEND_IP/storage/ai-editor
COMFYUI_URL=http://host.docker.internal:8189
ALLOWED_ORIGINS=["http://YOUR_FRONTEND_IP","http://localhost:3000"]
```

### Модели ComfyUI

Поместите модели в `/opt/ComfyUI/models/`:

| Файл | Папка | Размер | Назначение |
|------|-------|--------|-----------|
| `flux1-kontext-dev.safetensors` | `diffusion_models/` | 23 GB | Основная модель BF16 |
| `flux1-dev-Q8_0.gguf` | `unet/` | 17 GB | Улучшение фото (Q8) |
| `ae.safetensors` | `vae/` | 335 MB | VAE декодер |
| `clip_l.safetensors` | `clip/` | 246 MB | CLIP энкодер |
| `t5xxl_fp8_e4m3fn_scaled.safetensors` | `text_encoders/` | 9.8 GB | T5 энкодер |

## Структура проекта

```
webProduct/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BeforeAfterSlider/   # Слайдер до/после
│   │   │   ├── EditorWorkspace/     # Рабочая область редактора
│   │   │   ├── ImageUploader/       # Загрузка изображений
│   │   │   ├── ProgressTracker/     # Отслеживание прогресса
│   │   │   ├── ResultViewer/        # Просмотр результата
│   │   │   └── ServiceCard/         # Карточка сервиса
│   │   ├── pages/
│   │   │   ├── Home/                # Главная с витриной сервисов
│   │   │   ├── Editor/              # AI редактор
│   │   │   ├── Gallery/             # Галерея работ
│   │   │   └── Profile/             # Профиль и история
│   │   ├── api/                     # React Query хуки
│   │   ├── stores/                  # Zustand состояние
│   │   └── types/                   # TypeScript типы
│   └── public/previews/             # Превью до/после для сервисов
│
└── backend/
    ├── app/
    │   ├── api/routes/
    │   │   ├── auth.py              # Регистрация и вход
    │   │   ├── tasks.py             # Создание и polling задач
    │   │   ├── services.py          # Список AI сервисов
    │   │   ├── upload.py            # Загрузка изображений
    │   │   └── gallery.py           # Публичная галерея
    │   ├── models/                  # SQLAlchemy модели (User, Task, Service, Gallery)
    │   ├── schemas/                 # Pydantic схемы
    │   ├── services/
    │   │   ├── comfyui.py           # Интеграция с ComfyUI + progress tracking
    │   │   └── storage.py           # MinIO через boto3
    │   ├── workers/
    │   │   └── tasks.py             # Celery воркер обработки задач
    │   └── main.py                  # FastAPI приложение + ComfyUI workflows
    └── alembic/                     # Миграции БД
```

## Архитектура обработки задач

```
Пользователь → Upload image → MinIO
            → POST /tasks/create → PostgreSQL (status: pending)
                                 → Redis (Celery queue)
                                    ↓
                            Celery Worker
                            ├── Скачивает фото из MinIO (S3)
                            ├── Загружает в ComfyUI
                            ├── Ставит в очередь ComfyUI
                            ├── Обновляет progress (5→25→50→90%)
                            ├── Скачивает результат
                            └── Сохраняет в MinIO → PostgreSQL (status: completed)
                                    ↓
Frontend polling GET /tasks/{id} каждые 2 сек → показывает прогресс
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/v1/auth/register` | Регистрация |
| `POST` | `/api/v1/auth/login` | Вход (JWT) |
| `GET` | `/api/v1/services` | Список AI сервисов |
| `POST` | `/api/v1/upload` | Загрузка изображения в MinIO |
| `POST` | `/api/v1/tasks/create` | Создать задачу обработки |
| `GET` | `/api/v1/tasks/{id}` | Статус + прогресс задачи |
| `GET` | `/api/v1/gallery` | Публичная галерея результатов |

Swagger UI: `http://localhost:8000/api/docs`

## Лицензия

MIT
