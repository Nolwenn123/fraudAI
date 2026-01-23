import pandas as pd
from pathlib import Path

print("🚀 Vérification du dataset Paysim lancé")

PROCESSED_DATA = Path("data/processed/paysim_clean.parquet")
df = pd.read_parquet(PROCESSED_DATA)

print("✅ Dataset chargé")
print(f"Nombre de lignes : {len(df)}")
print(f"Nombre de colonnes : {len(df.columns)}")
print("🔎 Colonnes :", df.columns.tolist())

# 1️⃣ Vérification des valeurs manquantes
print("\n🔍 Vérification des valeurs manquantes :")
missing = df.isna().sum()
print(missing)

if missing.sum() == 0:
    print("✅ Pas de valeurs manquantes")
else:
    print("⚠️ Attention, certaines colonnes contiennent des NaN")

# 2️⃣ Vérification des types de données
print("\nℹ️ Types de données :")
print(df.dtypes)

# Vérifier que les colonnes numériques sont bien float/int
numeric_cols = ["amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]
for col in numeric_cols:
    if not pd.api.types.is_numeric_dtype(df[col]):
        print(f"⚠️ Colonne {col} n'est pas numérique !")

# Vérifier que isFraud est bien int
if not pd.api.types.is_integer_dtype(df['isFraud']):
    print("⚠️ Colonne isFraud n'est pas entière !")

# 3️⃣ Vérification du déséquilibre des classes
print("\n📊 Répartition des fraudes vs non-fraudes :")
counts = df['isFraud'].value_counts()
percent = df['isFraud'].value_counts(normalize=True) * 100
print(pd.DataFrame({"count": counts, "percent": percent}))

# 4️⃣ Statistiques descriptives rapides
print("\n🔎 Statistiques descriptives :")
print(df.describe())

# 5️⃣ Vérification des valeurs aberrantes simples
if (df[numeric_cols] < 0).any().any():
    print("⚠️ Certaines valeurs numériques sont négatives !")
else:
    print("✅ Pas de valeurs négatives dans les colonnes numériques")

print("\n🎉 Vérification terminée ! Si tout est OK, le dataset est prêt pour XGBoost.")
