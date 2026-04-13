from __future__ import annotations

from abc import ABC, abstractmethod


class MetricsPort(ABC):
    """Output port: contract for recording and querying operational metrics."""

    @abstractmethod
    def record_latency(self, duration_ms: float) -> None:
        """Record a single request latency measurement."""

    @abstractmethod
    def get_average_latency_ms(self) -> float:
        """Return the running average request latency in milliseconds."""
