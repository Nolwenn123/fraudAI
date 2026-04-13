"""Output adapter: wraps the existing ModelService to implement FraudModelPort."""
from __future__ import annotations

from typing import Dict

import numpy as np
import pandas as pd

from app.application.ports.output.fraud_model_port import FraudModelPort
from ml.model_service import ModelService


class XGBoostModelAdapter(FraudModelPort):
    """Bridges the hexagonal FraudModelPort to the concrete ModelService."""

    def __init__(self, model_service: ModelService) -> None:
        self._service = model_service

    @property
    def ready(self) -> bool:
        return self._service.ready

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self._service.predict_proba(X)

    def predict_is_fraud(self, X: pd.DataFrame) -> np.ndarray:
        return self._service.predict_is_fraud(X)

    def get_info(self) -> Dict:
        return self._service.info()
