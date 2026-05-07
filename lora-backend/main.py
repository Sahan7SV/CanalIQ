from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

# 1. Initialize the FastAPI application
app = FastAPI(title="LoRa Network ML API", description="Predicts multi-hop network health")

# --- NEW: Enable CORS so React can communicate with FastAPI ---
app.add_middleware(
    CORSMiddleware,
    # Allow local React development servers (Vite uses 5173, Create React App uses 3000)
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the trained Machine Learning model
try:
    model = joblib.load("lora_network_classifier.joblib")
    print("✅ ML Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 3. Define the strict data structure
class LoRaPayload(BaseModel):
    RSSI_A: float
    SNR_A: float
    Loss_A: float
    RSSI_B: float
    SNR_B: float
    Loss_B: float
    RSSI_C: float
    SNR_C: float
    Loss_C: float
    RSSI_D: float
    SNR_D: float
    Loss_D: float

# 4. Create the API Endpoint
@app.post("/predict")
def predict_network_status(data: LoRaPayload):
    try:
        input_dict = data.dict()
        input_df = pd.DataFrame([input_dict])
        prediction = model.predict(input_df)
        
        return {
            "status": "success",
            "network_health": prediction[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "LoRa Backend API is running!"}