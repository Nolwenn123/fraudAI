from typing import Dict, List
from ..schemas import TransactionIn

TX_TYPES = ["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]

def to_features(tx: TransactionIn) -> Dict[str, float]:
    base = {
        "step": float(tx.step),
        "amount": tx.amount,
        "oldbalanceOrg": tx.oldbalanceOrg,
        "newbalanceOrig": tx.newbalanceOrig,
        "oldbalanceDest": tx.oldbalanceDest,
        "newbalanceDest": tx.newbalanceDest,
    }
    # One-hot
    for t in TX_TYPES:
        base[f"type_{t}"] = 1.0 if tx.type == t else 0.0
    return base

def vectorize(features: Dict[str, float], order: List[str]) -> List[float]:
    return [float(features.get(col, 0.0)) for col in order]
