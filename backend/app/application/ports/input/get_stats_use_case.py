from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class GetStatsUseCase(ABC):
    """Input port: use case for retrieving dashboard statistics."""

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Return aggregate statistics for the fraud detection system."""
