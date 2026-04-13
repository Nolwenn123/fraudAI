from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

TransactionType = Literal["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]


@dataclass
class Transaction:
    step: int
    type: TransactionType
    amount: float
    name_orig: str
    old_balance_orig: float
    new_balance_orig: float
    old_balance_dest: float
    new_balance_dest: float
    is_fraud: bool = False
    predicted_is_fraud: Optional[bool] = field(default=None)
