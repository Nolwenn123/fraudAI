"""Dependency injection: wires adapters into application services for FastAPI."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import Depends

from app.adapters.output.metrics.in_memory_metrics_adapter import InMemoryMetricsAdapter
from app.adapters.output.ml.xgboost_model_adapter import XGBoostModelAdapter
from app.adapters.output.persistence.csv_transaction_repository import CsvTransactionRepository
from app.application.ports.input.get_stats_use_case import GetStatsUseCase
from app.application.ports.input.get_transactions_use_case import GetTransactionsUseCase
from app.application.ports.input.predict_fraud_use_case import PredictFraudUseCase
from app.application.ports.output.fraud_model_port import FraudModelPort
from app.application.services.fraud_detection_service import FraudDetectionService
from app.application.services.stats_service import StatsService
from app.application.services.transaction_service import TransactionService
from app.core.config import Settings, get_settings
from ml.model_service import ModelService

ROOT_DIR = Path(__file__).resolve().parents[2]
PAYSIM_PATH = ROOT_DIR / "data" / "raw" / "paysim.csv"

# ---------------------------------------------------------------------------
# Singletons (created once, reused across requests)
# ---------------------------------------------------------------------------

_model_service: Optional[ModelService] = None
_model_adapter: Optional[XGBoostModelAdapter] = None
_csv_repo: Optional[CsvTransactionRepository] = None
_metrics_adapter: Optional[InMemoryMetricsAdapter] = None


def _get_raw_model_service(settings: Settings) -> ModelService:
    global _model_service
    if _model_service is None:
        _model_service = ModelService(
            model_path=settings.model_path,
            feature_order_path=settings.feature_order_path,
            decision_threshold=settings.decision_threshold,
        )
        _model_service.load()
    return _model_service


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

def get_model_adapter(settings: Settings = Depends(get_settings)) -> FraudModelPort:
    """Return the XGBoost adapter (output port implementation)."""
    global _model_adapter
    if _model_adapter is None:
        _model_adapter = XGBoostModelAdapter(_get_raw_model_service(settings))
    return _model_adapter


def get_csv_repository() -> CsvTransactionRepository:
    """Return the CSV-backed transaction repository (output port implementation)."""
    global _csv_repo
    if _csv_repo is None:
        _csv_repo = CsvTransactionRepository(PAYSIM_PATH)
    return _csv_repo


def get_metrics_adapter() -> InMemoryMetricsAdapter:
    """Return the in-memory metrics adapter (output port implementation)."""
    global _metrics_adapter
    if _metrics_adapter is None:
        _metrics_adapter = InMemoryMetricsAdapter()
    return _metrics_adapter


def get_fraud_detection_service(
    model: FraudModelPort = Depends(get_model_adapter),
    settings: Settings = Depends(get_settings),
) -> PredictFraudUseCase:
    """Return the fraud detection application service (input port implementation)."""
    return FraudDetectionService(model, decision_threshold=settings.decision_threshold)


def get_transaction_service(
    model: FraudModelPort = Depends(get_model_adapter),
    repo: CsvTransactionRepository = Depends(get_csv_repository),
) -> GetTransactionsUseCase:
    """Return the transaction retrieval application service."""
    return TransactionService(repo, model)


def get_stats_service(
    model: FraudModelPort = Depends(get_model_adapter),
    repo: CsvTransactionRepository = Depends(get_csv_repository),
    metrics: InMemoryMetricsAdapter = Depends(get_metrics_adapter),
) -> GetStatsUseCase:
    """Return the statistics application service."""
    return StatsService(repo, model, metrics)
