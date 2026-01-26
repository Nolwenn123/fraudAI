from typing import Dict, List
import csv
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Depends, HTTPException

from ..core.config import get_settings, Settings
from ..core.version import MODEL_VERSION
from ..dependencies import get_model_service
from ..schemas import (
    BatchIn,
    BatchOut,
    HealthOut,
    ModelInfo,
    PredictionOut,
    TransactionIn,
    TransactionSample,
)
from ..services.features import to_features, vectorize
from ml.model_service import ModelService

router = APIRouter()
ROOT_DIR = Path(__file__).resolve().parents[3]
PAYSIM_PATH = ROOT_DIR / "data" / "raw" / "paysim.csv"
MAX_TX_LIMIT = 500


@router.get("/health", response_model=HealthOut, tags=["system"])
def health(model: ModelService = Depends(get_model_service)) -> Dict[str, bool]:
    return {"status": "ok", "model_ready": model.ready}


@router.get("/model/info", response_model=ModelInfo, tags=["system"])
def model_info(model: ModelService = Depends(get_model_service)) -> ModelInfo:
    return model.info()


def load_transactions(limit: int = 50, offset: int = 0) -> List[TransactionSample]:
    """Read a small window of transactions from the PaySim CSV."""
    if not PAYSIM_PATH.exists():
        raise HTTPException(status_code=404, detail="paysim.csv not found at data/raw/paysim.csv")

    limit = max(1, min(limit, MAX_TX_LIMIT))
    offset = max(0, offset)

    results: List[TransactionSample] = []
    with PAYSIM_PATH.open() as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            if idx < offset:
                continue
            results.append(
                TransactionSample(
                    step=int(row["step"]),
                    type=row["type"],
                    amount=float(row["amount"]),
                    nameOrig=row["nameOrig"],
                    isFraud=row["isFraud"] == "1",
                )
            )
            if len(results) >= limit:
                break
    return results


@router.get("/transactions", response_model=List[TransactionSample], tags=["data"])
def get_transactions(limit: int = 50, offset: int = 0) -> List[TransactionSample]:
    """
    Return a slice of PaySim transactions for the live feed.
    """
    return load_transactions(limit=limit, offset=offset)


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
