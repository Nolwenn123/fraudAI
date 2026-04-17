"""In-memory ring buffer of the most recent transactions received via the API.

Used by the dashboard Live Feed to display real-time incoming transactions
(as opposed to the historical PaySim sample exposed by /api/transactions).
"""
from __future__ import annotations

from collections import deque
from threading import Lock
from typing import Any, Deque, Dict, List

from app.domain.entities.transaction import Transaction

_MAX_ITEMS = 200
_buffer: Deque[Dict[str, Any]] = deque(maxlen=_MAX_ITEMS)
_lock = Lock()
_counter = 0


def record(tx: Transaction) -> None:
    global _counter
    with _lock:
        _counter += 1
        _buffer.appendleft({
            "step": _counter,
            "type": tx.type,
            "amount": tx.amount,
            "nameOrig": tx.name_orig or f"wallet-{_counter:06d}",
            "isFraud": "1" if tx.is_fraud else "0",
            "predictedIsFraud": "1" if tx.predicted_is_fraud else "0",
        })


def get_recent(limit: int, offset: int = 0) -> List[Dict[str, Any]]:
    with _lock:
        return list(_buffer)[offset : offset + limit]


def size() -> int:
    with _lock:
        return len(_buffer)
