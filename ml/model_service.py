import os
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd

from .version import MODEL_VERSION


class ModelService:
    def __init__(self, model_path: str, feature_order_path: str, decision_threshold: float):
        self.model_path = model_path
        self.feature_order_path = feature_order_path
        self.feature_order: List[str] = []
        self.model = None
        self.ready = False
        self.decision_threshold = decision_threshold

    def load(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.ready = True
            except Exception:
                self.model = None
                self.ready = False

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if not self.ready or self.model is None:
            # Fallback stable et reproductible
            scores = np.clip(X["amount"].to_numpy() / 10000.0, 0, 1)
            return scores

        if hasattr(self.model, "predict_proba"):
            return self.model.predict_proba(X)[:, 1]
        preds = self.model.predict(X)
        return np.clip(preds.astype(float), 0, 1)

    def predict_is_fraud(self, X: pd.DataFrame) -> np.ndarray:
        scores = self.predict_proba(X)
        return (scores >= self.decision_threshold).astype(int)

    def info(self) -> Dict:
        return {
            "model_version": MODEL_VERSION,
            "ready": self.ready,
            "model_path": self.model_path,
        }
