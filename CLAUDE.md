бщее описание проекта
Создай полноценный веб-сервис AI Image Editor — платформу для редактирования изображений с помощью искусственного интеллекта. Стилистически вдохновлён TensorArt: тёмная тема, неоновые акценты, современный dark UI с градиентами. Бэкенд обрабатывает запросы через ComfyUI.

🎨 Дизайн и стилистика (Frontend — React)
Общий стиль:

Тёмная тема (фон: #0d0d12 / #111118), как у TensorArt
Акцентный цвет: фиолетово-синий градиент (#7c3aed → #3b82f6) для кнопок CTA
Карточки с лёгкой прозрачностью (glass morphism), backdrop-filter: blur
Шрифт: Syne (заголовки) + DM Sans (тело)
Sidebar слева (иконки + подписи), основной контент справа
Плавные hover-анимации на карточках сервисов (scale + glow)

Структура страниц:

Главная: Hero-баннер с CTA, секция "Сервисы" (карточки), популярные работы пользователей
Редактор: загрузка изображения + выбор сервиса + параметры + результат рядом
Галерея: сетка результатов пользователей с лайками
Профиль: история задач, баланс, настройки


🛠️ Список сервисов (AI Tools)
Каждый сервис — отдельный workflow в ComfyUI:
КатегорияСервис🚗 АвтоПерекраска автомобиля, смена фона авто, тюнинг-визуализация🎨 ЛоготипыГенерация логотипа по описанию, наложение лого на объект👗 ОдеждаСмена цвета одежды, примерка (virtual try-on)🏠 ИнтерьерРедизайн комнаты, смена стиля интерьера👤 ПортретУлучшение качества фото, смена фона, омоложение✨ СтилизацияАниме-стиль, масляная живопись, 3D-рендер🔧 УтилитыУдаление объектов, inpainting, upscale, remove background

⚙️ Технический стек
Frontend (React)
React 18 + Vite
TypeScript
Tailwind CSS + shadcn/ui
Zustand (стейт)
React Query (запросы к API)
React Dropzone (загрузка файлов)
Framer Motion (анимации)
Ключевые компоненты:

<ServiceCard /> — карточка сервиса с превью, названием, иконкой
<EditorWorkspace /> — левая панель (инпуты) + правая (результат)
<ImageUploader /> — drag & drop + paste из буфера
<ProgressTracker /> — polling статуса задачи с анимацией
<ResultViewer /> — before/after слайдер


Backend (FastAPI)
Python 3.11+
FastAPI + Uvicorn
SQLAlchemy (async) + Alembic (миграции)
PostgreSQL (через asyncpg)
Redis (очередь задач + кэш)
Celery (или asyncio tasks) для обработки ComfyUI
httpx (для запросов к ComfyUI API)
JWT аутентификация
AWS S3 / MinIO для хранения изображений
Основные эндпоинты:
POST /api/v1/tasks/create          # Создать задачу редактирования
GET  /api/v1/tasks/{task_id}       # Статус задачи (polling)
GET  /api/v1/tasks/{task_id}/result # Получить результат (URL изображения)
GET  /api/v1/services              # Список доступных сервисов
POST /api/v1/upload                # Загрузить исходное изображение
GET  /api/v1/gallery               # Публичная галерея результатов
POST /api/v1/auth/register
POST /api/v1/auth/login

База данных (PostgreSQL)
sql-- Пользователи
users: id, email, password_hash, credits, created_at

-- Задачи редактирования
tasks: id, user_id, service_id, status, 
       input_image_url, output_image_url, 
       params (JSONB), comfyui_prompt_id,
       created_at, completed_at, error_msg

-- Сервисы
services: id, name, slug, description, 
          category, icon, credits_cost,
          comfyui_workflow (JSONB), is_active

-- Галерея
gallery_items: id, task_id, user_id, 
               likes_count, is_public, created_at

Интеграция с ComfyUI
python# Схема работы:
# 1. Пользователь загружает изображение → S3
# 2. FastAPI создаёт Task в БД (status: pending)
# 3. Celery worker берёт задачу
# 4. Worker загружает изображение в ComfyUI /upload/image
# 5. Worker отправляет workflow с параметрами в ComfyUI /prompt
# 6. Worker polling-ит /history/{prompt_id} пока не done
# 7. Скачивает результат → загружает в S3
# 8. Обновляет Task (status: completed, output_image_url)
# 9. Frontend получает результат через polling GET /tasks/{id}

class ComfyUIService:
    async def run_workflow(
        self, 
        workflow: dict,          # JSON workflow из БД
        input_image_path: str,   # путь к загруженному изображению
        params: dict             # пользовательские параметры
    ) -> str:                    # возвращает URL результата
        ...
```

---

### 🗂️ Структура проекта
```
ai-image-editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn компоненты
│   │   │   ├── ServiceCard/
│   │   │   ├── EditorWorkspace/
│   │   │   ├── ImageUploader/
│   │   │   └── ResultViewer/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Editor/
│   │   │   ├── Gallery/
│   │   │   └── Profile/
│   │   ├── stores/              # Zustand
│   │   ├── api/                 # React Query hooks
│   │   └── styles/
│   └── vite.config.ts
│
└── backend/
    ├── app/
    │   ├── api/routes/
    │   ├── core/                # config, security
    │   ├── models/              # SQLAlchemy models
    │   ├── schemas/             # Pydantic schemas
    │   ├── services/
    │   │   ├── comfyui.py       # ComfyUI интеграция
    │   │   ├── storage.py       # S3/MinIO
    │   │   └── tasks.py        # Celery tasks
    │   └── main.py
    ├── alembic/
    ├── docker-compose.yml
    └── requirements.txt
    