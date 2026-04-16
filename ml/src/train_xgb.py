# ml/src/train_xgb.py
"""
Script d'entraînement XGBoost pour la détection de fraude (PaySim).

Feature Engineering :
---------------------
Les features utilisées sont issues du dataset PaySim et ont été choisies
pour leur pertinence dans la détection de fraude :

- type          : Type de transaction (TRANSFER, CASH_OUT, PAYMENT, CASH_IN, DEBIT)
                  Encodé en One-Hot. Les fraudes surviennent quasi-exclusivement
                  sur les types TRANSFER et CASH_OUT.

- amount        : Montant de la transaction. Les transactions frauduleuses
                  tendent à vider complètement le compte source.

- oldbalanceOrg : Solde du compte émetteur AVANT la transaction.
                  Indicateur clé : fraude souvent = solde initial élevé.

- newbalanceOrig: Solde du compte émetteur APRÈS la transaction.
                  Si newbalanceOrig ≈ 0 et amount > 0 → fort signal de fraude.

- oldbalanceDest: Solde du compte destinataire AVANT la transaction.
                  Les comptes mules ont souvent un solde initial de 0.

- newbalanceDest: Solde du compte destinataire APRÈS la transaction.
                  Combiné avec oldbalanceDest, permet de détecter les anomalies.

Gestion du déséquilibre de classes :
-------------------------------------
Le dataset PaySim est très déséquilibré (~0.13% de fraudes).
On utilise scale_pos_weight = nb_non_fraud / nb_fraud pour compenser.
"""

import json
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")  # pas d'interface graphique nécessaire
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    average_precision_score,
    precision_recall_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# ── Chemins ──────────────────────────────────────────────────────────────────
ROOT_DIR     = Path(__file__).resolve().parents[2]
DATA_PATH    = ROOT_DIR / "data" / "raw" / "paysim.csv"
ARTIFACTS_DIR = ROOT_DIR / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH   = ARTIFACTS_DIR / "model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
CM_PATH      = ARTIFACTS_DIR / "confusion_matrix.png"
ROC_PATH     = ARTIFACTS_DIR / "roc_curve.png"
PR_PATH      = ARTIFACTS_DIR / "precision_recall_curve.png"

# ── Chargement des données ────────────────────────────────────────────────────
print("📥 Chargement du dataset...")
df = pd.read_csv(DATA_PATH)
print(f"✅ Dataset chargé : {len(df)} lignes, {len(df.columns)} colonnes")
print(f"   Fraudes : {df['isFraud'].sum()} ({df['isFraud'].mean()*100:.3f}%)")

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

# ── Split Train / Test ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✅ Train/Test séparés : Train={X_train.shape}, Test={X_test.shape}")

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"⚖️  scale_pos_weight calculé : {scale_pos_weight:.2f}")

# ── Pipeline ──────────────────────────────────────────────────────────────────
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

# ── Entraînement ──────────────────────────────────────────────────────────────
print("⏳ Entraînement du modèle XGBoost...")
pipeline.fit(X_train, y_train)
print("✅ Modèle entraîné")

# ── Prédictions ───────────────────────────────────────────────────────────────
y_pred  = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

# ── Métriques ─────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("📊 MÉTRIQUES DU MODÈLE")
print("="*60)

report_dict = classification_report(y_test, y_pred, output_dict=True)
report_str  = classification_report(y_test, y_pred)
print("\nClassification Report :")
print(report_str)

roc_auc  = roc_auc_score(y_test, y_proba)
avg_prec = average_precision_score(y_test, y_proba)

precision_fraud = report_dict["1"]["precision"]
recall_fraud    = report_dict["1"]["recall"]
f1_fraud        = report_dict["1"]["f1-score"]
accuracy        = report_dict["accuracy"]

print(f"ROC-AUC Score     : {roc_auc:.4f}")
print(f"Average Precision : {avg_prec:.4f}")
print(f"Accuracy          : {accuracy:.4f}")
print(f"\n--- Classe Fraude (1) ---")
print(f"Precision : {precision_fraud:.4f}")
print(f"Recall    : {recall_fraud:.4f}")
print(f"F1-Score  : {f1_fraud:.4f}")

# ── Sauvegarde des métriques en JSON ──────────────────────────────────────────
metrics = {
    "roc_auc": round(roc_auc, 4),
    "average_precision": round(avg_prec, 4),
    "accuracy": round(accuracy, 4),
    "fraud_class": {
        "precision": round(precision_fraud, 4),
        "recall":    round(recall_fraud, 4),
        "f1_score":  round(f1_fraud, 4),
        "support":   int(report_dict["1"]["support"]),
    },
    "non_fraud_class": {
        "precision": round(report_dict["0"]["precision"], 4),
        "recall":    round(report_dict["0"]["recall"], 4),
        "f1_score":  round(report_dict["0"]["f1-score"], 4),
        "support":   int(report_dict["0"]["support"]),
    },
    "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    "dataset": {
        "total_rows":    len(df),
        "fraud_count":   int(df["isFraud"].sum()),
        "fraud_rate_pct": round(df["isFraud"].mean() * 100, 3),
        "train_size":    len(X_train),
        "test_size":     len(X_test),
    },
    "model_params": {
        "n_estimators":     200,
        "max_depth":        6,
        "learning_rate":    0.1,
        "scale_pos_weight": round(float(scale_pos_weight), 2),
    },
    "features": feature_cols,
}

with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"\n💾 Métriques sauvegardées : {METRICS_PATH}")

# ── Confusion Matrix ──────────────────────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(6, 5))
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Non-Fraude", "Fraude"])
disp.plot(ax=ax, colorbar=True, cmap="Blues")
ax.set_title("Confusion Matrix — XGBoost FraudAI")
plt.tight_layout()
plt.savefig(CM_PATH, dpi=150)
plt.close()
print(f"📊 Confusion matrix sauvegardée : {CM_PATH}")

# ── Courbe ROC ────────────────────────────────────────────────────────────────
fpr, tpr, _ = roc_curve(y_test, y_proba)
fig, ax = plt.subplots(figsize=(7, 5))
ax.plot(fpr, tpr, color="steelblue", lw=2, label=f"ROC curve (AUC = {roc_auc:.4f})")
ax.plot([0, 1], [0, 1], color="gray", linestyle="--", lw=1, label="Random classifier")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate")
ax.set_title("Courbe ROC — XGBoost FraudAI")
ax.legend(loc="lower right")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(ROC_PATH, dpi=150)
plt.close()
print(f"📈 Courbe ROC sauvegardée : {ROC_PATH}")

# ── Courbe Precision-Recall ───────────────────────────────────────────────────
precisions, recalls, _ = precision_recall_curve(y_test, y_proba)
fig, ax = plt.subplots(figsize=(7, 5))
ax.plot(recalls, precisions, color="darkorange", lw=2,
        label=f"PR curve (AP = {avg_prec:.4f})")
ax.axhline(y=df["isFraud"].mean(), color="gray", linestyle="--", lw=1,
           label=f"Baseline (fraud rate = {df['isFraud'].mean()*100:.2f}%)")
ax.set_xlabel("Recall")
ax.set_ylabel("Precision")
ax.set_title("Courbe Precision-Recall — XGBoost FraudAI")
ax.legend(loc="upper right")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(PR_PATH, dpi=150)
plt.close()
print(f"📉 Courbe Precision-Recall sauvegardée : {PR_PATH}")

# ── Sauvegarde du modèle ──────────────────────────────────────────────────────
joblib.dump(pipeline, MODEL_PATH)
print(f"\n💾 Modèle sauvegardé : {MODEL_PATH}")

print("\n🎉 Entraînement terminé !")
print(f"   ROC-AUC   : {roc_auc:.4f}")
print(f"   Precision : {precision_fraud:.4f}")
print(f"   Recall    : {recall_fraud:.4f}")
print(f"   F1-Score  : {f1_fraud:.4f}")
