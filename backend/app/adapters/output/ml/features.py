"""Feature engineering utilities: convert domain Transaction objects into ML-ready arrays."""
from __future__ import annotations

from typing import Dict, List

from app.domain.entities.transaction import Transaction

TX_TYPES = ["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]


def transaction_to_features(tx: Transaction) -> Dict[str, float]:
    """One-hot encode the transaction type and return a feature dict."""
    features: Dict[str, float] = {
        "step": float(tx.step),
        "amount": tx.amount,
        "oldbalanceOrg": tx.old_balance_orig,
        "newbalanceOrig": tx.new_balance_orig,
        "oldbalanceDest": tx.old_balance_dest,
        "newbalanceDest": tx.new_balance_dest,
    }
    for t in TX_TYPES:
        features[f"type_{t}"] = 1.0 if tx.type == t else 0.0
    return features


def vectorize(features: Dict[str, float], order: List[str]) -> List[float]:
    """Project a feature dict onto an ordered list of column names."""
    return [float(features.get(col, 0.0)) for col in order]
