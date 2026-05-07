from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load artifacts
MODEL_PATH = os.path.join("models", "iot_health_model.pkl")
SCALER_PATH = os.path.join("models", "iot_health_scaler.pkl")
ENCODER_PATH = os.path.join("models", "iot_health_label_encoder.pkl")
FEATURES_PATH = os.path.join("models", "iot_health_features.pkl")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(ENCODER_PATH)
features = joblib.load(FEATURES_PATH)  # list of feature names
FEATURE_LIST = list(features)

print("Model expects features:", FEATURE_LIST)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Fill missing time-based features automatically using current server time
        now = datetime.now()
        if "hour" in FEATURE_LIST and "hour" not in data:
            data["hour"] = now.hour
        if "day" in FEATURE_LIST and "day" not in data:
            data["day"] = now.day
        if "month" in FEATURE_LIST and "month" not in data:
            data["month"] = now.month
        if "dayofweek" in FEATURE_LIST and "dayofweek" not in data:
            data["dayofweek"] = now.weekday()
        if "day_of_week" in FEATURE_LIST and "day_of_week" not in data:
            data["day_of_week"] = now.weekday()   # Monday=0, Sunday=6
        if "minute" in FEATURE_LIST and "minute" not in data:
            data["minute"] = now.minute
        if "second" in FEATURE_LIST and "second" not in data:
            data["second"] = now.second

        # Extract values in the exact order the model expects
        input_values = []
        for f in FEATURE_LIST:
            if f not in data:
                return jsonify({
                    "error": f"Missing feature: {f}. "
                             "Check the feature list or ensure the server clock is correct."
                }), 400
            input_values.append(data[f])

        input_array = np.array([input_values])
        input_scaled = scaler.transform(input_array)

        prediction_encoded = model.predict(input_scaled)[0]
        prediction_class = label_encoder.inverse_transform([prediction_encoded])[0]

        proba = None
        classes = None
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_scaled).tolist()[0]
            classes = label_encoder.inverse_transform(range(len(proba))).tolist()

        return jsonify({
            "status": prediction_class,
            "probabilities": proba,
            "classes": classes
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)