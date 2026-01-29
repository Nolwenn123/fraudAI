# ml/src/train_xgb.py

from pathlib import Path

import joblib
import pandas as pd
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT_DIR / "data" / "raw" / "paysim.csv"
ARTIFACTS_DIR = ROOT_DIR / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"

print("📥 Chargement du dataset...")
df = pd.read_csv(DATA_PATH)
print(f"✅ Dataset chargé : {len(df)} lignes, {len(df.columns)} colonnes")

feature_cols = [
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
]

X = df[feature_cols]
y = df["isFraud"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✅ Train/Test séparés : Train={X_train.shape}, Test={X_test.shape}")

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"⚖️ scale_pos_weight calculé : {scale_pos_weight:.2f}")

preprocess = ColumnTransformer(
    transformers=[
        ("type", OneHotEncoder(handle_unknown="ignore"), ["type"]),
    ],
    remainder="passthrough",
)

model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    objective="binary:logistic",
    scale_pos_weight=scale_pos_weight,
    eval_metric="auc",
    random_state=42,
)

pipeline = Pipeline(
    steps=[
        ("preprocess", preprocess),
        ("model", model),
    ]
)

print("⏳ Entraînement du modèle XGBoost...")
pipeline.fit(X_train, y_train)
print("✅ Modèle entraîné")

y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

print("\n📊 Classification Report :")
print(classification_report(y_test, y_pred))
roc_auc = roc_auc_score(y_test, y_proba)
print(f"ROC-AUC : {roc_auc:.4f}")

joblib.dump(pipeline, MODEL_PATH)
print(f"💾 Modèle sauvegardé : {MODEL_PATH}")

print("\n🎉 Entraînement terminé ! Modèle prêt pour le backend FastAPI")
