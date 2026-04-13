from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from app.application.ports.input.get_stats_use_case import GetStatsUseCase
from app.application.ports.output.fraud_model_port import FraudModelPort
from app.application.ports.output.metrics_port import MetricsPort
from app.application.ports.output.transaction_repository_port import TransactionRepositoryPort


class StatsService(GetStatsUseCase):
    """Application service: assembles dashboard statistics from multiple ports."""

    def __init__(
        self,
        repository: TransactionRepositoryPort,
        model: FraudModelPort,
        metrics: MetricsPort,
    ) -> None:
        self._repo = repository
        self._model = model
        self._metrics = metrics

    def get_stats(self) -> Dict[str, Any]:
        base = self._repo.get_base_stats()
        avg_latency = self._metrics.get_average_latency_ms()

        model_accuracy = None
        sample_size = 0
        sample_limit = 0

        if self._model.ready:
            rows, labels, sample_limit = self._repo.get_accuracy_sample()
            sample_size = len(labels)
            if sample_size:
                df = pd.DataFrame(rows)
                preds = self._model.predict_is_fraud(df)
                correct = sum(1 for p, y in zip(preds, labels) if int(p) == int(y))
                model_accuracy = correct / sample_size

        return {
            **base,
            "avg_response_time_ms": avg_latency,
            "model_accuracy": model_accuracy,
            "accuracy_sample_size": sample_size,
            "accuracy_sample_limit": sample_limit,
        }
