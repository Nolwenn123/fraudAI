# fraudAI

Projet FastAPI + Next.js pour la détection de fraude (PaySim + XGBoost).

## Prérequis
- Python 3.10+ (recommandé 3.11/3.12)
- Node.js 18+ (ou 20+)
- `paysim.csv` présent dans `data/raw/paysim.csv`

## Installation & démarrage (depuis la racine du repo)

### 1) Backend (FastAPI)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirement.txt
uvicorn backend.app.main:app --reload --port 8000
```

### 2) Entraîner le modèle XGBoost (optionnel mais recommandé)
```bash
python ml/src/train_xgb.py
```
Le modèle est sauvegardé dans `ml/artifacts/model.joblib` et chargé au démarrage du backend.

### 3) Frontend (Next.js)
```bash
cd frontend
pnpm install
pnpm dev
```
Si vous n’avez pas `pnpm`, vous pouvez utiliser :
```bash
npm install
npm run dev
```

Le front tourne par défaut sur `http://localhost:3000`.

## Endpoints principaux
- `GET /api/health` : statut API et modèle.
- `GET /api/model/info` : métadonnées du modèle (version, ready).
- `GET /api/transactions` : transactions aléatoires (paramètres `limit`, `use_model`, `min_fraud`).
- `GET /api/transactions/list` : transactions paginées (paramètres `limit`, `offset`, `use_model`).
- `GET /api/transactions/fraud` : transactions frauduleuses (paramètres `limit`, `use_model`).
- `GET /api/stats` : stats globales (total, fraud, approval rate, latence, etc).
- `POST /api/predict` : prédiction pour une transaction.
- `POST /api/predict/batch` : prédictions multiples.

Docs interactives : `http://localhost:8000/docs`.

## Variables d’environnement (optionnel)
Fichier `.env` à la racine du backend (`backend/.env`) :
- `MODEL_PATH` : chemin vers le modèle XGBoost. Défaut : `ml/artifacts/model.joblib`
- `DECISION_THRESHOLD` : seuil de classification (défaut 0.5)

## Structure rapide
- `backend/` : API FastAPI
- `frontend/` : Next.js / React
- `ml/` : code d’entraînement et artefacts
- `data/` : datasets (PaySim)
