from pathlib import Path
import sys

# Ensure project root is on the path so `ml` package is importable even when running from /backend
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from app.api.transactions import router as transactions_router
from .api.routes import router as api_router
from .core.config import get_settings
from .core.version import MODEL_VERSION
from .dependencies import get_model_service
from .core.metrics import record_latency


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.api_title,
        description=settings.api_description,
        version=MODEL_VERSION,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def track_latency(request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        record_latency(duration_ms)
        return response

    app.include_router(transactions_router, prefix="/api")

    @app.on_event("startup")
    def startup():
        # Prime the model in memory at startup
        get_model_service(get_settings())

    return app


app = create_app()
