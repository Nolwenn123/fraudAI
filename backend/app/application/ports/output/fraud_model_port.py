from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, List

import numpy as np
import pandas as pd


class FraudModelPort(ABC):
    """Output port: contract that any fraud-scoring model adapter must fulfil."""

    @property
    @abstractmethod
    def ready(self) -> bool:
        """True when the model is loaded and can produce predictions."""

    @abstractmethod
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Return an array of fraud probabilities (values in [0, 1])."""

    @abstractmethod
    def predict_is_fraud(self, X: pd.DataFrame) -> np.ndarray:
        """Return a binary array: 1 = fraud, 0 = legitimate."""

    @abstractmethod
    def get_info(self) -> Dict:
        """Return metadata about the model (version, path, readiness)."""
