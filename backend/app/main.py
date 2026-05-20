from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, services, tasks, upload, gallery


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    # Create tables on startup (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed default services
    await seed_services()
    # Apply real ComfyUI workflows to services
    await update_service_workflows()
    yield


async def seed_services() -> None:
    """Upsert default services by slug — safe to re-run on every startup."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.service import Service

    default_services = [
        {"name": "Перекраска автомобиля",  "slug": "car-recolor",       "category": "auto",     "icon": "Car",          "description": "Измените цвет кузова автомобиля на любой"},
        {"name": "Улучшение фото",         "slug": "photo-enhancement", "category": "utility",  "icon": "Sparkles",     "description": "Повышение резкости, детализации и качества фото с помощью AI"},
        {"name": "Аниме стиль",            "slug": "anime-style",       "category": "stylize",  "icon": "Wand2",        "description": "Превратите фото в аниме-иллюстрацию Studio Ghibli"},
        {"name": "Масляная живопись",      "slug": "oil-painting",      "category": "stylize",  "icon": "Palette",      "description": "Стилизация под картину маслом в духе импрессионизма"},
        {"name": "Карандашный скетч",      "slug": "pencil-sketch",     "category": "stylize",  "icon": "PenLine",      "description": "Превращает фото в художественный карандашный рисунок"},
        {"name": "Киберпанк",              "slug": "cyberpunk",         "category": "stylize",  "icon": "Zap",          "description": "Неоновый киберпанк-стиль в духе Blade Runner"},
        {"name": "Акварель",               "slug": "watercolor",        "category": "stylize",  "icon": "Droplets",     "description": "Нежная акварельная живопись с текстурой бумаги"},
        {"name": "Улучшение портрета",     "slug": "portrait-enhance",  "category": "portrait", "icon": "UserRound",    "description": "Профессиональная ретушь и улучшение портретного фото"},
    ]

    async with AsyncSessionLocal() as db:
        for svc_data in default_services:
            result = await db.execute(select(Service).where(Service.slug == svc_data["slug"]))
            if result.scalar_one_or_none():
                continue  # already exists
            svc = Service(
                **svc_data,
                comfyui_workflow={"1": {"inputs": {"image": "__INPUT_IMAGE__"}, "class_type": "LoadImage"}},
            )
            db.add(svc)
        await db.commit()


def _flux_kontext(default_prompt: str) -> dict:
    """Return a Flux Kontext Dev image-editing workflow with the given default prompt.

    Placeholders resolved at runtime by ComfyUIService.inject_image_into_workflow:
      __INPUT_IMAGE__  →  uploaded image filename
      __PROMPT__       →  user prompt (falls back to default_prompt)
      seed             →  randomised automatically
    """
    return {
        "__meta__": {"default_prompt": default_prompt},
        "136": {
            "inputs": {"filename_prefix": "ComfyUI", "images": ["192:8", 0]},
            "class_type": "SaveImage",
        },
        "193": {
            "inputs": {"image": "__INPUT_IMAGE__"},
            "class_type": "LoadImage",
        },
        "192:39": {
            "inputs": {"vae_name": "ae.safetensors"},
            "class_type": "VAELoader",
        },
        "192:38": {
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp8_e4m3fn_scaled.safetensors",
                "type": "flux",
                "device": "default",
            },
            "class_type": "DualCLIPLoader",
        },
        "192:135": {
            "inputs": {"conditioning": ["192:6", 0]},
            "class_type": "ConditioningZeroOut",
        },
        "192:8": {
            "inputs": {"samples": ["192:31", 0], "vae": ["192:39", 0]},
            "class_type": "VAEDecode",
        },
        "192:124": {
            "inputs": {"pixels": ["192:42", 0], "vae": ["192:39", 0]},
            "class_type": "VAEEncode",
        },
        "192:35": {
            "inputs": {"guidance": 2.5, "conditioning": ["192:177", 0]},
            "class_type": "FluxGuidance",
        },
        "192:37": {
            "inputs": {
                "unet_name": "flux1-dev-kontext_fp8_scaled.safetensors",
                "weight_dtype": "default",
            },
            "class_type": "UNETLoader",
        },
        "192:177": {
            "inputs": {"conditioning": ["192:6", 0], "latent": ["192:124", 0]},
            "class_type": "ReferenceLatent",
        },
        "192:146": {
            "inputs": {
                "direction": "right",
                "match_image_size": True,
                "spacing_width": 0,
                "spacing_color": "white",
                "image1": ["193", 0],
            },
            "class_type": "ImageStitch",
        },
        "192:42": {
            "inputs": {"image": ["192:146", 0]},
            "class_type": "FluxKontextImageScale",
        },
        "192:31": {
            "inputs": {
                "seed": 0,
                "steps": 20,
                "cfg": 1,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["192:37", 0],
                "positive": ["192:35", 0],
                "negative": ["192:135", 0],
                "latent_image": ["192:124", 0],
            },
            "class_type": "KSampler",
        },
        "192:6": {
            "inputs": {"text": "__PROMPT__", "clip": ["192:38", 0]},
            "class_type": "CLIPTextEncode",
        },
    }



def _photo_enhancement_workflow() -> dict:
    """Flux-based photo enhancement/upscaling workflow.

    Uses img2img with a strong quality prompt and low denoise (0.35) to
    preserve the original while adding sharpness and detail.

    Placeholders:
      __INPUT_IMAGE__  →  uploaded image filename
      __PROMPT__       →  quality prompt (falls back to default_prompt)
      seed             →  randomised automatically
    """
    default_prompt = (
        "masterpiece, ultra realistic, hyper-detailed, 8k resolution, "
        "super sharp focus, cinematic lighting, global illumination, "
        "ray tracing, subsurface scattering, physically accurate lighting, "
        "professional color grading, perfect white balance, "
        "high dynamic range, RAW photo, uncompressed, "
        "shot on professional full-frame DSLR, 85mm lens, f/1.8, ISO 100"
    )
    return {
        "__meta__": {"default_prompt": default_prompt},
        "5":  {"inputs": {"vae_name": "ae.safetensors"},                           "class_type": "VAELoader"},
        "8":  {"inputs": {"text": "__PROMPT__", "clip": ["24", 0]},                "class_type": "CLIPTextEncode"},
        "11": {"inputs": {"upscale_method": "bicubic", "megapixels": 2,
                          "resolution_steps": 1, "image": ["25", 0]},              "class_type": "ImageScaleToTotalPixels"},
        "12": {"inputs": {"pixels": ["11", 0], "vae": ["5", 0]},                   "class_type": "VAEEncode"},
        "13": {"inputs": {"seed": 0, "steps": 20, "cfg": 1,
                          "sampler_name": "euler", "scheduler": "simple",
                          "denoise": 0.35,
                          "model": ["23", 0], "positive": ["8", 0],
                          "negative": ["8", 0], "latent_image": ["12", 0]},        "class_type": "KSampler"},
        "14": {"inputs": {"samples": ["13", 0], "vae": ["5", 0]},                  "class_type": "VAEDecode"},
        "15": {"inputs": {"filename_prefix": "ComfyUI", "images": ["14", 0]},      "class_type": "SaveImage"},
        "23": {"inputs": {"unet_name": "flux1-dev-Q4_1.gguf"},                     "class_type": "UnetLoaderGGUF"},
        "24": {"inputs": {"clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
                          "clip_name2": "clip_l.safetensors",
                          "type": "flux", "device": "default"},                    "class_type": "DualCLIPLoader"},
        "25": {"inputs": {"image": "__INPUT_IMAGE__"},                              "class_type": "LoadImage"},
    }


def _pencil_sketch_workflow() -> dict:
    return _flux_kontext(
        "Transform this image into a detailed artistic pencil sketch on white paper. "
        "Fine pencil lines, realistic cross-hatching shading, light and shadow contrast, "
        "professional hand-drawn pencil drawing, grayscale, clean white background, "
        "detailed linework, realistic proportions, sketch art style"
    )


def _cyberpunk_workflow() -> dict:
    return _flux_kontext(
        "Transform this image into a cyberpunk aesthetic. "
        "Intense neon lights in cyan, purple and magenta, dark rainy city atmosphere, "
        "holographic UI elements, futuristic dystopian feel, Blade Runner 2049 style, "
        "neon reflections on wet surfaces, high contrast dramatic lighting, "
        "retrofuturistic technology, cinematic composition"
    )


def _watercolor_workflow() -> dict:
    return _flux_kontext(
        "Transform this image into a delicate watercolor painting. "
        "Soft wet-on-wet washes of color, visible paper texture, bleeding color edges, "
        "transparent layered paint, gentle color gradients, white highlights, "
        "artistic watercolor illustration style, pastel and vibrant tones, "
        "loose expressive brushwork, fine art quality"
    )


def _portrait_enhance_workflow() -> dict:
    return _flux_kontext(
        "Enhance this portrait photo to professional quality. "
        "Perfect natural skin retouching, enhance facial features, "
        "soft creamy background bokeh, professional studio lighting, "
        "sharp detailed eyes, glamour fashion photography style, "
        "RAW photo quality, shot on Sony A7R with 85mm f/1.2 lens, "
        "subtle makeup enhancement, cinematic color grading"
    )


def _anime_style_workflow() -> dict:
    return _flux_kontext(
        "Transform this image into a beautiful anime illustration. "
        "Clean bold outlines, vibrant saturated colors, cel-shading, smooth gradients, "
        "large expressive eyes if there are people, detailed stylized hair, "
        "Japanese animation aesthetic, Studio Ghibli quality art, "
        "soft lighting, dreamy atmosphere, high quality anime key visual"
    )


def _oil_painting_workflow() -> dict:
    return _flux_kontext(
        "Transform this image into a classic oil painting. "
        "Visible thick oil paint brushstrokes, rich impasto texture, "
        "vibrant natural colors, impressionist painting technique, "
        "canvas texture visible, fine art museum quality, "
        "painted by a master painter, dramatic lighting, "
        "reminiscent of Van Gogh or Monet style"
    )


async def update_service_workflows() -> None:
    """Apply real ComfyUI workflow JSONs to services (runs on every startup, idempotent)."""
    from sqlalchemy import update as sql_update
    from app.core.database import AsyncSessionLocal
    from app.models.service import Service

    workflow_updates: list[tuple[str, dict]] = [
        ("car-recolor",        _flux_kontext("Change the color of the car to red")),
        ("photo-enhancement",  _photo_enhancement_workflow()),
        ("anime-style",        _anime_style_workflow()),
        ("oil-painting",       _oil_painting_workflow()),
        ("pencil-sketch",      _pencil_sketch_workflow()),
        ("cyberpunk",          _cyberpunk_workflow()),
        ("watercolor",         _watercolor_workflow()),
        ("portrait-enhance",   _portrait_enhance_workflow()),
    ]

    async with AsyncSessionLocal() as db:
        for slug, workflow in workflow_updates:
            await db.execute(
                sql_update(Service)
                .where(Service.slug == slug)
                .values(comfyui_workflow=workflow)
            )
        await db.commit()


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(services.router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks.router, prefix=settings.API_V1_PREFIX)
app.include_router(upload.router, prefix=settings.API_V1_PREFIX)
app.include_router(gallery.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
