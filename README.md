# AI Image Editor

Веб-платформа для редактирования изображений с помощью искусственного интеллекта на базе ComfyUI и FLUX.1.

![AI Editor](frontend/public/previews/car-recolor-after.jpg)

## Возможности

- 🚗 **Перекраска автомобиля** — смена цвета кузова с помощью AI
- 🖼️ **Реставрация портрета** — восстановление старых повреждённых фото, раскрашивание
- 🎨 **Аниме стиль** — превращение фото в иллюстрацию Studio Ghibli
- 🖌️ **Масляная живопись** — стилизация под классическое масло
- ✏️ **Карандашный скетч** — художественный рисунок карандашом
- 💧 **Акварель** — нежная акварельная живопись
- ✨ **Улучшение фото** — повышение качества и резкости через AI

## Стек

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS (тёмная тема, glass morphism)
- Framer Motion, Zustand, React Query
- Sonner (уведомления), Before/After слайдер

**Backend**
- FastAPI + SQLAlchemy (async) + PostgreSQL
- Celery + Redis (очередь задач)
- MinIO (хранение изображений)
- ComfyUI + FLUX.1-dev-kontext (BF16) — AI движок

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

### Переменные окружения

Создайте `backend/.env` на основе `backend/.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@postgres:5432/ai_editor
REDIS_URL=redis://:PASSWORD@redis:6379/0
SECRET_KEY=your-secret-key-here
STORAGE_ENDPOINT=http://minio:9000
STORAGE_ACCESS_KEY=your-minio-user
STORAGE_SECRET_KEY=your-minio-password
STORAGE_BUCKET=ai-editor
STORAGE_PUBLIC_URL=http://YOUR_SERVER_IP/storage/ai-editor
COMFYUI_URL=http://host.docker.internal:8189
```

### Модели ComfyUI

Для работы сервисов необходимо скачать модели в папку `/opt/ComfyUI/models/`:

| Файл | Папка | Назначение |
|------|-------|-----------|
| `flux1-kontext-dev.safetensors` | `diffusion_models/` | Основная модель (23GB, BF16) |
| `flux1-dev-Q8_0.gguf` | `unet/` | Улучшение фото (17GB, Q8) |
| `ae.safetensors` | `vae/` | VAE |
| `clip_l.safetensors` | `clip/` | CLIP энкодер |
| `t5xxl_fp8_e4m3fn_scaled.safetensors` | `text_encoders/` | T5 энкодер |

## Структура проекта

```
webProduct/
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы
│   │   ├── api/            # React Query хуки
│   │   └── stores/         # Zustand стор
│   └── public/previews/    # Превью сервисов (до/после)
├── backend/                # FastAPI приложение
│   └── app/
│       ├── api/routes/     # Эндпоинты
│       ├── models/         # SQLAlchemy модели
│       ├── schemas/        # Pydantic схемы
│       ├── services/       # ComfyUI, MinIO интеграции
│       └── workers/        # Celery задачи
└── docker-compose.yml
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/v1/auth/register` | Регистрация |
| `POST` | `/api/v1/auth/login` | Вход |
| `GET` | `/api/v1/services` | Список сервисов |
| `POST` | `/api/v1/upload` | Загрузка изображения |
| `POST` | `/api/v1/tasks/create` | Создать задачу |
| `GET` | `/api/v1/tasks/{id}` | Статус задачи (polling) |
| `GET` | `/api/v1/gallery` | Публичная галерея |

Документация: `http://localhost:8000/api/docs`

## Лицензия

MIT
