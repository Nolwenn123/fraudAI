from __future__ import annotations

from typing import List

import pandas as pd

from app.application.ports.input.predict_fraud_use_case import PredictFraudUseCase
from app.application.ports.output.fraud_model_port import FraudModelPort
from app.core.version import MODEL_VERSION
from app.domain.entities.fraud_prediction import FraudPrediction
from app.domain.entities.transaction import Transaction


def _transactions_to_df(transactions: List[Transaction]) -> pd.DataFrame:
    return pd.DataFrame([
        {
            "type": tx.type,
            "amount": tx.amount,
            "oldbalanceOrg": tx.old_balance_orig,
            "newbalanceOrig": tx.new_balance_orig,
            "oldbalanceDest": tx.old_balance_dest,
            "newbalanceDest": tx.new_balance_dest,
        }
        for tx in transactions
    ])


class FraudDetectionService(PredictFraudUseCase):
    """Application service: orchestrates fraud scoring via the model port."""

    def __init__(self, model: FraudModelPort, decision_threshold: float = 0.5) -> None:
        self._model = model
        self._threshold = decision_threshold

    def predict_single(self, transaction: Transaction) -> FraudPrediction:
        df = _transactions_to_df([transaction])
        proba = float(self._model.predict_proba(df)[0])
        return FraudPrediction(
            fraud_probability=proba,
            is_fraud=proba >= self._threshold,
            model_version=MODEL_VERSION,
        )

    def predict_batch(self, transactions: List[Transaction]) -> List[FraudPrediction]:
        if not transactions:
            return []
        df = _transactions_to_df(transactions)
        probas = self._model.predict_proba(df)
        return [
            FraudPrediction(
                fraud_probability=float(p),
                is_fraud=float(p) >= self._threshold,
                model_version=MODEL_VERSION,
            )
            for p in probas
        ]
