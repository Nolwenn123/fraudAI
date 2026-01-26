from fastapi import APIRouter, Depends, HTTPException, Query
from pathlib import Path
import csv
import random
import pandas as pd
from functools import lru_cache

from ..dependencies import get_model_service
from ..core.metrics import get_latency_stats
from ml.model_service import ModelService

router = APIRouter()

CSV_PATH = Path(__file__).resolve().parents[3] / "data" / "raw" / "paysim.csv"


@lru_cache(maxsize=1)
def load_base_stats() -> dict:
    if not CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="paysim.csv not found at data/raw/paysim.csv")

    total = 0
    fraud = 0
    fraud_amount = 0.0
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if str(row.get("isFraud", "0")) == "1":
                fraud += 1
                fraud_amount += float(row.get("amount", 0) or 0)

    approved = max(total - fraud, 0)
    fraud_rate = (fraud / total) if total else 0.0
    approval_rate = (approved / total) if total else 0.0

    return {
        "total": total,
        "fraud": fraud,
        "approved": approved,
        "fraud_rate": fraud_rate,
        "approval_rate": approval_rate,
        "fraud_prevented_amount": fraud_amount,
    }


@lru_cache(maxsize=1)
def load_accuracy_sample(sample_limit: int = 50000):
    if not CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="paysim.csv not found at data/raw/paysim.csv")

    rows = []
    labels = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(
                {
                    "type": row.get("type", ""),
                    "amount": float(row.get("amount", 0) or 0),
                    "oldbalanceOrg": float(row.get("oldbalanceOrg", 0) or 0),
                    "newbalanceOrig": float(row.get("newbalanceOrig", 0) or 0),
                    "oldbalanceDest": float(row.get("oldbalanceDest", 0) or 0),
                    "newbalanceDest": float(row.get("newbalanceDest", 0) or 0),
                }
            )
            labels.append(1 if str(row.get("isFraud", "0")) == "1" else 0)
            if len(rows) >= sample_limit:
                break
    return rows, labels, sample_limit

def read_rows(limit: int, use_model: bool, model_service: ModelService, min_fraud: int):
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if limit < len(rows):
        if min_fraud > 0:
            fraud_rows = [r for r in rows if str(r.get("isFraud", "0")) == "1"]
            non_fraud_rows = [r for r in rows if str(r.get("isFraud", "0")) != "1"]
            fraud_take = min(min_fraud, len(fraud_rows), limit)
            non_fraud_take = max(0, limit - fraud_take)
            sampled = []
            if fraud_take:
                sampled.extend(random.sample(fraud_rows, k=fraud_take))
            if non_fraud_take:
                sampled.extend(random.sample(non_fraud_rows, k=non_fraud_take))
            rows = sampled
        else:
            rows = random.sample(rows, k=limit)

    preds = None
    if use_model and model_service.ready:
        df = pd.DataFrame([
            {
                "type": r.get("type", ""),
                "amount": float(r.get("amount", 0) or 0),
                "oldbalanceOrg": float(r.get("oldbalanceOrg", 0) or 0),
                "newbalanceOrig": float(r.get("newbalanceOrig", 0) or 0),
                "oldbalanceDest": float(r.get("oldbalanceDest", 0) or 0),
                "newbalanceDest": float(r.get("newbalanceDest", 0) or 0),
            }
            for r in rows
        ])
        preds = model_service.predict_is_fraud(df)

    # --- (B) NORMALISATION POUR LE FRONT ---
    normalized = []
    for i, r in enumerate(rows):
        is_fraud = r.get("isFraud", r.get("is_fraud", "0"))

        item = {
            "step": int(r.get("step", 0) or 0),
            "type": r.get("type", ""),
            "amount": float(r.get("amount", 0) or 0),
            "nameOrig": r.get("nameOrig", ""),
            "isFraud": str(is_fraud),  # "0" ou "1"
        }

        # Ajout de la prédiction ML
        if preds is not None:
            item["predictedIsFraud"] = str(int(preds[i]))

        normalized.append(item)

    return normalized


@router.get("/transactions")
def get_transactions(
    limit: int = Query(200, ge=1, le=5000),
    use_model: bool = True,
    min_fraud: int = Query(1, ge=0, le=5000),
    model_service: ModelService = Depends(get_model_service),
):
    return read_rows(limit, use_model=use_model, model_service=model_service, min_fraud=min_fraud)


@router.get("/stats")
def get_stats(model_service: ModelService = Depends(get_model_service)):
    base = load_base_stats()
    latency = get_latency_stats()

    model_accuracy = None
    sample_size = 0
    sample_limit = 0
    if model_service.ready:
        rows, labels, sample_limit = load_accuracy_sample()
        sample_size = len(labels)
        if sample_size:
            df = pd.DataFrame(rows)
            preds = model_service.predict_is_fraud(df)
            correct = sum(1 for p, y in zip(preds, labels) if int(p) == int(y))
            model_accuracy = correct / sample_size

    return {
        **base,
        "avg_response_time_ms": latency.avg_ms,
        "model_accuracy": model_accuracy,
        "accuracy_sample_size": sample_size,
        "accuracy_sample_limit": sample_limit,
    }
