from __future__ import annotations

from dataclasses import dataclass
from threading import Lock


@dataclass
class LatencyStats:
    avg_ms: float = 0.0
    count: int = 0


_lock = Lock()
_stats = LatencyStats()


def record_latency(duration_ms: float) -> None:
    with _lock:
        _stats.count += 1
        if _stats.count == 1:
            _stats.avg_ms = duration_ms
        else:
            # Running average
            _stats.avg_ms += (duration_ms - _stats.avg_ms) / _stats.count


def get_latency_stats() -> LatencyStats:
    with _lock:
        return LatencyStats(avg_ms=_stats.avg_ms, count=_stats.count)
