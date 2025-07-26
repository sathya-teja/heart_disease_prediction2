import numpy as np
import joblib
import pandas as pd

# Load the trained model and scaler
model = joblib.load("models/random_forest_model.pkl")
scaler = joblib.load("models/scaler.pkl")

feature_columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]


# Helper: preprocess raw input
# Use mean and std from UCI model training
means = [54.77215189873418, 0.6751054852320675, 3.1856540084388185, 132.27004219409284, 249.40928270042195, 0.16877637130801687, 0.9831223628691983, 149.8438818565401, 0.3459915611814346, 1.0616033755274261, 1.5864978902953586, 0.679324894514768, 4.805907172995781]
stds = [9.013280450715815, 0.46833542364596153, 0.9542956923697674, 17.878011067930768, 53.05006391061259, 0.3745542788383485, 0.9935073817122748, 22.350225706927414, 0.4756904463752327, 1.17710327190575, 0.6144421958336403, 0.9177772910935037, 1.9390194245896273]

def preprocess_raw(values):
    # values: list of raw input values in feature_columns order
    # scale numeric columns
    scaled = [(v - m) / s for v, m, s in zip(values, means, stds)]
    # categorical columns: already encoded as numbers
    return scaled

THRESHOLD = 0.3  # Lower threshold for positive prediction
print(f"Using threshold for 'Disease' prediction: {THRESHOLD}")

samples = [
    ("UCI healthy sample", [41, 0, 2, 130, 204, 0, 2, 172, 0, 1.4, 1, 0, 3]),
    ("UCI risky sample", [67, 1, 4, 160, 286, 0, 2, 108, 1, 1.5, 2, 3, 3]),
    ("Outside healthy sample", [40, 0, 2, 120, 180, 0, 0, 160, 0, 0.0, 1, 0, 3]),
    ("Outside risky sample", [65, 1, 4, 170, 320, 1, 2, 100, 1, 3.0, 2, 2, 7]),
    ("Very young healthy sample", [22, 0, 2, 110, 160, 0, 0, 180, 0, 0.0, 1, 0, 3]),
    ("Elderly risky sample", [80, 1, 4, 180, 350, 1, 2, 90, 1, 4.0, 2, 3, 7]),
    ("Middle-aged borderline sample", [50, 1, 3, 140, 220, 0, 1, 130, 0, 1.2, 2, 1, 6]),
]

for label, raw in samples:
    scaled = preprocess_raw(raw)
    input_df = pd.DataFrame([scaled], columns=feature_columns)
    scaled_input = scaler.transform(input_df)
    prediction = model.predict(scaled_input)[0]
    proba = model.predict_proba(scaled_input)[0]
    print(f"{label} (raw):", raw)
    print("Scaled input:", scaled)
    print("Prediction:", prediction)
    print("Probabilities [No Disease, Disease]:", proba)
    if proba[1] >= THRESHOLD:
        print(f"🧠 Positive: Risk of Heart Disease (prob={proba[1]:.2f} >= {THRESHOLD})")
    else:
        print(f"✅ Negative: No Heart Disease (prob={proba[1]:.2f} < {THRESHOLD})")
    print()
