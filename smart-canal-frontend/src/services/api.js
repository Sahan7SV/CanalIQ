import { iotNodes, seasonData } from '../data/mockData'

export const fetchAllNodes = () => Promise.resolve(iotNodes)

export const fetchNodeById = (id) => {
  const node = iotNodes.find(n => n.id === id)
  return Promise.resolve(node)
}

export const fetchSeasonData = () => Promise.resolve(seasonData)

export const runMLPrediction = (nodeId) => {
  // Simulate Random Forest prediction for existing canal features
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

// ---------- REAL ML API CALL TO FASTAPI ----------
export const predictInfrastructureHealth = async (inputData) => {
  // 1. Point to port 8000 (FastAPI's default port)
  const response = await fetch('http://127.0.0.1:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    // 2. FastAPI returns errors in a "detail" array/string, unlike Express which usually uses "error"
    throw new Error(error.detail || 'Prediction failed. Is the Python server running?')
  }
  
  // 3. Returns the clean JSON: { "status": "success", "network_health": "Excellent" }
  return response.json()
}