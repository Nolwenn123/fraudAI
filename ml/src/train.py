from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
import joblib

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT.parent / "fraudAI" / "data" / "raw" / "paysim.csv"
OUT_PATH = ROOT / "artifacts" / "model.joblib"

def main():
    df = pd.read_csv(CSV_PATH)

    # target
    y = df["isFraud"]

    # features (simple baseline)
    X = df[["type", "amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]]

    cat_features = ["type"]
    num_features = ["amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]

    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_features),
            ("num", "passthrough", num_features),
        ]
    )

    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        n_jobs=4
    )

    pipe = Pipeline([("pre", pre), ("model", model)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)

    print(classification_report(y_test, preds))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, OUT_PATH)
    print(f"Saved model to: {OUT_PATH}")

if __name__ == "__main__":
    main()
