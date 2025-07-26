import os
from flask import Flask, render_template, request, jsonify
import numpy as np
import joblib
import pandas as pd

app = Flask(__name__)

# Feature columns
feature_columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

# Normalization constants (from UCI dataset)
means = [54.77, 0.675, 3.18, 132.27, 249.41, 0.168, 0.983,
         149.84, 0.345, 1.06, 1.586, 0.679, 4.805]
stds = [9.01, 0.468, 0.95, 17.87, 53.05, 0.374, 0.993,
        22.35, 0.475, 1.17, 0.614, 0.917, 1.939]

THRESHOLD = 0.3

# ------------------ Model Loading with Safety ------------------ #
try:
    model = joblib.load("models/random_forest_model.pkl")
    print("✅ Model loaded.")
except Exception as e:
    print("❌ Model load failed:", e)
    model = None

try:
    scaler = joblib.load("models/scaler.pkl")
    print("✅ Scaler loaded.")
except Exception as e:
    print("❌ Scaler load failed:", e)
    scaler = None

# ------------------ Routes ------------------ #
@app.route("/")
def index():
    return render_template("index.html", feature_columns=feature_columns)

@app.route("/predict", methods=["POST"])
def predict():
    if model is None or scaler is None:
        return "❌ Model not loaded on server", 500
    try:
        input_values = [request.form[col] for col in feature_columns]
        print("📥 Raw input:", input_values)

        input_scaled = [(float(v) - m) / s for v, m, s in zip(input_values, means, stds)]
        input_df = pd.DataFrame([input_scaled], columns=feature_columns)
        input_scaled_final = scaler.transform(input_df)

        proba = model.predict_proba(input_scaled_final)[0]
        prob_disease = proba[1]
        print(f"📊 Probability of heart disease: {prob_disease:.4f}")

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            result = (
                f"🧠 Positive: Risk of Heart Disease (prob={prob_disease:.2f} ≥ {THRESHOLD})"
                if prob_disease >= THRESHOLD
                else f"✅ Negative: No Heart Disease (prob={prob_disease:.2f} < {THRESHOLD})"
            )
            return jsonify({
                'prediction': result,
                'probability': prob_disease,
                'is_positive': prob_disease >= THRESHOLD,
                'threshold': THRESHOLD
            })
        else:
            result = (
                f"🧠 Positive: Risk of Heart Disease (prob={prob_disease:.2f} ≥ {THRESHOLD})"
                if prob_disease >= THRESHOLD
                else f"✅ Negative: No Heart Disease (prob={prob_disease:.2f} < {THRESHOLD})"
            )
            graph_url = (
                "/static/chart_930d8517.png"
                if prob_disease >= THRESHOLD
                else "/static/chart_aa744cfa.png"
            )
            return render_template("index.html", feature_columns=feature_columns, prediction=result, graph_url=graph_url)
    except Exception as e:
        print("❌ Prediction error:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route("/dashboard")
def dashboard():
    stats = {'total_patients': 120, 'positive_cases': 35, 'negative_cases': 85}
    predictions = [
        {'id': 1001, 'age': 65, 'sex': 'Male', 'prediction': 'Positive', 'probability': '0.30', 'graph_url': '/static/chart_930d8517.png'},
        {'id': 1002, 'age': 41, 'sex': 'Female', 'prediction': 'Negative', 'probability': '0.17', 'graph_url': '/static/chart_aa744cfa.png'},
    ]
    return render_template("dashboard.j2", **stats, predictions=predictions)

@app.route("/health")
def health():
    return "OK", 200

# ------------------ Run App ------------------ #
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
