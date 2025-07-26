import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib

# UCI Cleveland processed data path
uci_path = "heart+disease/processed.cleveland.data"

# Feature names in order (from heart-disease.names)
feature_names = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal", "num"
]

# Load data
uci_df = pd.read_csv(uci_path, header=None, names=feature_names)

# Replace missing values ('?' and -9.0) with NaN, then drop rows with NaN
uci_df.replace(['?', -9.0], np.nan, inplace=True)
uci_df = uci_df.dropna()

# Convert target to binary: 0 = healthy, 1 = heart disease (1-4)
uci_df["target"] = (uci_df["num"] > 0).astype(int)
uci_df.drop("num", axis=1, inplace=True)

# Split features/target
X = uci_df.drop("target", axis=1)
y = uci_df["target"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Fit scaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Fit model with class_weight='balanced'
model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
model.fit(X_train_scaled, y_train)

# Save model and scaler
joblib.dump(model, "models/random_forest_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

# Save means/stds for test_model.py preprocessing
means = scaler.mean_.tolist()
stds = scaler.scale_.tolist()
with open("models/uci_means_stds.txt", "w") as f:
    f.write(str(means) + "\n" + str(stds) + "\n")

print("Balanced model and scaler trained and saved using UCI Cleveland data.")
print("Means:", means)
print("Stds:", stds)
print("Test accuracy:", model.score(X_test_scaled, y_test))
