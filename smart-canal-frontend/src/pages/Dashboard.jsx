import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FiActivity, FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiServer, FiCpu, FiDatabase, FiClock, FiWifi, FiHardDrive, FiZap,
  FiPieChart, FiInfo, FiDroplet, FiThermometer, FiBarChart2, FiAnchor
} from 'react-icons/fi'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar
} from 'recharts'
import { motion } from 'framer-motion'
import { IMAGES } from '../assets/images'

const NODE_COORDS = {
  'Sensor01': { label: 'Sensor Node 01', type: 'sensor' },
  'Sensor02': { label: 'Sensor Node 02', type: 'sensor' },
  'TransportA': { label: 'Transport Node A', type: 'transport' },
  'TransportB': { label: 'Transport Node B', type: 'transport' },
  'TransportC': { label: 'Transport Node C', type: 'transport' }
}

const WS_URL = 'wss://zerg0hkzgi.execute-api.eu-north-1.amazonaws.com/production/'

const getVal = (obj, key) => {
  if (!obj) return 'N/A'
  if (obj[key] !== undefined && obj[key] !== null) {
    const val = obj[key]
    if (val === '' || (typeof val === 'number' && isNaN(val))) return 'N/A'
    return typeof val === 'number' ? val : String(val)
  }
  return 'N/A'
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (isNaN(ts)) return 'N/A'
  return new Date(ts).toLocaleTimeString()
}

const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [nodeData, setNodeData] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [lastUpdated, setLastUpdated] = useState(null)
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  const processNodeData = useCallback((rawData) => {
    try {
      const dataArray = Array.isArray(rawData) ? rawData : [rawData]
      const newData = {}
      dataArray.forEach(item => {
        if (item.nodeId) {
          newData[item.nodeId] = item
        }
      })
      setNodeData(prev => ({ ...prev, ...newData }))
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Data processing error:', error)
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return
    setConnectionStatus('Connecting...')
    setIsConnected(false)
    try {
      const socket = new WebSocket(WS_URL)
      socketRef.current = socket
      socket.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('Connected')
        console.log('✅ Dashboard WebSocket Connected')
      }
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          processNodeData(data)
        } catch (e) {
          console.error('Parse error:', e)
        }
      }
      socket.onerror = (error) => {
        console.error('WebSocket Error:', error)
        setConnectionStatus('Error')
        setIsConnected(false)
      }
      socket.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('Reconnecting...')
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current)
        }
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000)
      }
    } catch (error) {
      console.error('Connection error:', error)
      setConnectionStatus('Failed')
      setIsConnected(false)
    }
  }, [processNodeData])

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [connectWebSocket])

  const sensorNodes = ['Sensor01', 'Sensor02']
  const transportNodes = ['TransportA', 'TransportB', 'TransportC']

  const sensorData = sensorNodes.map(nodeId => {
    const data = nodeData[nodeId] || {}
    const sensor = data.sensor_data || {}
    return {
      nodeId,
      label: NODE_COORDS[nodeId]?.label || nodeId,
      chi: getVal(sensor, 'chi'),
      cwqi: getVal(sensor, 'cwqi'),
      flow_rate: getVal(sensor, 'flow_rate'),
      ph: getVal(sensor, 'ph'),
      temperature: getVal(sensor, 'temperature'),
      tds: getVal(sensor, 'tds'),
      turbidity: getVal(sensor, 'turbidity'),
      lastUpdate: formatTime(data.timestamp)
    }
  })

  const transportData = transportNodes.map(nodeId => {
    const data = nodeData[nodeId] || {}
    const hop = data.hop_details || {}
    return {
      nodeId,
      label: NODE_COORDS[nodeId]?.label || nodeId,
      rssi: getVal(hop, 'rssi'),
      snr: getVal(hop, 'snr'),
      mcda_score: getVal(hop, 'mcda_score'),
      lastUpdate: formatTime(data.timestamp)
    }
  })

  const sensorChartData = sensorNodes.map(nodeId => {
    const data = nodeData[nodeId] || {}
    const sensor = data.sensor_data || {}
    return {
      name: NODE_COORDS[nodeId]?.label || nodeId,
      CHI: parseFloat(getVal(sensor, 'chi')) || 0,
      CWQI: parseFloat(getVal(sensor, 'cwqi')) || 0,
      Temperature: parseFloat(getVal(sensor, 'temperature')) || 0,
      pH: parseFloat(getVal(sensor, 'ph')) || 0
    }
  })

  const totalNodes = Object.keys(NODE_COORDS).length
  const totalSensorNodes = sensorNodes.length
  const totalTransportNodes = transportNodes.length

  const pieData = [
    { name: t('dashboard.sensorNodes'), value: totalSensorNodes, fill: '#10B981' },
    { name: t('dashboard.transportNodes'), value: totalTransportNodes, fill: '#3B82F6' }
  ]

  const avgMCDA = transportData.reduce((sum, d) => sum + (parseFloat(d.mcda_score) || 0), 0) / transportData.length || 0

  const getMetricColor = (value, thresholdHigh = 70, thresholdMedium = 40) => {
    const num = parseFloat(value)
    if (isNaN(num)) return 'text-slate-400 dark:text-slate-500'
    if (num > thresholdHigh) return 'text-emerald-600 dark:text-emerald-400'
    if (num > thresholdMedium) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getBadgeBg = (value, thresholdHigh = 70, thresholdMedium = 40) => {
    const num = parseFloat(value)
    if (isNaN(num)) return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
    if (num > thresholdHigh) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    if (num > thresholdMedium) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      
      {/* ===== HERO BANNER ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-3xl overflow-hidden mb-8"
      >
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.dashboardHero || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200'} alt="Dashboard" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2">
                <FiActivity className="text-emerald-400" />
                <span>{t('dashboard.liveData')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t('dashboard.title')}
              </h1>
              <p className="mt-2 text-white/80 max-w-lg text-sm leading-relaxed">
                {t('dashboard.liveData')} · {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <FiRefreshCw className={`text-emerald-300 ${!isConnected ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-white/90">
                {isConnected ? t('dashboard.liveData') : t('dashboard.offline')}
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

      {/* QUICK STATS CARDS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
              <FiWifi className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.status')}</p>
              <p className={`text-lg font-bold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isConnected ? t('dashboard.online') : t('dashboard.offline')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <FiHardDrive className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.totalNodes')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{totalNodes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <FiServer className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.sensorNodes')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{totalSensorNodes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <FiDatabase className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.transportNodes')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{totalTransportNodes}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <FiPieChart className="text-purple-500 dark:text-purple-400" size={14} />
            {t('dashboard.nodeDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', color: 'var(--tooltip-text, #333)' }} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ fontSize: 11, paddingTop: 5 }}
                formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 
              {t('dashboard.sensorNodes')} ({totalSensorNodes})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 
              {t('dashboard.transportNodes')} ({totalTransportNodes})
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500 dark:text-emerald-400" size={14} />
            {t('dashboard.sensorHealth')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sensorChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity="0.3" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', color: 'var(--tooltip-text, #333)' }} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
              <Bar dataKey="CHI" fill="#10B981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="CWQI" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <FiTrendingDown className="text-blue-500 dark:text-blue-400" size={14} />
            {t('dashboard.networkHealth')}
          </h3>
          
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                cx="50%"
                cy="45%"
                innerRadius="55%"
                outerRadius="90%"
                data={[{ name: 'Q-Score', value: Math.round(avgMCDA) }]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  fill={avgMCDA > 70 ? '#10B981' : avgMCDA > 40 ? '#F59E0B' : '#EF4444'}
                  background={{ fill: '#f1f5f9' }}
                />
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xl font-bold fill-slate-800 dark:fill-white"
                >
                  {Math.round(avgMCDA)}%
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500"
                >
                  {t('dashboard.avgMCDA')}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-1">
            {transportData.map(node => (
              <div key={node.nodeId} className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-1.5 text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-500">{node.nodeId}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {node.mcda_score !== 'N/A' ? `${node.mcda_score}%` : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* 1. CANAL HEALTH METRICS - Now centered with flex */}
      {/* ============================================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/10 dark:to-teal-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <FiActivity className="text-lg" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Canal Health Metrics
            </h3>
            <span className="ml-auto text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1 rounded-full border border-slate-200 dark:border-gray-600">
              CHI · CWQI
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Using flex to center the two boxes */}
          <div className="flex flex-wrap justify-center gap-5">
            {sensorData.length === 0 ? (
              <div className="w-full text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                {isConnected ? '⏳ ' + t('dashboard.waitingForData') : '🔴 ' + t('dashboard.noConnection')}
              </div>
            ) : (
              sensorData.map((node) => {
                const chiNum = parseFloat(node.chi)
                const cwqiNum = parseFloat(node.cwqi)
                return (
                  <div
                    key={node.nodeId}
                    className="group relative bg-slate-50 dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 w-full sm:w-72 md:w-80 lg:w-80"
                  >
                    {/* Node label and timestamp - centered */}
                    <div className="flex flex-col items-center mb-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {node.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {node.lastUpdate}
                      </span>
                    </div>

                    {/* Large CHI and CWQI values side by side */}
                    <div className="flex items-center justify-around gap-6">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          CHI
                        </p>
                        <p className={`text-4xl font-bold ${getMetricColor(node.chi)}`}>
                          {node.chi}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          CWQI
                        </p>
                        <p className={`text-4xl font-bold ${getMetricColor(node.cwqi)}`}>
                          {node.cwqi}
                        </p>
                      </div>
                    </div>

                    {/* Thin progress bars */}
                    <div className="mt-4 space-y-1.5">
                      {!isNaN(chiNum) && (
                        <div className="w-full h-1 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(chiNum, 100)}%`,
                              background: chiNum > 70 ? '#10B981' : chiNum > 40 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                      )}
                      {!isNaN(cwqiNum) && (
                        <div className="w-full h-1 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(cwqiNum, 100)}%`,
                              background: cwqiNum > 70 ? '#10B981' : cwqiNum > 40 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* 2. SENSOR DETAILS */}
      {/* ============================================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden mt-8"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-900/10 dark:to-cyan-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FiServer className="text-lg" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {t('dashboard.sensorDetails')}
              </h3>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1 rounded-full border border-slate-200 dark:border-gray-600">
                {sensorData.length} Nodes
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <FiClock size={12} />
              {t('dashboard.liveData')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
              <tr className="text-left text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">{t('node.nodeId')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.ph')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.tds')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.flowRate')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.temperature')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.turbidity')}</th>
                <th className="py-3.5 px-3 font-semibold text-right">{t('dashboard.updated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/50">
              {sensorData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {isConnected ? '⏳ ' + t('dashboard.waitingForData') : '🔴 ' + t('dashboard.noConnection')}
                  </td>
                </tr>
              ) : (
                sensorData.map((node, index) => (
                  <motion.tr
                    key={node.nodeId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-gray-700/30 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                        {node.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{node.ph}</td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{node.tds}</td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{node.flow_rate}</td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{node.temperature}</td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{node.turbidity}</td>
                    <td className="py-3.5 px-3 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {node.lastUpdate}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* 3. TRANSPORT DETAILS */}
      {/* ============================================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden mt-8"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/10 dark:to-purple-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <FiDatabase className="text-lg" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {t('dashboard.transportDetails')}
              </h3>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1 rounded-full border border-slate-200 dark:border-gray-600">
                {transportData.length} Nodes
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <FiClock size={12} />
              {t('dashboard.liveData')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
              <tr className="text-left text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">{t('node.nodeId')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.rssi')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.snr')}</th>
                <th className="py-3.5 px-3 font-semibold">{t('node.mcdaScore')}</th>
                <th className="py-3.5 px-3 font-semibold text-right">{t('dashboard.updated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/50">
              {transportData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {isConnected ? '⏳ ' + t('dashboard.waitingForData') : '🔴 ' + t('dashboard.noConnection')}
                  </td>
                </tr>
              ) : (
                transportData.map((node, index) => (
                  <motion.tr
                    key={node.nodeId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-gray-700/30 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                        {node.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-mono">{node.rssi}</td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-mono">{node.snr}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeBg(node.mcda_score)}`}>
                        {node.mcda_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {node.lastUpdate}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <br></br>

      {/* ============================================================ */}
      {/* 4. KEY ACRONYMS */}
      {/* ============================================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/10 dark:to-pink-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <FiInfo className="text-lg" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Key Acronyms
              </h3>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1 rounded-full border border-slate-200 dark:border-gray-600">
              Glossary
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* CHI */}
            <div className="group bg-slate-50 dark:bg-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <FiBarChart2 size={16} />
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">CHI</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Canal Health Index</p>
            </div>

            {/* CWQI */}
            <div className="group bg-slate-50 dark:bg-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <FiDroplet size={16} />
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">CWQI</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Canal Water Quality Index</p>
            </div>

            {/* RSSI */}
            <div className="group bg-slate-50 dark:bg-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-500 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <FiWifi size={16} />
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">RSSI</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Received Signal Strength</p>
            </div>

            {/* SNR */}
            <div className="group bg-slate-50 dark:bg-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  <FiActivity size={16} />
                </div>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">SNR</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Signal to Noise Ratio</p>
            </div>

            {/* MCDA */}
            <div className="group bg-slate-50 dark:bg-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <FiAnchor size={16} />
                </div>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">MCDA</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Multi‑Criteria Decision Analysis</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-gray-700 pt-6"
      >
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>© 2026 CanalIQ</span>
          <span className="hidden sm:inline">•</span>
          <span>{t('dashboard.title')}</span>
          <span className="hidden sm:inline">•</span>
          <span className={`${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isConnected ? '🟢 ' + t('dashboard.liveData') : '🔴 ' + t('dashboard.offline')}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-400 dark:text-slate-500">
            {lastUpdated ? `${t('dashboard.updated')}: ${lastUpdated.toLocaleString()}` : t('dashboard.waitingForData')}
          </span>
        </p>
      </motion.div>
    </div>
  )
}

export default Dashboard