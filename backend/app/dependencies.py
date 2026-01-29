from typing import Optional

from fastapi import Depends

from ml.model_service import ModelService

from .core.config import Settings, get_settings

_model_service: Optional[ModelService] = None


def get_model_service(settings: Settings = Depends(get_settings)) -> ModelService:
    """
    Lazily load the model service once and reuse it across requests.
    The function is declared as a dependency to integrate with FastAPI's DI system.
    """
    global _model_service
    if _model_service is None:
        _model_service = ModelService(
            model_path=settings.model_path,
            feature_order_path=settings.feature_order_path,
            decision_threshold=settings.decision_threshold,
        )
        _model_service.load()
    return _model_service
