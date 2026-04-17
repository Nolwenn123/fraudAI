"""
Tests des endpoints API de prédiction (predict, predict/batch, predict/wallet).
Personne 2 — Tests API Backend
"""
import sys
import os

# Fix : permet à Python de trouver les modules du projet
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import numpy as np

# ── Fixture : client de test avec modèle mocké ────────────────────────────────

@pytest.fixture
def client():
    """
    Crée un TestClient FastAPI avec le modèle ML mocké.
    Aucun vrai modèle nécessaire pour faire tourner les tests.
    """
    mock_model = MagicMock()
    mock_model.ready = True
    mock_model.predict_proba.return_value = np.array([0.85])
    mock_model.predict_is_fraud.return_value = np.array([True])
    mock_model.get_info.return_value = {
        "model_version": "1.0.0",
        "ready": True,
        "model_path": "ml/artifacts/model.joblib",
    }

    with patch("app.dependencies.get_model_adapter", return_value=mock_model):
        from app.main import create_app
        app = create_app()
        with TestClient(app) as c:
            yield c


@pytest.fixture
def client_model_not_ready():
    """Client avec modèle non prêt."""
    mock_model = MagicMock()
    mock_model.ready = False
    mock_model.predict_proba.return_value = np.array([0.0])
    mock_model.get_info.return_value = {
        "model_version": "unknown",
        "ready": False,
        "model_path": "",
    }

    with patch("app.dependencies.get_model_adapter", return_value=mock_model):
        from app.main import create_app
        app = create_app()
        with TestClient(app) as c:
            yield c


# ── Payload helper ────────────────────────────────────────────────────────────

VALID_TX = {
    "step": 1,
    "type": "TRANSFER",
    "amount": 1000.0,
    "oldbalanceOrg": 5000.0,
    "newbalanceOrig": 4000.0,
    "oldbalanceDest": 0.0,
    "newbalanceDest": 1000.0,
}


# ── Tests GET /api/health ─────────────────────────────────────────────────────

class TestHealth:

    def test_health_retourne_200(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200

    def test_health_status_ok(self, client):
        data = client.get("/api/health").json()
        assert data["status"] == "ok"

    def test_health_model_ready_true(self, client):
        data = client.get("/api/health").json()
        assert data["model_ready"] is True

    def test_health_model_ready_false_quand_non_pret(self, client_model_not_ready):
        data = client_model_not_ready.get("/api/health").json()
        assert data["model_ready"] is False

    def test_health_champs_presents(self, client):
        data = client.get("/api/health").json()
        assert "status" in data
        assert "model_ready" in data


# ── Tests GET /api/model/info ─────────────────────────────────────────────────

class TestModelInfo:

    def test_model_info_retourne_200(self, client):
        res = client.get("/api/model/info")
        assert res.status_code == 200

    def test_model_info_champs_presents(self, client):
        data = client.get("/api/model/info").json()
        assert "model_version" in data
        assert "ready" in data
        assert "model_path" in data

    def test_model_info_ready_true(self, client):
        data = client.get("/api/model/info").json()
        assert data["ready"] is True

    def test_model_version_est_string(self, client):
        data = client.get("/api/model/info").json()
        assert isinstance(data["model_version"], str)


# ── Tests POST /api/predict ───────────────────────────────────────────────────

class TestPredict:

    def test_predict_retourne_200(self, client):
        res = client.post("/api/predict", json=VALID_TX)
        assert res.status_code == 200

    def test_predict_champs_presents(self, client):
        data = client.post("/api/predict", json=VALID_TX).json()
        assert "fraud_probability" in data
        assert "is_fraud" in data
        assert "model_version" in data

    def test_predict_fraud_probability_entre_0_et_1(self, client):
        data = client.post("/api/predict", json=VALID_TX).json()
        assert 0.0 <= data["fraud_probability"] <= 1.0

    def test_predict_is_fraud_est_booleen(self, client):
        data = client.post("/api/predict", json=VALID_TX).json()
        assert isinstance(data["is_fraud"], bool)

    def test_predict_type_payment(self, client):
        tx = {**VALID_TX, "type": "PAYMENT"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200

    def test_predict_type_cash_out(self, client):
        tx = {**VALID_TX, "type": "CASH_OUT"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200

    def test_predict_type_cash_in(self, client):
        tx = {**VALID_TX, "type": "CASH_IN"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200

    def test_predict_type_debit(self, client):
        tx = {**VALID_TX, "type": "DEBIT"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200

    def test_predict_type_invalide_retourne_422(self, client):
        tx = {**VALID_TX, "type": "VIREMENT_BIZARRE"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 422

    def test_predict_amount_negatif_retourne_422(self, client):
        tx = {**VALID_TX, "amount": -100.0}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 422

    def test_predict_amount_zero_accepte(self, client):
        tx = {**VALID_TX, "amount": 0.0}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200

    def test_predict_step_negatif_retourne_422(self, client):
        tx = {**VALID_TX, "step": -1}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 422

    def test_predict_champ_manquant_retourne_422(self, client):
        tx = {k: v for k, v in VALID_TX.items() if k != "amount"}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 422

    def test_predict_body_vide_retourne_422(self, client):
        res = client.post("/api/predict", json={})
        assert res.status_code == 422

    def test_predict_grand_montant(self, client):
        tx = {**VALID_TX, "amount": 9_999_999.99}
        res = client.post("/api/predict", json=tx)
        assert res.status_code == 200


# ── Tests POST /api/predict/batch ─────────────────────────────────────────────

class TestPredictBatch:

    def test_batch_retourne_200(self, client):
        payload = {"transactions": [VALID_TX]}
        res = client.post("/api/predict/batch", json=payload)
        assert res.status_code == 200

    def test_batch_retourne_liste(self, client):
        payload = {"transactions": [VALID_TX, VALID_TX]}

        mock_model = MagicMock()
        mock_model.ready = True
        mock_model.predict_proba.return_value = np.array([0.8, 0.2])

        with patch("app.dependencies.get_model_adapter", return_value=mock_model):
            from app.main import create_app
            app = create_app()
            with TestClient(app) as c:
                data = c.post("/api/predict/batch", json=payload).json()

        assert "predictions" in data
        assert len(data["predictions"]) == 2

    def test_batch_liste_vide(self, client):
        payload = {"transactions": []}
        res = client.post("/api/predict/batch", json=payload)
        assert res.status_code == 200
        assert res.json()["predictions"] == []

    def test_batch_cinq_transactions(self, client):
        mock_model = MagicMock()
        mock_model.ready = True
        mock_model.predict_proba.return_value = np.array([0.1, 0.5, 0.9, 0.3, 0.7])

        with patch("app.dependencies.get_model_adapter", return_value=mock_model):
            from app.main import create_app
            app = create_app()
            with TestClient(app) as c:
                payload = {"transactions": [VALID_TX] * 5}
                data = c.post("/api/predict/batch", json=payload).json()

        assert len(data["predictions"]) == 5

    def test_batch_chaque_prediction_a_les_bons_champs(self, client):
        payload = {"transactions": [VALID_TX]}
        data = client.post("/api/predict/batch", json=payload).json()
        pred = data["predictions"][0]
        assert "fraud_probability" in pred
        assert "is_fraud" in pred
        assert "model_version" in pred

    def test_batch_sans_cle_transactions_retourne_422(self, client):
        res = client.post("/api/predict/batch", json={"wrong_key": []})
        assert res.status_code == 422


# ── Tests POST /api/predict/wallet ────────────────────────────────────────────

class TestPredictWallet:

    VALID_WALLET = {
        "transaction_type": "TRANSFER",
        "amount": 500.0,
        "sender_balance": 2000.0,
        "receiver_balance": 100.0,
    }

    def test_wallet_retourne_200(self, client):
        res = client.post("/api/predict/wallet", json=self.VALID_WALLET)
        assert res.status_code == 200

    def test_wallet_champs_presents(self, client):
        data = client.post("/api/predict/wallet", json=self.VALID_WALLET).json()
        assert "fraud_probability" in data
        assert "is_fraud" in data
        assert "model_version" in data

    def test_wallet_type_inconnu_accepte(self, client):
        tx = {**self.VALID_WALLET, "transaction_type": "BIZARRE_TYPE"}
        res = client.post("/api/predict/wallet", json=tx)
        # Le endpoint mappe les types inconnus vers TRANSFER, donc 200
        assert res.status_code == 200

    def test_wallet_avec_champs_optionnels(self, client):
        tx = {
            **self.VALID_WALLET,
            "country": "FR",
            "city": "Paris",
            "currency_code": "EUR",
            "description": "Test",
            "status": "completed",
        }
        res = client.post("/api/predict/wallet", json=tx)
        assert res.status_code == 200

    def test_wallet_amount_negatif_retourne_422(self, client):
        tx = {**self.VALID_WALLET, "amount": -50.0}
        res = client.post("/api/predict/wallet", json=tx)
        assert res.status_code == 422

    def test_wallet_champ_manquant_retourne_422(self, client):
        tx = {"transaction_type": "TRANSFER", "amount": 100.0}
        res = client.post("/api/predict/wallet", json=tx)
        assert res.status_code == 422
