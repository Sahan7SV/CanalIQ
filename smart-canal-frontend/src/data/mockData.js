export const iotNodes = [
  { id: 'A', name: 'Node A', lat: 7.1395, lng: 80.0408, status: 'Healthy',
    chi: 0.89, cwqi: 0.92,
    chiComponents: { turbidity: 3.2, waterFlow: 1.4, ultrasonic: 4.5 },
    cwqiComponents: { ph: 7.1, temperature: 26.5, tds: 120 }
  },
  { id: 'B', lat: 7.1388, lng: 80.0413, status: 'Healthy',
    chi: 0.85, cwqi: 0.88,
    chiComponents: { turbidity: 4.1, waterFlow: 1.6, ultrasonic: 4.2 },
    cwqiComponents: { ph: 7.3, temperature: 27.0, tds: 135 }
  },
  { id: 'C', lat: 7.1380, lng: 80.0413, status: 'Healthy',
    chi: 0.90, cwqi: 0.91,
    chiComponents: { turbidity: 2.9, waterFlow: 1.5, ultrasonic: 4.6 },
    cwqiComponents: { ph: 7.0, temperature: 26.8, tds: 115 }
  },
  { id: 'D', lat: 7.1377, lng: 80.0420, status: 'Healthy',
    chi: 0.87, cwqi: 0.89,
    chiComponents: { turbidity: 3.5, waterFlow: 1.7, ultrasonic: 4.3 },
    cwqiComponents: { ph: 7.2, temperature: 26.9, tds: 125 }
  },
  { id: 'E', lat: 7.1371, lng: 80.0421, status: 'Warning',
    chi: 0.65, cwqi: 0.70,
    chiComponents: { turbidity: 15.2, waterFlow: 0.9, ultrasonic: 3.1 },
    cwqiComponents: { ph: 6.5, temperature: 28.5, tds: 210 }
  },
  { id: 'F', lat: 7.1363, lng: 80.0422, status: 'Healthy',
    chi: 0.91, cwqi: 0.93,
    chiComponents: { turbidity: 2.5, waterFlow: 1.6, ultrasonic: 4.8 },
    cwqiComponents: { ph: 7.1, temperature: 27.1, tds: 110 }
  },
  { id: 'G', lat: 7.1357, lng: 80.0422, status: 'Healthy',
    chi: 0.88, cwqi: 0.86,
    chiComponents: { turbidity: 3.8, waterFlow: 1.4, ultrasonic: 4.4 },
    cwqiComponents: { ph: 7.0, temperature: 27.3, tds: 118 }
  },
  { id: 'H', lat: 7.1352, lng: 80.0412, status: 'Healthy',
    chi: 0.92, cwqi: 0.94,
    chiComponents: { turbidity: 2.8, waterFlow: 1.5, ultrasonic: 4.7 },
    cwqiComponents: { ph: 7.2, temperature: 26.7, tds: 108 }
  },
  { id: 'I', lat: 7.1345, lng: 80.0411, status: 'Warning',
    chi: 0.62, cwqi: 0.68,
    chiComponents: { turbidity: 18.1, waterFlow: 0.8, ultrasonic: 2.9 },
    cwqiComponents: { ph: 6.3, temperature: 28.8, tds: 230 }
  },
  { id: 'J', lat: 7.1335, lng: 80.0407, status: 'Critical',
    chi: 0.45, cwqi: 0.52,
    chiComponents: { turbidity: 25.6, waterFlow: 0.5, ultrasonic: 1.9 },
    cwqiComponents: { ph: 5.9, temperature: 29.5, tds: 280 }
  },
]

// ------------------ SEASONAL DATA (ENRICHED) ------------------
export const seasonData = [
  // 2023
  { month: 'Jan', season: 'Maha', chi: 0.90, cwqi: 0.92, waterFlow: 1.7, rainfall: 120, year: 2023 },
  { month: 'Feb', season: 'Maha', chi: 0.88, cwqi: 0.90, waterFlow: 1.6, rainfall: 95,  year: 2023 },
  { month: 'Mar', season: 'Maha', chi: 0.87, cwqi: 0.89, waterFlow: 1.4, rainfall: 80,  year: 2023 },
  { month: 'May', season: 'Yala', chi: 0.83, cwqi: 0.85, waterFlow: 1.1, rainfall: 55,  year: 2023 },
  { month: 'Jun', season: 'Yala', chi: 0.81, cwqi: 0.83, waterFlow: 1.0, rainfall: 45,  year: 2023 },
  { month: 'Jul', season: 'Yala', chi: 0.78, cwqi: 0.79, waterFlow: 0.8, rainfall: 40,  year: 2023 },
  { month: 'Aug', season: 'Yala', chi: 0.76, cwqi: 0.77, waterFlow: 0.7, rainfall: 35,  year: 2023 },
  { month: 'Sep', season: 'Maha', chi: 0.86, cwqi: 0.88, waterFlow: 1.3, rainfall: 100, year: 2023 },
  { month: 'Oct', season: 'Maha', chi: 0.89, cwqi: 0.91, waterFlow: 1.8, rainfall: 140, year: 2023 },
  { month: 'Nov', season: 'Maha', chi: 0.91, cwqi: 0.93, waterFlow: 2.0, rainfall: 180, year: 2023 },
  { month: 'Dec', season: 'Maha', chi: 0.92, cwqi: 0.94, waterFlow: 2.1, rainfall: 190, year: 2023 },

  // 2024
  { month: 'Jan', season: 'Maha', chi: 0.91, cwqi: 0.93, waterFlow: 1.8, rainfall: 130, year: 2024 },
  { month: 'Feb', season: 'Maha', chi: 0.89, cwqi: 0.91, waterFlow: 1.7, rainfall: 100, year: 2024 },
  { month: 'Mar', season: 'Maha', chi: 0.88, cwqi: 0.90, waterFlow: 1.5, rainfall: 85,  year: 2024 },
  { month: 'May', season: 'Yala', chi: 0.84, cwqi: 0.86, waterFlow: 1.2, rainfall: 60,  year: 2024 },
  { month: 'Jun', season: 'Yala', chi: 0.82, cwqi: 0.84, waterFlow: 1.1, rainfall: 50,  year: 2024 },
  { month: 'Jul', season: 'Yala', chi: 0.79, cwqi: 0.80, waterFlow: 0.9, rainfall: 45,  year: 2024 },
  { month: 'Aug', season: 'Yala', chi: 0.77, cwqi: 0.78, waterFlow: 0.8, rainfall: 40,  year: 2024 },
  { month: 'Sep', season: 'Maha', chi: 0.87, cwqi: 0.89, waterFlow: 1.4, rainfall: 110, year: 2024 },
  { month: 'Oct', season: 'Maha', chi: 0.90, cwqi: 0.92, waterFlow: 1.9, rainfall: 150, year: 2024 },
  { month: 'Nov', season: 'Maha', chi: 0.92, cwqi: 0.94, waterFlow: 2.1, rainfall: 185, year: 2024 },
  { month: 'Dec', season: 'Maha', chi: 0.93, cwqi: 0.95, waterFlow: 2.2, rainfall: 195, year: 2024 },
]

// Computed averages for radar chart (normalised)
export const seasonAverages = [
  { category: 'CHI',             Yala: 0.80, Maha: 0.90, yalaNorm: 0.80, mahaNorm: 0.90 },
  { category: 'CWQI',            Yala: 0.81, Maha: 0.92, yalaNorm: 0.81, mahaNorm: 0.92 },
  { category: 'Water Flow (m³/s)', Yala: 0.95, Maha: 1.75, yalaNorm: 0.95/2.2, mahaNorm: 1.75/2.2 },
  { category: 'Rainfall (mm)',   Yala: 47,   Maha: 135,  yalaNorm: 47/200,  mahaNorm: 135/200 },
]

// ---------- API SIMULATIONS (keep as is) ----------
export const fetchAllNodes = () => Promise.resolve(iotNodes)

export const fetchNodeById = (id) => {
  const node = iotNodes.find(n => n.id === id)
  return Promise.resolve(node)
}

export const fetchSeasonData = () => Promise.resolve(seasonData)

export const runMLPrediction = (nodeId) => {
  // Simulate Random Forest prediction
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