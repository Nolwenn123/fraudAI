from pathlib import Path
import joblib

ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = ROOT / "ml" / "artifacts" / "model.joblib"

_model = None

def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model
