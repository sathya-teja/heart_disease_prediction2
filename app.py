
from flask import Flask, render_template, request, jsonify
import numpy as np
import joblib
import pandas as pd

app = Flask(__name__)

# UCI feature columns
feature_columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

# UCI means and stds
means = [54.77215189873418, 0.6751054852320675, 3.1856540084388185, 132.27004219409284, 249.40928270042195, 0.16877637130801687, 0.9831223628691983, 149.8438818565401, 0.3459915611814346, 1.0616033755274261, 1.5864978902953586, 0.679324894514768, 4.805907172995781]
stds = [9.013280450715815, 0.46833542364596153, 0.9542956923697674, 17.878011067930768, 53.05006391061259, 0.3745542788383485, 0.9935073817122748, 22.350225706927414, 0.4756904463752327, 1.17710327190575, 0.6144421958336403, 0.9177772910935037, 1.9390194245896273]

model = joblib.load("models/random_forest_model.pkl")
scaler = joblib.load("models/scaler.pkl")
THRESHOLD = 0.3  # Lower threshold for positive prediction

@app.route("/")
def index():
    return render_template("index.html", feature_columns=feature_columns)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get input values from form in correct order
        input_values = [request.form[col] for col in feature_columns]
        # Preprocess raw input using UCI means/stds
        input_scaled = [(float(v) - m) / s for v, m, s in zip(input_values, means, stds)]
        input_df = pd.DataFrame([input_scaled], columns=feature_columns)
        input_scaled_final = scaler.transform(input_df)
        proba = model.predict_proba(input_scaled_final)[0]
        prob_disease = proba[1]
        
        # Check if this is an AJAX request
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Return JSON for AJAX requests
            if prob_disease >= THRESHOLD:
                result = f"🧠 Positive: Risk of Heart Disease (prob={prob_disease:.2f} >= {THRESHOLD})"
                is_positive = True
            else:
                result = f"✅ Negative: No Heart Disease (prob={prob_disease:.2f} < {THRESHOLD})"
                is_positive = False
            
            return jsonify({
                'prediction': result,
                'probability': prob_disease,
                'is_positive': is_positive,
                'threshold': THRESHOLD
            })
        else:
            # Return HTML for regular form submissions
            if prob_disease >= THRESHOLD:
                result = f"🧠 Positive: Risk of Heart Disease (prob={prob_disease:.2f} >= {THRESHOLD})"
                graph_url = "/static/chart_930d8517.png"  # Example: use a relevant chart for positive
            else:
                result = f"✅ Negative: No Heart Disease (prob={prob_disease:.2f} < {THRESHOLD})"
                graph_url = "/static/chart_aa744cfa.png"  # Example: use a relevant chart for negative
            return render_template("index.html", feature_columns=feature_columns, prediction=result, graph_url=graph_url)
    except Exception as e:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': str(e)}), 400
        else:
            return f"❌ Error: {e}"

    # Doctor dashboard route
@app.route("/dashboard")
def dashboard():
    # Example dynamic data; replace with real DB queries or logic
    stats = {
        'total_patients': 120,
        'positive_cases': 35,
        'negative_cases': 85
    }
    predictions = [
        {'id': 1001, 'age': 65, 'sex': 'Male', 'prediction': 'Positive', 'probability': '0.30', 'graph_url': '/static/chart_930d8517.png'},
        {'id': 1002, 'age': 41, 'sex': 'Female', 'prediction': 'Negative', 'probability': '0.17', 'graph_url': '/static/chart_aa744cfa.png'},
        {'id': 1003, 'age': 54, 'sex': 'Male', 'prediction': 'Negative', 'probability': '0.22', 'graph_url': '/static/chart_aa744cfa.png'},
        {'id': 1004, 'age': 70, 'sex': 'Female', 'prediction': 'Positive', 'probability': '0.35', 'graph_url': '/static/chart_aa744cfa.png'},
    ]
    return render_template("dashboard.j2",
        total_patients=stats['total_patients'],
        positive_cases=stats['positive_cases'],
        negative_cases=stats['negative_cases'],
        predictions=predictions)
if __name__ == "__main__":
    app.run(debug=True)
