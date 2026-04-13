from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from app.domain.entities.transaction import Transaction


class GetTransactionsUseCase(ABC):
    """Input port: use case for retrieving transactions from the data source."""

    @abstractmethod
    def get_paginated(self, limit: int, offset: int, use_model: bool) -> List[Transaction]:
        """Return a paginated window, optionally enriched with model predictions."""

    @abstractmethod
    def get_sample(self, limit: int, use_model: bool, min_fraud: int) -> List[Transaction]:
        """Return a random sample, optionally ensuring a minimum number of fraud cases."""

    @abstractmethod
    def get_fraud(self, limit: int, use_model: bool) -> List[Transaction]:
        """Return transactions flagged as fraudulent in the dataset."""
