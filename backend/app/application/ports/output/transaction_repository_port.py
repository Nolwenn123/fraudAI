from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple

from app.domain.entities.transaction import Transaction


class TransactionRepositoryPort(ABC):
    """Output port: contract that any transaction data source must fulfil."""

    @abstractmethod
    def find_all_paginated(self, limit: int, offset: int) -> List[Transaction]:
        """Return a window of transactions for paginated listing."""

    @abstractmethod
    def find_sample(self, limit: int, min_fraud: int) -> List[Transaction]:
        """Return a random sample, guaranteeing at least *min_fraud* fraud cases."""

    @abstractmethod
    def find_fraud(self, limit: int) -> List[Transaction]:
        """Return the first *limit* transactions labelled as fraudulent."""

    @abstractmethod
    def get_base_stats(self) -> Dict:
        """Return aggregate statistics: total, fraud count, rates, amounts."""

    @abstractmethod
    def get_accuracy_sample(self, sample_limit: int = 50_000) -> Tuple[List[Dict], List[int], int]:
        """
        Return (rows, labels, sample_limit) for model accuracy evaluation.
        *rows* are raw feature dicts; *labels* are 0/1 ground-truth values.
        """
