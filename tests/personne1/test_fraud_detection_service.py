"""
Tests du service de détection de fraude (FraudDetectionService).
Personne 1 — Tests ML / Services métier
"""
import sys
import os

# Fix : permet à Python de trouver les modules du projet
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import numpy as np
import pandas as pd
import pytest
from unittest.mock import MagicMock

from app.application.services.fraud_detection_service import FraudDetectionService
from app.domain.entities.transaction import Transaction


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_transaction(
    type_="TRANSFER",
    amount=1000.0,
    old_orig=5000.0,
    new_orig=4000.0,
    old_dest=0.0,
    new_dest=1000.0,
    step=1,
) -> Transaction:
    return Transaction(
        step=step,
        type=type_,
        amount=amount,
        name_orig="C123",
        old_balance_orig=old_orig,
        new_balance_orig=new_orig,
        old_balance_dest=old_dest,
        new_balance_dest=new_dest,
    )


def make_mock_model(proba: float):
    """Crée un faux modèle qui retourne toujours la probabilité donnée."""
    model = MagicMock()
    model.ready = True
    model.predict_proba.return_value = np.array([proba])
    return model


# ── Tests predict_single ─────────────────────────────────────────────────────

class TestPredictSingle:

    def test_retourne_une_prediction(self):
        service = FraudDetectionService(make_mock_model(0.2))
        tx = make_transaction()
        result = service.predict_single(tx)
        assert result is not None

    def test_probabilite_correcte(self):
        service = FraudDetectionService(make_mock_model(0.75))
        tx = make_transaction()
        result = service.predict_single(tx)
        assert abs(result.fraud_probability - 0.75) < 1e-6

    def test_is_fraud_true_quand_proba_au_dessus_du_seuil(self):
        service = FraudDetectionService(make_mock_model(0.8), decision_threshold=0.5)
        tx = make_transaction()
        result = service.predict_single(tx)
        assert result.is_fraud is True

    def test_is_fraud_false_quand_proba_en_dessous_du_seuil(self):
        service = FraudDetectionService(make_mock_model(0.3), decision_threshold=0.5)
        tx = make_transaction()
        result = service.predict_single(tx)
        assert result.is_fraud is False

    def test_seuil_personnalise(self):
        service = FraudDetectionService(make_mock_model(0.6), decision_threshold=0.7)
        tx = make_transaction()
        result = service.predict_single(tx)
        assert result.is_fraud is False  # 0.6 < 0.7

    def test_model_version_est_present(self):
        service = FraudDetectionService(make_mock_model(0.5))
        tx = make_transaction()
        result = service.predict_single(tx)
        assert isinstance(result.model_version, str)
        assert len(result.model_version) > 0

    def test_transaction_type_cash_out(self):
        service = FraudDetectionService(make_mock_model(0.9))
        tx = make_transaction(type_="CASH_OUT")
        result = service.predict_single(tx)
        assert result.fraud_probability == pytest.approx(0.9)

    def test_transaction_montant_zero(self):
        service = FraudDetectionService(make_mock_model(0.1))
        tx = make_transaction(amount=0.0)
        result = service.predict_single(tx)
        assert result is not None

    def test_appel_predict_proba_avec_dataframe(self):
        model = make_mock_model(0.5)
        service = FraudDetectionService(model)
        tx = make_transaction()
        service.predict_single(tx)
        # Vérifier que predict_proba a bien été appelé avec un DataFrame
        call_args = model.predict_proba.call_args
        assert isinstance(call_args[0][0], pd.DataFrame)

    def test_dataframe_contient_les_bonnes_colonnes(self):
        captured = {}

        model = MagicMock()
        model.ready = True

        def capture(df):
            captured["df"] = df
            return np.array([0.5])

        model.predict_proba.side_effect = capture
        service = FraudDetectionService(model)
        tx = make_transaction(type_="PAYMENT", amount=200.0)
        service.predict_single(tx)

        df = captured["df"]
        assert "type" in df.columns
        assert "amount" in df.columns
        assert "oldbalanceOrg" in df.columns
        assert "newbalanceOrig" in df.columns
        assert "oldbalanceDest" in df.columns
        assert "newbalanceDest" in df.columns

    def test_dataframe_valeurs_correctes(self):
        captured = {}

        model = MagicMock()
        model.ready = True

        def capture(df):
            captured["df"] = df
            return np.array([0.5])

        model.predict_proba.side_effect = capture
        service = FraudDetectionService(model)
        tx = make_transaction(type_="TRANSFER", amount=500.0, old_orig=1000.0, new_orig=500.0)
        service.predict_single(tx)

        df = captured["df"]
        assert df["type"].iloc[0] == "TRANSFER"
        assert df["amount"].iloc[0] == pytest.approx(500.0)
        assert df["oldbalanceOrg"].iloc[0] == pytest.approx(1000.0)
        assert df["newbalanceOrig"].iloc[0] == pytest.approx(500.0)


# ── Tests predict_batch ──────────────────────────────────────────────────────

class TestPredictBatch:

    def test_liste_vide_retourne_liste_vide(self):
        service = FraudDetectionService(make_mock_model(0.5))
        result = service.predict_batch([])
        assert result == []

    def test_batch_une_transaction(self):
        model = MagicMock()
        model.ready = True
        model.predict_proba.return_value = np.array([0.6])
        service = FraudDetectionService(model)
        result = service.predict_batch([make_transaction()])
        assert len(result) == 1
        assert result[0].fraud_probability == pytest.approx(0.6)

    def test_batch_plusieurs_transactions(self):
        model = MagicMock()
        model.ready = True
        model.predict_proba.return_value = np.array([0.1, 0.9, 0.5])
        service = FraudDetectionService(model)
        txs = [make_transaction() for _ in range(3)]
        result = service.predict_batch(txs)
        assert len(result) == 3

    def test_batch_is_fraud_correctement_attribue(self):
        model = MagicMock()
        model.ready = True
        model.predict_proba.return_value = np.array([0.1, 0.9])
        service = FraudDetectionService(model, decision_threshold=0.5)
        result = service.predict_batch([make_transaction(), make_transaction()])
        assert result[0].is_fraud is False
        assert result[1].is_fraud is True

    def test_batch_predict_proba_appele_une_seule_fois(self):
        model = MagicMock()
        model.ready = True
        model.predict_proba.return_value = np.array([0.3, 0.7, 0.5])
        service = FraudDetectionService(model)
        service.predict_batch([make_transaction() for _ in range(3)])
        assert model.predict_proba.call_count == 1

    def test_batch_dataframe_bonne_taille(self):
        captured = {}

        model = MagicMock()
        model.ready = True

        def capture(df):
            captured["df"] = df
            return np.array([0.5] * len(df))

        model.predict_proba.side_effect = capture
        service = FraudDetectionService(model)
        service.predict_batch([make_transaction() for _ in range(5)])
        assert len(captured["df"]) == 5


# ── Tests entité Transaction ──────────────────────────────────────────────────

class TestTransactionEntity:

    def test_creation_minimale(self):
        tx = make_transaction()
        assert tx.type == "TRANSFER"
        assert tx.amount == pytest.approx(1000.0)

    def test_is_fraud_defaut_false(self):
        tx = make_transaction()
        assert tx.is_fraud is False

    def test_predicted_is_fraud_defaut_none(self):
        tx = make_transaction()
        assert tx.predicted_is_fraud is None

    def test_tous_types_valides(self):
        for t in ["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]:
            tx = make_transaction(type_=t)
            assert tx.type == t

    def test_step_stocke_correctement(self):
        tx = make_transaction(step=42)
        assert tx.step == 42
