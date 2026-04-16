"""Input adapter: FastAPI routes for prediction and system endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.adapters.input.api.schemas import (
    BatchIn,
    BatchOut,
    HealthOut,
    ModelInfo,
    PredictionOut,
    TransactionIn,
    WalletTransactionIn,
)
from app.application.ports.input.predict_fraud_use_case import PredictFraudUseCase
from app.application.ports.output.fraud_model_port import FraudModelPort
from app.domain.entities.transaction import Transaction
from app.dependencies import get_fraud_detection_service, get_model_adapter

router = APIRouter()


def _schema_to_domain(tx: TransactionIn) -> Transaction:
    return Transaction(
        step=tx.step,
        type=tx.type,
        amount=tx.amount,
        name_orig="",
        old_balance_orig=tx.oldbalanceOrg,
        new_balance_orig=tx.newbalanceOrig,
        old_balance_dest=tx.oldbalanceDest,
        new_balance_dest=tx.newbalanceDest,
    )


# ---------------------------------------------------------------------------
# System endpoints
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthOut, tags=["system"])
def health(model: FraudModelPort = Depends(get_model_adapter)) -> HealthOut:
    return HealthOut(status="ok", model_ready=model.ready)


@router.get("/model/info", response_model=ModelInfo, tags=["system"])
def model_info(model: FraudModelPort = Depends(get_model_adapter)) -> ModelInfo:
    info = model.get_info()
    return ModelInfo(
        model_version=info.get("model_version", "unknown"),
        ready=info.get("ready", False),
        model_path=info.get("model_path", ""),
    )


# ---------------------------------------------------------------------------
# Prediction endpoints
# ---------------------------------------------------------------------------

@router.post("/predict", response_model=PredictionOut, tags=["prediction"])
def predict(
    tx: TransactionIn,
    service: PredictFraudUseCase = Depends(get_fraud_detection_service),
) -> PredictionOut:
    prediction = service.predict_single(_schema_to_domain(tx))
    return PredictionOut(
        fraud_probability=prediction.fraud_probability,
        is_fraud=prediction.is_fraud,
        model_version=prediction.model_version,
    )


@router.post("/predict/wallet", response_model=PredictionOut, tags=["prediction"])
def predict_wallet(
    tx: WalletTransactionIn,
    service: PredictFraudUseCase = Depends(get_fraud_detection_service),
) -> PredictionOut:
    """Endpoint for the external wallet integration.

    Accepts the wallet's transaction format and maps it to the internal
    domain model before scoring.
    """
    tx_type = tx.transaction_type.upper()
    valid_types = {"PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"}
    if tx_type not in valid_types:
        tx_type = "TRANSFER"

    domain_tx = Transaction(
        step=0,
        type=tx_type,
        amount=tx.amount,
        name_orig="",
        old_balance_orig=tx.sender_balance,
        new_balance_orig=max(tx.sender_balance - tx.amount, 0.0),
        old_balance_dest=tx.receiver_balance,
        new_balance_dest=tx.receiver_balance + tx.amount,
    )
    prediction = service.predict_single(domain_tx)
    return PredictionOut(
        fraud_probability=prediction.fraud_probability,
        is_fraud=prediction.is_fraud,
        model_version=prediction.model_version,
    )


@router.post("/predict/batch", response_model=BatchOut, tags=["prediction"])
def predict_batch(
    batch: BatchIn,
    service: PredictFraudUseCase = Depends(get_fraud_detection_service),
) -> BatchOut:
    domain_txs = [_schema_to_domain(tx) for tx in batch.transactions]
    predictions = service.predict_batch(domain_txs)
    return BatchOut(predictions=[
        PredictionOut(
            fraud_probability=p.fraud_probability,
            is_fraud=p.is_fraud,
            model_version=p.model_version,
        )
        for p in predictions
    ])
