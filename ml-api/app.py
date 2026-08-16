from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ============================================================
# 1. Load ML Model
# ============================================================
MODEL_PATH = os.path.join("models", "iot_health_model.pkl")
SCALER_PATH = os.path.join("models", "iot_health_scaler.pkl")
ENCODER_PATH = os.path.join("models", "iot_health_label_encoder.pkl")
FEATURES_PATH = os.path.join("models", "iot_health_features.pkl")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(ENCODER_PATH)
FEATURE_LIST = list(joblib.load(FEATURES_PATH))

print("✅ Model loaded. Features:", FEATURE_LIST)

# ============================================================
# 2. AWS API Gateway URL (Real Data)
# ============================================================
AWS_API_URL = 'https://6h8y7alzu6.execute-api.eu-north-1.amazonaws.com/prod/metrics'

def fetch_real_aws_data():
    """100% Real AWS Data ගන්නවා"""
    try:
        response = requests.get(AWS_API_URL, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'metrics' in data:
                return data['metrics']
        return None
    except Exception as e:
        print(f"Error fetching AWS data: {e}")
        return None

def run_prediction(input_data):
    """ML Model එක Run කරනවා"""
    input_values = []
    for f in FEATURE_LIST:
        if f not in input_data:
            now = datetime.now()
            if f == "hour": input_values.append(now.hour)
            elif f == "day": input_values.append(now.day)
            elif f == "month": input_values.append(now.month)
            elif f == "dayofweek" or f == "day_of_week": input_values.append(now.weekday())
            elif f == "minute": input_values.append(now.minute)
            elif f == "second": input_values.append(now.second)
            else:
                return None, f"Missing: {f}"
        else:
            input_values.append(input_data[f])

    input_array = np.array([input_values])
    input_scaled = scaler.transform(input_array)

    pred_encoded = model.predict(input_scaled)[0]
    pred_class = label_encoder.inverse_transform([pred_encoded])[0]

    proba = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(input_scaled).tolist()[0]

    return {"status": pred_class, "probabilities": proba}, None

# ============================================================
# 3. API Endpoints
# ============================================================
@app.route("/diagnose", methods=["GET"])
def diagnose():
    """100% Real AWS Data වලින් ML Prediction එක"""
    try:
        # 1. Fetch Real AWS Data
        metrics = fetch_real_aws_data()
        if not metrics:
            return jsonify({"error": "Failed to fetch AWS data"}), 500

        # 2. Run ML Prediction
        result, error = run_prediction(metrics)
        if error:
            return jsonify({"error": error}), 400

        # 3. Return Response
        return jsonify({
            "metrics": metrics,
            "prediction": result,
            "timestamp": datetime.now().isoformat(),
            "data_source": "100% Real AWS (Lambda + DynamoDB + CloudWatch)"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    """Manual Input සඳහා (විකල්ප)"""
    try:
        data = request.get_json()
        result, error = run_prediction(data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)