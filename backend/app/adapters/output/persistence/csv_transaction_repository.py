"""Output adapter: reads transactions from the PaySim CSV file."""
from __future__ import annotations

import csv
import random
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple

from fastapi import HTTPException

from app.application.ports.output.transaction_repository_port import TransactionRepositoryPort
from app.domain.entities.transaction import Transaction

MAX_TX_LIMIT = 5_000


def _row_to_transaction(row: Dict) -> Transaction:
    return Transaction(
        step=int(row.get("step", 0) or 0),
        type=row.get("type", "PAYMENT"),
        amount=float(row.get("amount", 0) or 0),
        name_orig=row.get("nameOrig", ""),
        old_balance_orig=float(row.get("oldbalanceOrg", 0) or 0),
        new_balance_orig=float(row.get("newbalanceOrig", 0) or 0),
        old_balance_dest=float(row.get("oldbalanceDest", 0) or 0),
        new_balance_dest=float(row.get("newbalanceDest", 0) or 0),
        is_fraud=str(row.get("isFraud", "0")) == "1",
    )


class CsvTransactionRepository(TransactionRepositoryPort):
    """Implements TransactionRepositoryPort by reading the PaySim CSV dataset."""

    def __init__(self, csv_path: Path) -> None:
        self._csv_path = csv_path

    def _check_file(self) -> None:
        if not self._csv_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"PaySim dataset not found at {self._csv_path}",
            )

    # ------------------------------------------------------------------
    # TransactionRepositoryPort implementation
    # ------------------------------------------------------------------

    def find_all_paginated(self, limit: int, offset: int) -> List[Transaction]:
        self._check_file()
        limit = max(1, min(limit, MAX_TX_LIMIT))
        offset = max(0, offset)
        results: List[Transaction] = []
        with self._csv_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                if idx < offset:
                    continue
                results.append(_row_to_transaction(row))
                if len(results) >= limit:
                    break
        return results

    def find_sample(self, limit: int, min_fraud: int) -> List[Transaction]:
        self._check_file()
        limit = max(1, min(limit, MAX_TX_LIMIT))
        with self._csv_path.open(newline="", encoding="utf-8") as f:
            all_rows = list(csv.DictReader(f))

        if limit >= len(all_rows):
            return [_row_to_transaction(r) for r in all_rows]

        if min_fraud > 0:
            fraud_rows = [r for r in all_rows if str(r.get("isFraud", "0")) == "1"]
            non_fraud_rows = [r for r in all_rows if str(r.get("isFraud", "0")) != "1"]
            fraud_take = min(min_fraud, len(fraud_rows), limit)
            non_fraud_take = max(0, limit - fraud_take)
            sampled: List[Dict] = []
            if fraud_take:
                sampled.extend(random.sample(fraud_rows, k=fraud_take))
            if non_fraud_take:
                sampled.extend(random.sample(non_fraud_rows, k=non_fraud_take))
        else:
            sampled = random.sample(all_rows, k=limit)

        return [_row_to_transaction(r) for r in sampled]

    def find_fraud(self, limit: int) -> List[Transaction]:
        self._check_file()
        results: List[Transaction] = []
        with self._csv_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if str(row.get("isFraud", "0")) == "1":
                    results.append(_row_to_transaction(row))
                    if len(results) >= limit:
                        break
        return results

    def get_base_stats(self) -> Dict:
        return _load_base_stats(self._csv_path)

    def get_accuracy_sample(self, sample_limit: int = 50_000) -> Tuple[List[Dict], List[int], int]:
        return _load_accuracy_sample(self._csv_path, sample_limit)


# ------------------------------------------------------------------
# Module-level cached loaders (keyed on csv_path for correctness)
# ------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_base_stats(csv_path: Path) -> Dict:
    total = 0
    fraud = 0
    fraud_amount = 0.0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if str(row.get("isFraud", "0")) == "1":
                fraud += 1
                fraud_amount += float(row.get("amount", 0) or 0)

    approved = max(total - fraud, 0)
    return {
        "total": total,
        "fraud": fraud,
        "approved": approved,
        "fraud_rate": (fraud / total) if total else 0.0,
        "approval_rate": (approved / total) if total else 0.0,
        "fraud_prevented_amount": fraud_amount,
    }


@lru_cache(maxsize=4)
def _load_accuracy_sample(csv_path: Path, sample_limit: int) -> Tuple[List[Dict], List[int], int]:
    rows: List[Dict] = []
    labels: List[int] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "type": row.get("type", ""),
                "amount": float(row.get("amount", 0) or 0),
                "oldbalanceOrg": float(row.get("oldbalanceOrg", 0) or 0),
                "newbalanceOrig": float(row.get("newbalanceOrig", 0) or 0),
                "oldbalanceDest": float(row.get("oldbalanceDest", 0) or 0),
                "newbalanceDest": float(row.get("newbalanceDest", 0) or 0),
            })
            labels.append(1 if str(row.get("isFraud", "0")) == "1" else 0)
            if len(rows) >= sample_limit:
                break
    return rows, labels, sample_limit
