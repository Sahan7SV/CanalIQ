import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// ============================================================
// NODE COORDINATES
// ============================================================
const NODE_COORDS = {
  'Sensor01': { lat: 7.1395, lng: 80.0408, label: 'Sensor Node 01', type: 'sensor' },
  'Sensor02': { lat: 7.1368, lng: 80.0415, label: 'Sensor Node 02', type: 'sensor' },
  'TransportA': { lat: 7.1396, lng: 80.0412, label: 'Transport Node A', type: 'transport' },
  'TransportB': { lat: 7.1383, lng: 80.0413, label: 'Transport Node B', type: 'transport' },
  'TransportC': { lat: 7.1370, lng: 80.0419, label: 'Transport Node C', type: 'transport' },
  'BaseStation': { lat: 7.1364, lng: 80.0428, label: 'Base Station', type: 'base' }
}

// ============================================================
// DATA FLOW PATHS (for animation)
// ============================================================
const DATA_FLOW_PATHS = [
  {
    id: 'path1',
    name: 'Sensor01 → A → B → C → Base',
    color: '#22c55e',
    dashColor: '#4ade80',
    nodes: ['Sensor01', 'TransportA', 'TransportB', 'TransportC', 'BaseStation'],
    active: true
  },
  {
    id: 'path2',
    name: 'Sensor02 → C → Base',
    color: '#3b82f6',
    dashColor: '#60a5fa',
    nodes: ['Sensor02', 'TransportC', 'BaseStation'],
    active: true
  }
]

// ============================================================
// WebSocket URL
// ============================================================
const WS_URL = 'wss://zerg0hkzgi.execute-api.eu-north-1.amazonaws.com/production/'

// ============================================================
// Helper to safely get values
// ============================================================
const getVal = (obj, key) => {
  if (!obj) return 'N/A'
  if (obj[key] !== undefined && obj[key] !== null) {
    const val = obj[key]
    if (val === '' || (typeof val === 'number' && isNaN(val))) return 'N/A'
    return String(val)
  }
  return 'N/A'
}

// ============================================================
// Animated Data Flow Component
// ============================================================
const AnimatedDataFlow = ({ map, paths }) => {
  const animationRef = useRef(null)
  const pathLayersRef = useRef({})
  const dashOffsetRef = useRef(0)

  useEffect(() => {
    if (!map) return

    const createAnimatedPath = (pathConfig) => {
      const coords = pathConfig.nodes
        .map(nodeId => NODE_COORDS[nodeId])
        .filter(node => node)
        .map(node => [node.lat, node.lng])

      if (coords.length < 2) return null

      const mainLine = L.polyline(coords, {
        color: pathConfig.color,
        weight: 2,
        opacity: 0.15,
        dashArray: '4, 4',
        className: 'data-flow-bg'
      }).addTo(map)

      const dashLine = L.polyline(coords, {
        color: pathConfig.dashColor || pathConfig.color,
        weight: 4,
        opacity: 0.8,
        dashArray: '12, 20',
        lineCap: 'round',
        className: 'data-flow-animated'
      }).addTo(map)

      const dots = []
      const numDots = 4
      for (let i = 0; i < numDots; i++) {
        const dot = L.circleMarker(coords[0], {
          radius: 4,
          color: pathConfig.color,
          fillColor: pathConfig.color,
          fillOpacity: 1,
          weight: 0,
          className: 'data-dot'
        }).addTo(map)
        dots.push({
          marker: dot,
          progress: i / numDots,
          speed: 0.002 + (Math.random() * 0.001)
        })
      }

      return {
        mainLine,
        dashLine,
        dots,
        coords,
        color: pathConfig.color,
        pathId: pathConfig.id
      }
    }

    const layers = {}
    paths.forEach(path => {
      if (path.active) {
        const result = createAnimatedPath(path)
        if (result) {
          layers[path.id] = result
        }
      }
    })

    pathLayersRef.current = layers

    const animate = () => {
      dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 20

      Object.values(layers).forEach(layer => {
        if (layer.dashLine) {
          layer.dashLine.setStyle({
            dashOffset: -dashOffsetRef.current
          })
        }

        layer.dots.forEach(dot => {
          dot.progress = (dot.progress + dot.speed) % 1
          const pos = getPositionOnPath(layer.coords, dot.progress)
          if (pos) {
            dot.marker.setLatLng(pos)
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    const getPositionOnPath = (coords, progress) => {
      if (coords.length < 2) return null

      let totalLength = 0
      const segments = []
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = L.latLng(coords[i])
        const p2 = L.latLng(coords[i + 1])
        const dist = p1.distanceTo(p2)
        segments.push(dist)
        totalLength += dist
      }

      if (totalLength === 0) return coords[0]

      let targetDist = progress * totalLength
      let cumulativeDist = 0
      for (let i = 0; i < segments.length; i++) {
        if (targetDist <= cumulativeDist + segments[i]) {
          const ratio = (targetDist - cumulativeDist) / segments[i]
          const p1 = L.latLng(coords[i])
          const p2 = L.latLng(coords[i + 1])
          return L.latLng(
            p1.lat + (p2.lat - p1.lat) * ratio,
            p1.lng + (p2.lng - p1.lng) * ratio
          )
        }
        cumulativeDist += segments[i]
      }
      return coords[coords.length - 1]
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      Object.values(pathLayersRef.current).forEach(layer => {
        if (layer.mainLine) map.removeLayer(layer.mainLine)
        if (layer.dashLine) map.removeLayer(layer.dashLine)
        layer.dots.forEach(dot => map.removeLayer(dot.marker))
      })
      pathLayersRef.current = {}
    }
  }, [map, paths])

  return null
}

// ============================================================
// Popup builders (unchanged)
// ============================================================
const buildSensorPopup = (nodeId, data) => {
  const node = NODE_COORDS[nodeId]
  if (!node) return '<div class="popup-content"><p style="color:#94a3b8;text-align:center;padding:20px 0;">Node not found</p></div>'

  const sensor = data?.sensor_data || {}

  const chi = getVal(sensor, 'chi')
  const cwqi = getVal(sensor, 'cwqi')
  const flow = getVal(sensor, 'flow_rate')
  const ph = getVal(sensor, 'ph')
  const tds = getVal(sensor, 'tds')
  const temperature = getVal(sensor, 'temperature')
  const turbidity = getVal(sensor, 'turbidity')

  let statusColor = '#10B981'
  if (nodeId !== 'Sensor02') {
    const chiNum = parseFloat(chi)
    if (!isNaN(chiNum)) {
      if (chiNum < 40) statusColor = '#EF4444'
      else if (chiNum < 60) statusColor = '#F59E0B'
    }
  }

  return `
    <div class="enhanced-popup" style="min-width:220px;max-width:280px;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.2);font-family:'Segoe UI',system-ui,sans-serif;">
      <div style="background:linear-gradient(135deg, ${statusColor}CC, ${statusColor}66);padding:12px 16px 10px 16px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">🟢</span>
          <span style="font-size:15px;font-weight:700;color:#ffffff;">${node.label}</span>
        </div>
        <span style="background:rgba(255,255,255,0.25);padding:2px 10px;border-radius:12px;font-size:9px;font-weight:500;color:#ffffff;">${nodeId}</span>
      </div>

      <div style="padding:12px 16px 14px 16px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;background:#f8fafc;padding:6px 12px;border-radius:8px;margin-bottom:10px;">
          <span style="color:#64748b;">⏱️ Updated</span>
          <span style="font-weight:600;color:#0f172a;">${data?.timestamp ? new Date(parseInt(data.timestamp)).toLocaleTimeString() : 'N/A'}</span>
        </div>

        <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">📊 Canal Health</div>
        <div style="font-size:13px;padding-left:4px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">CHI</span>
            <span style="font-weight:700;color:#0f172a;">${chi}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span style="color:#64748b;">CWQI</span>
            <span style="font-weight:700;color:#0f172a;">${cwqi}</span>
          </div>
        </div>

        <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">💧 Sensor Data</div>
        <div style="font-size:13px;padding-left:4px;">
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Flow</span>
            <span style="font-weight:600;color:#0f172a;">${flow} L/m</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Turbidity</span>
            <span style="font-weight:600;color:#0f172a;">${turbidity} NTU</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">pH</span>
            <span style="font-weight:600;color:#0f172a;">${ph}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">TDS</span>
            <span style="font-weight:600;color:#0f172a;">${tds} ppm</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span style="color:#64748b;">Temperature</span>
            <span style="font-weight:600;color:#0f172a;">${temperature} °C</span>
          </div>
        </div>

        ${data?.route ? `<div style="color:#94a3b8;font-size:9px;margin-top:10px;text-align:right;border-top:1px solid #f1f5f9;padding-top:6px;">Route: ${data.route}</div>` : ''}
      </div>
    </div>
  `
}

const buildTransportPopup = (nodeId, data) => {
  const node = NODE_COORDS[nodeId]
  if (!node) return '<div class="popup-content"><p style="color:#94a3b8;text-align:center;padding:20px 0;">Node not found</p></div>'

  const hop = data?.hop_details || {}
  const network = data?.network_health || {}

  const rssi = getVal(hop, 'rssi')
  const snr = getVal(hop, 'snr')
  const mcdaScore = getVal(hop, 'mcda_score')
  const qScore = getVal(network, 'global_q_score')

  let statusColor = '#3B82F6'
  const scoreNum = parseFloat(mcdaScore)
  if (!isNaN(scoreNum)) {
    if (scoreNum < 40) statusColor = '#EF4444'
    else if (scoreNum < 60) statusColor = '#F59E0B'
  }

  return `
    <div class="enhanced-popup" style="min-width:200px;max-width:260px;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.2);font-family:'Segoe UI',system-ui,sans-serif;">
      <div style="background:linear-gradient(135deg, ${statusColor}CC, ${statusColor}66);padding:12px 16px 10px 16px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">🔵</span>
          <span style="font-size:15px;font-weight:700;color:#ffffff;">${node.label}</span>
        </div>
        <span style="background:rgba(255,255,255,0.25);padding:2px 10px;border-radius:12px;font-size:9px;font-weight:500;color:#ffffff;">${nodeId}</span>
      </div>

      <div style="padding:12px 16px 14px 16px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;background:#f8fafc;padding:6px 12px;border-radius:8px;margin-bottom:10px;">
          <span style="color:#64748b;">⏱️ Updated</span>
          <span style="font-weight:600;color:#0f172a;">${data?.timestamp ? new Date(parseInt(data.timestamp)).toLocaleTimeString() : 'N/A'}</span>
        </div>

        <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">📡 Hop Details</div>
        <div style="font-size:13px;padding-left:4px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">RSSI</span>
            <span style="font-weight:700;color:#0f172a;">${rssi} dBm</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">SNR</span>
            <span style="font-weight:700;color:#0f172a;">${snr} dB</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span style="color:#64748b;">MCDA Score</span>
            <span style="font-weight:700;color:#0f172a;">${mcdaScore}%</span>
          </div>
        </div>

        ${qScore !== 'N/A' ? `
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">🌐 Global Q-Score</div>
          <div style="font-size:13px;padding-left:4px;">
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span style="color:#64748b;">Q-Score</span>
              <span style="font-weight:700;color:#0f172a;">${qScore}%</span>
            </div>
          </div>
        ` : ''}

        ${data?.route ? `<div style="color:#94a3b8;font-size:9px;margin-top:10px;text-align:right;border-top:1px solid #f1f5f9;padding-top:6px;">Route: ${data.route}</div>` : ''}
      </div>
    </div>
  `
}

// ============================================================
// Enhanced Marker Icon Builder
// ============================================================
const createEnhancedMarker = (type, nodeId, isConnected) => {
  const color = type === 'sensor' ? '#22c55e' : type === 'transport' ? '#3b82f6' : '#ef4444'
  const label = type === 'sensor' ? 'S' : type === 'transport' ? 'T' : 'B'

  const liveIndicator = isConnected ? `
    <div style="
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.15);
      backdrop-filter: blur(4px);
      padding: 2px 10px;
      border-radius: 20px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 9px;
      font-weight: 600;
      color: #10B981;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
    ">
      <span style="
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10B981;
        animation: pulse-dot 1.2s ease-in-out infinite;
      "></span>
      LIVE
    </div>
  ` : `
    <div style="
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(148, 163, 184, 0.15);
      backdrop-filter: blur(4px);
      padding: 2px 10px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      font-size: 9px;
      font-weight: 500;
      color: #94A3B8;
      white-space: nowrap;
    ">
      <span style="
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #94A3B8;
      "></span>
      OFFLINE
    </div>
  `

  return L.divIcon({
    className: 'enhanced-marker',
    html: `
      <style>
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      </style>
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 0 20px ${color}60, 0 4px 12px rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: white;
        ">
          ${label}
        </div>
        ${liveIndicator}
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 30],
    popupAnchor: [0, -34]
  })
}

// ============================================================
// Acronyms Banner – NEW DESIGN (below map)
// ============================================================
const AcronymsBanner = () => {
  const acronyms = [
    { label: 'CHI', full: 'Canal Health Index', color: 'from-emerald-400 to-teal-400' },
    { label: 'CWQI', full: 'Canal Water Quality Index', color: 'from-cyan-400 to-blue-400' },
    { label: 'RSSI', full: 'Received Signal Strength Indicator', color: 'from-orange-400 to-amber-400' },
    { label: 'SNR', full: 'Signal to Noise Ratio', color: 'from-rose-400 to-pink-400' },
    { label: 'MCDA', full: 'Multi Criteria Decision Analysis', color: 'from-violet-400 to-purple-400' }
  ]

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>Key Acronyms</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {acronyms.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 + index * 0.06 }}
            whileHover={{
              y: -3,
              scale: 1.02,
              transition: { type: 'spring', stiffness: 400, damping: 20 }
            }}
            className="group relative bg-white dark:bg-slate-800/80 rounded-2xl p-3.5 shadow-sm hover:shadow-lg border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="flex flex-col items-center text-center pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  {item.label}
                </span>
              </div>
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-full px-1">
                {item.full}
              </span>
              <div className="mt-1.5 w-6 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 transition-colors duration-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================
// Main Map Component
// ============================================================
const MapView = () => {
  const { t } = useTranslation()
  const [nodesData, setNodesData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const mapRef = useRef(null)

  const connectWebSocket = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return
    try {
      const socket = new WebSocket(WS_URL)
      socketRef.current = socket
      socket.onopen = () => {
        setIsConnected(true)
        setError(null)
        console.log('✅ WebSocket Connected (Real-time)')
      }
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📩 Raw WebSocket Data Received:', data)
          if (Array.isArray(data)) {
            data.forEach(node => {
              if (node.nodeId) {
                setNodesData(prev => ({ ...prev, [node.nodeId]: node }))
              }
            })
          } else if (data.nodeId) {
            setNodesData(prev => ({ ...prev, [data.nodeId]: data }))
          }
          setLastUpdated(new Date())
          setLoading(false)
        } catch (e) {
          console.error('Parse error:', e)
        }
      }
      socket.onerror = (err) => {
        console.error('WebSocket Error:', err)
        setError('Connection error. Retrying...')
      }
      socket.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket Disconnected')
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to connect')
    }
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (socketRef.current) socketRef.current.close()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  const createMarker = (nodeId, node) => {
    return createEnhancedMarker(node.type, nodeId, isConnected)
  }

  const getPopupContent = (nodeId, data) => {
    const node = NODE_COORDS[nodeId]
    if (!node) return '<div class="popup-content"><p style="color:#94a3b8;text-align:center;padding:20px 0;">Node not found</p></div>'
    if (node.type === 'sensor') {
      return buildSensorPopup(nodeId, data)
    } else if (node.type === 'transport') {
      return buildTransportPopup(nodeId, data)
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 transition-colors duration-300">

      {/* HERO BANNER */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-3xl overflow-hidden mb-6"
      >
        <div className="absolute inset-0 z-0">
          <img src={IMAGES?.mapBg || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200'} alt="Canal Map" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2">
                <span className="text-xl">🗺️</span>
                <span>{t('map.realTime')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t('map.title')}
              </h1>
              <p className="mt-2 text-white/80 max-w-lg text-sm leading-relaxed">
                {t('map.interactiveMap')} · {isConnected ? '🟢 ' + t('map.live') : '🔴 ' + t('map.offline')}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className="text-sm font-medium text-white/90">
                {isConnected ? t('map.connected') : t('map.disconnected')}
              </span>
              {lastUpdated && (
                <span className="text-xs text-white/60 border-l border-white/20 pl-3">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAP */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative rounded-3xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-slate-800/30"
      >
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-xl shadow-lg text-sm backdrop-blur-sm">
            ⚠️ {error}
          </div>
        )}

        <MapContainer
          center={[7.1380, 80.0415]}
          zoom={17}
          className="h-[65vh] min-h-[500px] w-full"
          zoomControl={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Data Flow Animation */}
          <AnimatedDataFlow map={mapRef.current} paths={DATA_FLOW_PATHS} />

          {/* Nodes */}
          {Object.keys(NODE_COORDS).map((nodeId) => {
            const node = NODE_COORDS[nodeId]
            const data = nodesData[nodeId]
            const marker = createMarker(nodeId, node)
            const popupContent = getPopupContent(nodeId, data)
            const hasPopup = node.type !== 'base'

            return (
              <Marker
                key={nodeId}
                position={[node.lat, node.lng]}
                icon={marker}
              >
                {hasPopup && (
                  <Popup className="enhanced-popup-wrapper">
                    <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                  </Popup>
                )}
              </Marker>
            )
          })}
        </MapContainer>

        {/* DATA FLOW LEGEND */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">📍 Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>
              <span className="text-slate-600 dark:text-slate-300">{t('map.sensorNode')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30"></span>
              <span className="text-slate-600 dark:text-slate-300">{t('map.transportNode')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></span>
              <span className="text-slate-600 dark:text-slate-300">Base Station</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-emerald-400 border-t-2 border-dashed animate-pulse"></span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Data Flow (Sensor01 → Base)</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-6 h-0.5 bg-blue-400 border-t-2 border-dashed animate-pulse"></span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Data Flow (Sensor02 → Base)</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {isConnected ? t('map.live') : t('map.offline')}
                </span>
              </div>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STATUS OVERLAY */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {isConnected ? t('map.connected') : t('map.disconnected')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ===== ACRONYMS BANNER – NOW BELOW THE MAP ===== */}
      <AcronymsBanner />

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>© 2026 CanalIQ</span>
          <span className="hidden sm:inline">•</span>
          <span>{t('map.interactiveMap')}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('map.poweredBy')}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-400 dark:text-slate-500">
            {lastUpdated ? `${t('map.lastUpdated')}: ${lastUpdated.toLocaleString()}` : t('map.waitingForData')}
          </span>
        </p>
      </motion.div>
    </div>
  )
}

export default MapView