"""Output adapter: implements MetricsPort using the in-memory metrics module."""
from __future__ import annotations

from app.application.ports.output.metrics_port import MetricsPort
from app.core.metrics import get_latency_stats
from app.core.metrics import record_latency as _core_record_latency


class InMemoryMetricsAdapter(MetricsPort):
    """Delegates to the thread-safe in-memory latency tracker in core.metrics."""

    def record_latency(self, duration_ms: float) -> None:
        _core_record_latency(duration_ms)

    def get_average_latency_ms(self) -> float:
        return get_latency_stats().avg_ms
