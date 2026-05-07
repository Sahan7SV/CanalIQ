import { iotNodes, seasonData } from '../data/mockData'

export const fetchAllNodes = () => Promise.resolve(iotNodes)

export const fetchNodeById = (id) => {
  const node = iotNodes.find(n => n.id === id)
  return Promise.resolve(node)
}

export const fetchSeasonData = () => Promise.resolve(seasonData)

export const runMLPrediction = (nodeId) => {
  // Simulate Random Forest prediction for canal nodes
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        predictedCHI: (Math.random() * 0.3 + 0.7).toFixed(2),
        predictedCWQI: (Math.random() * 0.3 + 0.7).toFixed(2),
        recommendedAction: 'Open sluice gate for 30 minutes',
      })
    }, 1500)
  })
}

// ==========================================
// REAL ML API CALL 1: SERVER INFRASTRUCTURE
// ==========================================
export const predictInfrastructureHealth = async (inputData) => {
  // ⚠️ CRITICAL: Pointing to Port 5000 for the Flask Server
  const response = await fetch('http://127.0.0.1:5000/predict_infra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Server Infra Prediction failed. Check backend.')
  }
  return response.json()
}

// ==========================================
// REAL ML API CALL 2: LORA MULTI-HOP
// ==========================================
export const predictLoraHealth = async (inputData) => {
  // ⚠️ CRITICAL: Pointing to Port 8000 for the FastAPI Server
  const response = await fetch('http://127.0.0.1:8000/predict_lora', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'LoRa Prediction failed. Check backend.')
  }
  return response.json()
}