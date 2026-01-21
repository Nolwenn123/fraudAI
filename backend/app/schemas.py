from pydantic import BaseModel, Field
from typing import Literal, List

TxType = Literal["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]


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


class HealthOut(BaseModel):
    status: str
    model_ready: bool


class ModelInfo(BaseModel):
    model_version: str
    ready: bool
    n_features: int
    features: List[str] = Field(default_factory=list)
    model_path: str
