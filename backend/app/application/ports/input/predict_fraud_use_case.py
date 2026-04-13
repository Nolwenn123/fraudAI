from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from app.domain.entities.fraud_prediction import FraudPrediction
from app.domain.entities.transaction import Transaction


class PredictFraudUseCase(ABC):
    """Input port: use case for scoring individual or batched transactions."""

    @abstractmethod
    def predict_single(self, transaction: Transaction) -> FraudPrediction:
        """Score a single transaction and return a fraud prediction."""

    @abstractmethod
    def predict_batch(self, transactions: List[Transaction]) -> List[FraudPrediction]:
        """Score a list of transactions and return a prediction for each."""
