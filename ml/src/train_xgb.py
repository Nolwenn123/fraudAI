# ml/src/train_xgb.py

import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score
import xgboost as xgb
import joblib
import datetime

# =========================
# Config
# =========================
DATA_PATH = r'C:\Users\CE PC\fraudAI\data\processed\paysim_clean.parquet'
ARTIFACTS_DIR = Path("../artifacts")
ARTIFACTS_DIR.mkdir(exist_ok=True)
MODEL_NAME = f"xgb_fraud_model_{datetime.date.today()}.pkl"

# =========================
# 1️⃣ Charger le dataset
# =========================
print("📥 Chargement du dataset...")
df = pd.read_parquet(DATA_PATH)
print(f"✅ Dataset chargé : {len(df)} lignes, {len(df.columns)} colonnes")

# =========================
# 2️⃣ Encoder la colonne 'type'
# =========================
le = LabelEncoder()
df['type_encoded'] = le.fit_transform(df['type'])
print("✅ Colonne 'type' encodée")

# =========================
# 3️⃣ Définir features et label
# =========================
feature_cols = [
    'type_encoded',
    'amount',
    'oldbalanceOrg',
    'newbalanceOrig',
    'oldbalanceDest',
    'newbalanceDest'
]
X = df[feature_cols]
y = df['isFraud']

# =========================
# 4️⃣ Séparer train/test
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✅ Train/Test séparés : Train={X_train.shape}, Test={X_test.shape}")

# =========================
# 5️⃣ Calcul scale_pos_weight
# =========================
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"⚖️ scale_pos_weight calculé : {scale_pos_weight:.2f}")

# =========================
# 6️⃣ Créer et entraîner le modèle XGBoost
# =========================
model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    objective='binary:logistic',
    scale_pos_weight=scale_pos_weight,
    eval_metric='auc',
    use_label_encoder=False,
    random_state=42
)

print("⏳ Entraînement du modèle XGBoost...")
model.fit(X_train, y_train)
print("✅ Modèle entraîné")

# =========================
# 7️⃣ Évaluer le modèle
# =========================
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\n📊 Classification Report :")
print(classification_report(y_test, y_pred))
roc_auc = roc_auc_score(y_test, y_proba)
print(f"ROC-AUC : {roc_auc:.4f}")

# =========================
# 8️⃣ Sauvegarder le modèle
# =========================
model_path = ARTIFACTS_DIR / MODEL_NAME
joblib.dump(model, model_path)
print(f"💾 Modèle sauvegardé : {model_path}")

print("\n🎉 Entraînement terminé ! Modèle prêt pour le backend FastAPI")
