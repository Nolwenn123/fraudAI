from typing import Dict, List

import numpy as np
from fastapi import APIRouter, Depends

from ..core.config import get_settings, Settings
from ..core.version import MODEL_VERSION
from ..dependencies import get_model_service
from ..schemas import BatchIn, BatchOut, HealthOut, ModelInfo, PredictionOut, TransactionIn
from ..services.features import to_features, vectorize
from ml.model_service import ModelService

router = APIRouter()


@router.get("/health", response_model=HealthOut, tags=["system"])
def health(model: ModelService = Depends(get_model_service)) -> Dict[str, bool]:
    return {"status": "ok", "model_ready": model.ready}


@router.get("/model/info", response_model=ModelInfo, tags=["system"])
def model_info(model: ModelService = Depends(get_model_service)) -> ModelInfo:
    return model.info()


@router.post("/predict", response_model=PredictionOut, tags=["prediction"])
def predict(
    tx: TransactionIn,
    model: ModelService = Depends(get_model_service),
    settings: Settings = Depends(get_settings),
) -> PredictionOut:
    feats = to_features(tx)
    order = model.feature_order or list(feats.keys())
    x = np.array([vectorize(feats, order)], dtype=float)

    proba = float(model.predict_proba(x)[0])
    threshold = settings.decision_threshold
    return PredictionOut(
        fraud_probability=proba,
        is_fraud=proba >= threshold,
        model_version=MODEL_VERSION,
    )


@router.post("/predict/batch", response_model=BatchOut, tags=["prediction"])
def predict_batch(
    batch: BatchIn,
    model: ModelService = Depends(get_model_service),
    settings: Settings = Depends(get_settings),
) -> BatchOut:
    feats_list: List[Dict[str, float]] = [to_features(tx) for tx in batch.transactions]
    if not feats_list:
        return BatchOut(predictions=[])

    order = model.feature_order or list(feats_list[0].keys())
    X = np.array([vectorize(f, order) for f in feats_list], dtype=float)

    probas = model.predict_proba(X)
    threshold = settings.decision_threshold
    preds = [
        PredictionOut(
            fraud_probability=float(p),
            is_fraud=float(p) >= threshold,
            model_version=MODEL_VERSION,
        )
        for p in probas
    ]

    return BatchOut(predictions=preds)
