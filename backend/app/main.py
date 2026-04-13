from pathlib import Path
import sys
import time

# Ensure project root is on sys.path so the `ml` package is importable.
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.input.api.routes import router as api_router
from app.adapters.input.api.transactions import router as transactions_router
from app.adapters.output.metrics.in_memory_metrics_adapter import InMemoryMetricsAdapter
from app.core.config import get_settings
from app.core.version import MODEL_VERSION
from app.dependencies import get_model_adapter


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

    _metrics = InMemoryMetricsAdapter()

    @app.middleware("http")
    async def track_latency(request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        _metrics.record_latency((time.perf_counter() - start) * 1000)
        return response

    app.include_router(api_router, prefix="/api")
    app.include_router(transactions_router, prefix="/api")

    @app.on_event("startup")
    def startup() -> None:
        # Warm up the model at startup so the first request is not slow.
        get_model_adapter(settings)

    return app


app = create_app()
