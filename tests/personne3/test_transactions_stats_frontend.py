"""
Tests logique frontend et CSV repository.
Personne 3 — Tests Frontend / CSV / Logique métier
"""
import sys
import os

# Fix : permet à Python de trouver les modules du projet
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import csv
import io
import pytest
from pathlib import Path
from unittest.mock import MagicMock
import numpy as np

from app.domain.entities.transaction import Transaction


# ── Fixture : CSV PaySim minimal ─────────────────────────────────────────────

PAYSIM_HEADERS = [
    "step", "type", "amount", "nameOrig",
    "oldbalanceOrg", "newbalanceOrig",
    "oldbalanceDest", "newbalanceDest",
    "isFraud",
]

SAMPLE_ROWS = [
    ["1", "TRANSFER", "1000.0", "C001", "5000.0", "4000.0", "0.0",  "1000.0", "0"],
    ["2", "CASH_OUT", "2500.0", "C002", "3000.0", "500.0",  "0.0",  "2500.0", "1"],
    ["3", "PAYMENT",  "100.0",  "C003", "200.0",  "100.0",  "50.0", "150.0",  "0"],
    ["4", "TRANSFER", "9999.0", "C004", "10000.0","1.0",    "0.0",  "9999.0", "1"],
    ["5", "DEBIT",    "50.0",   "C005", "500.0",  "450.0",  "0.0",  "50.0",   "0"],
]


def make_csv_content(rows=None) -> str:
    rows = rows or SAMPLE_ROWS
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(PAYSIM_HEADERS)
    w.writerows(rows)
    return buf.getvalue()


@pytest.fixture
def tmp_csv(tmp_path):
    f = tmp_path / "paysim.csv"
    f.write_text(make_csv_content(), encoding="utf-8")
    return f


# ── Tests CSV Repository ──────────────────────────────────────────────────────

class TestCsvTransactionRepository:

    def test_find_all_paginated_limit(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_all_paginated(limit=2, offset=0)
        assert len(txs) == 2

    def test_find_all_paginated_offset(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_all_paginated(limit=5, offset=2)
        assert len(txs) == 3

    def test_types_valides(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_all_paginated(limit=5, offset=0)
        types_valides = {"PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"}
        for tx in txs:
            assert tx.type in types_valides

    def test_find_fraud_retourne_uniquement_fraudes(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_fraud(limit=10)
        for tx in txs:
            assert tx.is_fraud is True

    def test_find_fraud_limit(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_fraud(limit=1)
        assert len(txs) == 1

    def test_get_base_stats_total(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        stats = repo.get_base_stats()
        assert stats["total"] == 5

    def test_get_base_stats_fraud(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        stats = repo.get_base_stats()
        assert stats["fraud"] == 2

    def test_get_base_stats_approved(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        stats = repo.get_base_stats()
        assert stats["approved"] == 3

    def test_get_base_stats_fraud_rate(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        stats = repo.get_base_stats()
        assert stats["fraud_rate"] == pytest.approx(2 / 5)

    def test_get_base_stats_approval_rate(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        stats = repo.get_base_stats()
        assert stats["approval_rate"] == pytest.approx(3 / 5)

    def test_fichier_inexistant_leve_exception(self, tmp_path):
        from fastapi import HTTPException
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_path / "inexistant.csv")
        with pytest.raises(HTTPException):
            repo.find_all_paginated(limit=10, offset=0)

    def test_amounts_corrects(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_all_paginated(limit=1, offset=0)
        assert txs[0].amount == pytest.approx(1000.0)

    def test_find_sample_respecte_limit(self, tmp_csv):
        from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
        repo = CsvTransactionRepository(tmp_csv)
        txs = repo.find_sample(limit=3, min_fraud=0)
        assert len(txs) == 3


# ── Tests entité Transaction ──────────────────────────────────────────────────

class TestTransactionEntity:

    def test_creation_minimale(self):
        tx = Transaction(step=1, type="TRANSFER", amount=100.0, name_orig="C001",
                         old_balance_orig=500.0, new_balance_orig=400.0,
                         old_balance_dest=0.0, new_balance_dest=100.0)
        assert tx.amount == pytest.approx(100.0)

    def test_is_fraud_defaut_false(self):
        tx = Transaction(step=1, type="PAYMENT", amount=50.0, name_orig="C001",
                         old_balance_orig=100.0, new_balance_orig=50.0,
                         old_balance_dest=0.0, new_balance_dest=50.0)
        assert tx.is_fraud is False

    def test_predicted_is_fraud_defaut_none(self):
        tx = Transaction(step=1, type="PAYMENT", amount=50.0, name_orig="C001",
                         old_balance_orig=100.0, new_balance_orig=50.0,
                         old_balance_dest=0.0, new_balance_dest=50.0)
        assert tx.predicted_is_fraud is None

    def test_tous_types_valides(self):
        for t in ["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]:
            tx = Transaction(step=1, type=t, amount=10.0, name_orig="C001",
                             old_balance_orig=100.0, new_balance_orig=90.0,
                             old_balance_dest=0.0, new_balance_dest=10.0)
            assert tx.type == t

    def test_step_stocke_correctement(self):
        tx = Transaction(step=42, type="TRANSFER", amount=100.0, name_orig="C001",
                         old_balance_orig=500.0, new_balance_orig=400.0,
                         old_balance_dest=0.0, new_balance_dest=100.0)
        assert tx.step == 42


# ── Tests logique Frontend ────────────────────────────────────────────────────

class TestFrontendLogic:

    def compute_risk_score(self, amount: float, is_fraud: bool) -> int:
        import math
        if is_fraud:
            return 90
        scaled = 5 + math.log10(max(amount, 1)) * 10
        return max(1, min(70, round(scaled)))

    def test_risk_score_fraude_toujours_90(self):
        assert self.compute_risk_score(100.0, True) == 90
        assert self.compute_risk_score(0.01, True) == 90
        assert self.compute_risk_score(1_000_000, True) == 90

    def test_risk_score_non_fraude_entre_1_et_70(self):
        for amount in [1, 10, 100, 1000, 999999]:
            score = self.compute_risk_score(amount, False)
            assert 1 <= score <= 70

    def test_risk_score_montant_zero_non_fraude(self):
        score = self.compute_risk_score(0.0, False)
        assert 1 <= score <= 70

    def test_risk_score_augmente_avec_le_montant(self):
        s1 = self.compute_risk_score(100.0, False)
        s2 = self.compute_risk_score(10000.0, False)
        assert s2 >= s1

    def compute_score(self, amount: float) -> int:
        import math
        scaled = 70 + math.log10(max(amount, 1)) * 10
        return max(70, min(99, round(scaled)))

    def test_score_alert_toujours_entre_70_et_99(self):
        for amount in [0.0, 1, 100, 9999, 1_000_000]:
            score = self.compute_score(amount)
            assert 70 <= score <= 99

    def test_score_alert_minimum_70(self):
        assert self.compute_score(0.0) == 70

    def get_risk_label(self, score: int) -> str:
        if score >= 80:
            return "High Risk"
        if score >= 50:
            return "Medium Risk"
        return "Low Risk"

    def test_risk_label_high(self):
        assert self.get_risk_label(80) == "High Risk"
        assert self.get_risk_label(99) == "High Risk"

    def test_risk_label_medium(self):
        assert self.get_risk_label(50) == "Medium Risk"
        assert self.get_risk_label(79) == "Medium Risk"

    def test_risk_label_low(self):
        assert self.get_risk_label(0) == "Low Risk"
        assert self.get_risk_label(49) == "Low Risk"

    def map_is_fraud(self, value) -> bool:
        if isinstance(value, bool):
            return value
        return str(value) == "1"

    def test_map_is_fraud_string_1(self):
        assert self.map_is_fraud("1") is True

    def test_map_is_fraud_string_0(self):
        assert self.map_is_fraud("0") is False

    def test_map_is_fraud_bool_true(self):
        assert self.map_is_fraud(True) is True

    def test_map_is_fraud_bool_false(self):
        assert self.map_is_fraud(False) is False

    def test_map_is_fraud_int_1(self):
        assert self.map_is_fraud(1) is True

    def filter_transactions(self, transactions, search="", status_filter="all"):
        result = []
        for t in transactions:
            matches_search = (
                search.lower() in t["id"].lower() or
                search.lower() in t["type"].lower()
            )
            matches_status = status_filter == "all" or t["status"] == status_filter
            if matches_search and matches_status:
                result.append(t)
        return result

    def test_filtre_par_type(self):
        txs = [
            {"id": "C001", "type": "TRANSFER", "status": "approved"},
            {"id": "C002", "type": "PAYMENT", "status": "blocked"},
        ]
        result = self.filter_transactions(txs, search="TRANSFER")
        assert len(result) == 1

    def test_filtre_par_status(self):
        txs = [
            {"id": "C001", "type": "TRANSFER", "status": "approved"},
            {"id": "C002", "type": "PAYMENT", "status": "blocked"},
        ]
        result = self.filter_transactions(txs, status_filter="blocked")
        assert len(result) == 1

    def test_filtre_all_retourne_tout(self):
        txs = [
            {"id": "C001", "type": "TRANSFER", "status": "approved"},
            {"id": "C002", "type": "PAYMENT", "status": "blocked"},
        ]
        result = self.filter_transactions(txs, status_filter="all")
        assert len(result) == 2

    def test_filtre_recherche_vide_retourne_tout(self):
        txs = [
            {"id": "C001", "type": "TRANSFER", "status": "approved"},
            {"id": "C002", "type": "PAYMENT", "status": "blocked"},
        ]
        result = self.filter_transactions(txs, search="")
        assert len(result) == 2

    def test_filtre_sans_resultat(self):
        txs = [{"id": "C001", "type": "TRANSFER", "status": "approved"}]
        result = self.filter_transactions(txs, search="XYZ_INTROUVABLE")
        assert len(result) == 0

    def count_alerts(self, alerts):
        return {
            "pending": sum(1 for a in alerts if a["status"] == "pending"),
            "high_risk_pending": sum(
                1 for a in alerts if a["type"] == "high" and a["status"] == "pending"
            ),
            "resolved": sum(
                1 for a in alerts if a["status"] in ("resolved", "false_positive")
            ),
            "confirmed": sum(1 for a in alerts if a["status"] == "confirmed"),
        }

    def test_count_alerts_pending(self):
        alerts = [
            {"status": "pending", "type": "high"},
            {"status": "pending", "type": "medium"},
            {"status": "resolved", "type": "high"},
        ]
        counts = self.count_alerts(alerts)
        assert counts["pending"] == 2

    def test_count_alerts_high_risk_pending(self):
        alerts = [
            {"status": "pending", "type": "high"},
            {"status": "pending", "type": "medium"},
            {"status": "confirmed", "type": "high"},
        ]
        counts = self.count_alerts(alerts)
        assert counts["high_risk_pending"] == 1

    def test_count_alerts_resolved_inclut_false_positive(self):
        alerts = [
            {"status": "resolved", "type": "high"},
            {"status": "false_positive", "type": "low"},
            {"status": "pending", "type": "high"},
        ]
        counts = self.count_alerts(alerts)
        assert counts["resolved"] == 2

    def test_count_alerts_confirmed(self):
        alerts = [
            {"status": "confirmed", "type": "high"},
            {"status": "confirmed", "type": "high"},
            {"status": "pending", "type": "low"},
        ]
        counts = self.count_alerts(alerts)
        assert counts["confirmed"] == 2
