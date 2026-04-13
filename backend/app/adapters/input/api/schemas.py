"""HTTP-level Pydantic schemas: request/response models for the REST API."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

TxType = Literal["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

class TransactionIn(BaseModel):
    step: int = Field(..., ge=0)
    type: TxType
    amount: float = Field(..., ge=0)
    oldbalanceOrg: float = Field(..., ge=0)
    newbalanceOrig: float = Field(..., ge=0)
    oldbalanceDest: float = Field(..., ge=0)
    newbalanceDest: float = Field(..., ge=0)


class PredictionOut(BaseModel):
    fraud_probability: float
    is_fraud: bool
    model_version: str


class BatchIn(BaseModel):
    transactions: List[TransactionIn]


class BatchOut(BaseModel):
    predictions: List[PredictionOut]


# ---------------------------------------------------------------------------
# System
# ---------------------------------------------------------------------------

class HealthOut(BaseModel):
    status: str
    model_ready: bool


class ModelInfo(BaseModel):
    model_version: str
    ready: bool
    model_path: str


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

class TransactionOut(BaseModel):
    step: int
    type: TxType
    amount: float
    nameOrig: str
    isFraud: str
    predictedIsFraud: Optional[str] = None
