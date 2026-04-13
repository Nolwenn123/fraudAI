from __future__ import annotations

from dataclasses import dataclass


@dataclass
class FraudPrediction:
    fraud_probability: float
    is_fraud: bool
    model_version: str
