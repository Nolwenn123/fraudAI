from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .version import MODEL_VERSION

ROOT_DIR = Path(__file__).resolve().parents[3]
ML_ARTIFACTS_DIR = ROOT_DIR / "ml" / "artifacts"


class Settings(BaseSettings):
    api_title: str = "Fraud Detection API"
    api_description: str = "Score PaySim transactions and flag potential fraud."
    api_version: str = MODEL_VERSION
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    model_path: str = Field(
        default_factory=lambda: str(ML_ARTIFACTS_DIR / "model.joblib")
    )
    feature_order_path: str = Field(
        default_factory=lambda: str(ML_ARTIFACTS_DIR / "feature_order.json")
    )
    decision_threshold: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
