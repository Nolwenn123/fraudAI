# 📊 Métriques ML — fraudAI

## Modèle utilisé
**XGBoost** (XGBClassifier) entraîné sur le dataset **PaySim**.

---

## Feature Engineering

Les 6 features utilisées ont été sélectionnées pour leur pertinence dans la détection de fraude :

| Feature | Description | Pourquoi pertinente |
|---|---|---|
| `type` | Type de transaction (TRANSFER, CASH_OUT, PAYMENT, CASH_IN, DEBIT) | Les fraudes surviennent quasi-exclusivement sur TRANSFER et CASH_OUT |
| `amount` | Montant de la transaction | Les transactions frauduleuses tendent à vider complètement le compte |
| `oldbalanceOrg` | Solde émetteur AVANT la transaction | Fraude souvent = solde initial élevé suivi d'un vidage complet |
| `newbalanceOrig` | Solde émetteur APRÈS la transaction | Si ≈ 0 après un montant élevé → fort signal de fraude |
| `oldbalanceDest` | Solde destinataire AVANT la transaction | Les comptes mules ont souvent un solde initial de 0 |
| `newbalanceDest` | Solde destinataire APRÈS la transaction | Combiné avec oldbalanceDest, détecte les anomalies de flux |

### Encodage
- La feature `type` est encodée en **One-Hot Encoding** (5 colonnes binaires).
- Les features numériques sont utilisées telles quelles (XGBoost est robuste aux échelles).

---

## Gestion du déséquilibre de classes

Le dataset PaySim est très déséquilibré :
- **~99.87%** de transactions légitimes
- **~0.13%** de fraudes

Pour compenser, on utilise le paramètre **`scale_pos_weight`** de XGBoost :

```
scale_pos_weight = nb_transactions_légitimes / nb_fraudes
```

Cela permet au modèle de ne pas ignorer les fraudes (classe minoritaire).

---

## Métriques du modèle

Les métriques sont calculées sur le **jeu de test (20% du dataset)** après entraînement.

Les fichiers générés après `python ml/src/train_xgb.py` :

| Fichier | Description |
|---|---|
| `ml/artifacts/metrics.json` | Toutes les métriques en JSON |
| `ml/artifacts/confusion_matrix.png` | Matrice de confusion |
| `ml/artifacts/roc_curve.png` | Courbe ROC avec score AUC |
| `ml/artifacts/precision_recall_curve.png` | Courbe Precision-Recall |

### Définitions

**Precision (Fraude)** : Parmi toutes les transactions prédites comme fraudes, quelle proportion l'est vraiment ?
> Une precision élevée = peu de faux positifs (peu de transactions légitimes bloquées à tort)

**Recall (Fraude)** : Parmi toutes les vraies fraudes, quelle proportion le modèle a-t-il détectée ?
> Un recall élevé = peu de faux négatifs (peu de fraudes manquées)

**F1-Score** : Moyenne harmonique de la Precision et du Recall.
> Utile quand les deux métriques sont importantes (cas de la fraude)

**ROC-AUC** : Aire sous la courbe ROC. Mesure la capacité du modèle à distinguer fraude/non-fraude.
> 1.0 = parfait, 0.5 = aléatoire

**Average Precision (AP)** : Aire sous la courbe Precision-Recall.
> Plus robuste que l'AUC quand les classes sont très déséquilibrées

### Pourquoi le Recall est particulièrement important ici ?

Dans un contexte de détection de fraude, **manquer une fraude (faux négatif) est plus coûteux** que bloquer une transaction légitime (faux positif). On cherche donc un **recall élevé** sur la classe fraude, quitte à accepter un peu plus de faux positifs.

---

## Hyperparamètres du modèle

| Paramètre | Valeur | Justification |
|---|---|---|
| `n_estimators` | 200 | Nombre d'arbres — bon compromis performance/temps |
| `max_depth` | 6 | Profondeur des arbres — évite le surapprentissage |
| `learning_rate` | 0.1 | Taux d'apprentissage standard |
| `scale_pos_weight` | calculé | Compense le déséquilibre des classes |
| `objective` | binary:logistic | Classification binaire (fraude / non-fraude) |
| `eval_metric` | auc | Métrique d'évaluation pendant l'entraînement |

---

## Reproduire les métriques

```bash
# Depuis la racine du projet
python ml/src/train_xgb.py
```

Les résultats sont sauvegardés dans `ml/artifacts/`.
