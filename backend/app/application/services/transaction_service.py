from __future__ import annotations

from typing import List

import pandas as pd

from app.application.ports.input.get_transactions_use_case import GetTransactionsUseCase
from app.application.ports.output.fraud_model_port import FraudModelPort
from app.application.ports.output.transaction_repository_port import TransactionRepositoryPort
from app.domain.entities.transaction import Transaction


class TransactionService(GetTransactionsUseCase):
    """Application service: retrieves transactions and optionally enriches them with ML predictions."""

    def __init__(self, repository: TransactionRepositoryPort, model: FraudModelPort) -> None:
        self._repo = repository
        self._model = model

    def _apply_predictions(self, transactions: List[Transaction]) -> List[Transaction]:
        if not self._model.ready or not transactions:
            return transactions
        df = pd.DataFrame([
            {
                "type": tx.type,
                "amount": tx.amount,
                "oldbalanceOrg": tx.old_balance_orig,
                "newbalanceOrig": tx.new_balance_orig,
                "oldbalanceDest": tx.old_balance_dest,
                "newbalanceDest": tx.new_balance_dest,
            }
            for tx in transactions
        ])
        preds = self._model.predict_is_fraud(df)
        for tx, pred in zip(transactions, preds):
            tx.predicted_is_fraud = bool(pred)
        return transactions

    def get_paginated(self, limit: int, offset: int, use_model: bool) -> List[Transaction]:
        transactions = self._repo.find_all_paginated(limit, offset)
        if use_model:
            return self._apply_predictions(transactions)
        return transactions

    def get_sample(self, limit: int, use_model: bool, min_fraud: int) -> List[Transaction]:
        transactions = self._repo.find_sample(limit, min_fraud)
        if use_model:
            return self._apply_predictions(transactions)
        return transactions

    def get_fraud(self, limit: int, use_model: bool) -> List[Transaction]:
        transactions = self._repo.find_fraud(limit)
        if use_model:
            return self._apply_predictions(transactions)
        return transactions
