"""Input adapter: FastAPI routes for transaction data and statistics."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query

from app.adapters.input.api.schemas import TransactionOut
from app.application.ports.input.get_stats_use_case import GetStatsUseCase
from app.application.ports.input.get_transactions_use_case import GetTransactionsUseCase
from app.dependencies import get_stats_service, get_transaction_service
from app.domain.entities.transaction import Transaction

router = APIRouter()


def _domain_to_schema(tx: Transaction) -> Dict[str, Any]:
    item: Dict[str, Any] = {
        "step": tx.step,
        "type": tx.type,
        "amount": tx.amount,
        "nameOrig": tx.name_orig,
        "isFraud": "1" if tx.is_fraud else "0",
    }
    if tx.predicted_is_fraud is not None:
        item["predictedIsFraud"] = "1" if tx.predicted_is_fraud else "0"
    return item


@router.get("/transactions", tags=["data"])
def get_transactions(
    limit: int = Query(200, ge=1, le=5000),
    use_model: bool = True,
    min_fraud: int = Query(1, ge=0, le=5000),
    service: GetTransactionsUseCase = Depends(get_transaction_service),
) -> List[Dict[str, Any]]:
    transactions = service.get_sample(limit, use_model=use_model, min_fraud=min_fraud)
    return [_domain_to_schema(tx) for tx in transactions]


@router.get("/transactions/list", tags=["data"])
def get_transactions_list(
    limit: int = Query(50, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    use_model: bool = True,
    service: GetTransactionsUseCase = Depends(get_transaction_service),
) -> List[Dict[str, Any]]:
    transactions = service.get_paginated(limit, offset, use_model=use_model)
    return [_domain_to_schema(tx) for tx in transactions]


@router.get("/transactions/fraud", tags=["data"])
def get_fraud_transactions(
    limit: int = Query(20, ge=1, le=5000),
    use_model: bool = True,
    service: GetTransactionsUseCase = Depends(get_transaction_service),
) -> List[Dict[str, Any]]:
    transactions = service.get_fraud(limit, use_model=use_model)
    return [_domain_to_schema(tx) for tx in transactions]


@router.get("/stats", tags=["data"])
def get_stats(
    service: GetStatsUseCase = Depends(get_stats_service),
) -> Dict[str, Any]:
    return service.get_stats()
