import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  FiDownload, FiRefreshCw, FiClock, FiServer, 
  FiActivity, FiTrendingUp, FiTrendingDown,
  FiCalendar, FiFilter, FiSearch, FiChevronDown,
  FiArrowUp, FiArrowDown, FiEye
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
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
  return new Date(ts).toLocaleString()
}

const formatShortTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (isNaN(ts)) return 'N/A'
  return new Date(ts).toLocaleTimeString()
}

const Report = () => {
  const { t } = useTranslation()
  
  const [liveData, setLiveData] = useState({})
  const [historicalData, setHistoricalData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedNode, setSelectedNode] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const historyLimit = 100

  const processNodeData = useCallback((rawData) => {
    try {
      const dataArray = Array.isArray(rawData) ? rawData : [rawData]
      const timestamp = Date.now()
      
      dataArray.forEach(item => {
        if (item.nodeId) {
          setLiveData(prev => ({
            ...prev,
            [item.nodeId]: { ...item, _receivedAt: timestamp }
          }))
          
          const sensor = item.sensor_data || {}
          const hop = item.hop_details || {}
          const network = item.network_health || {}
          
          const record = {
            id: `${item.nodeId}_${timestamp}`,
            nodeId: item.nodeId,
            nodeLabel: NODE_COORDS[item.nodeId]?.label || item.nodeId,
            type: NODE_COORDS[item.nodeId]?.type || 'unknown',
            timestamp: timestamp,
            timestampDisplay: new Date(timestamp).toLocaleString(),
            chi: getVal(sensor, 'chi'),
            cwqi: getVal(sensor, 'cwqi'),
            flow_rate: getVal(sensor, 'flow_rate'),
            ph: getVal(sensor, 'ph'),
            tds: getVal(sensor, 'tds'),
            temperature: getVal(sensor, 'temperature'),
            turbidity: getVal(sensor, 'turbidity'),
            rssi: getVal(hop, 'rssi'),
            snr: getVal(hop, 'snr'),
            mcda_score: getVal(hop, 'mcda_score'),
            q_score: getVal(network, 'global_q_score'),
            latency: getVal(network, 'latency_ms'),
            packet_loss: getVal(network, 'packet_loss_percent'),
            link_margin: getVal(network, 'link_margin_db'),
            route: item.route || 'N/A'
          }
          
          setHistoricalData(prev => {
            const exists = prev.some(r => r.nodeId === item.nodeId && r.timestamp === timestamp)
            if (exists) return prev
            const updated = [record, ...prev]
            return updated.slice(0, historyLimit)
          })
        }
      })
      
      setLastUpdated(new Date())
      setIsConnected(true)
      setError(null)
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
        console.log('✅ Report WebSocket Connected')
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

  useEffect(() => {
    let data = [...historicalData]
    if (selectedNode !== 'all') {
      data = data.filter(d => d.nodeId === selectedNode)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter(d => 
        d.nodeId.toLowerCase().includes(term) ||
        d.nodeLabel.toLowerCase().includes(term) ||
        d.route.toLowerCase().includes(term)
      )
    }
    data.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    setFilteredData(data)
  }, [historicalData, selectedNode, searchTerm, sortField, sortDirection])

  const totalRecords = historicalData.length
  const sensorRecords = historicalData.filter(d => d.type === 'sensor').length
  const transportRecords = historicalData.filter(d => d.type === 'transport').length
  const avgCHI = historicalData
    .filter(d => d.chi !== 'N/A')
    .reduce((sum, d) => sum + parseFloat(d.chi), 0) / 
    historicalData.filter(d => d.chi !== 'N/A').length || 0

  const clearHistory = () => {
    if (window.confirm(t('report.clearHistory') + '?')) {
      setHistoricalData([])
    }
  }

  const handleDownloadPDF = () => {
    setLoading(true)
    setError(null)
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const primary = [16, 185, 129]
      const dark = [30, 41, 59]
      const gray = [107, 114, 128]

      const borderMargin = 6
      doc.setDrawColor(...primary)
      doc.setLineWidth(0.8)
      doc.rect(borderMargin, borderMargin, pageWidth - 2 * borderMargin, pageHeight - 2 * borderMargin, 'S')

      doc.setFillColor(240, 253, 244)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setFillColor(...primary)
      doc.rect(0, 0, pageWidth, 4, 'F')

      doc.setTextColor(...dark)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('CanalIQ', pageWidth / 2, 22, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...primary)
      doc.text(t('report.systemHealthReport'), pageWidth / 2, 28, { align: 'center' })

      doc.setTextColor(...dark)
      doc.setFontSize(12)
      doc.text(t('report.systemHealthReport'), 14, 45)
      doc.setFontSize(9)
      doc.setTextColor(...gray)
      doc.text(`${t('report.generated')}: ${new Date().toLocaleString()}`, 14, 53)
      doc.text(`${t('report.totalRecords')}: ${totalRecords} | ${t('report.connected')}: ${isConnected ? 'Yes' : 'No'}`, 14, 59)

      doc.setFontSize(10)
      doc.setTextColor(...dark)
      doc.text(t('report.statusSummary'), 14, 70)
      doc.setFontSize(8)
      doc.setTextColor(...gray)
      doc.text(`${t('report.sensorRecords')}: ${sensorRecords}`, 14, 77)
      doc.text(`${t('report.transportRecords')}: ${transportRecords}`, 14, 83)
      doc.text(`${t('report.avgCHI')}: ${avgCHI.toFixed(2)}`, 14, 89)

      doc.setFontSize(11)
      doc.setTextColor(...dark)
      doc.text(t('report.historicalData'), 14, 100)

      const displayData = filteredData.slice(0, 50)
      const nodeRows = displayData.map(d => [
        d.nodeId,
        d.type || 'N/A',
        d.chi || 'N/A',
        d.cwqi || 'N/A',
        d.mcda_score || 'N/A',
        d.q_score || 'N/A',
        d.timestampDisplay || 'N/A'
      ])

      autoTable(doc, {
        startY: 105,
        head: [[t('report.node'), t('node.type'), t('node.chi'), t('node.cwqi'), t('node.mcdaScore'), t('node.globalQScore'), t('report.time')]],
        body: nodeRows,
        theme: 'striped',
        headStyles: {
          fillColor: primary,
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 6.5,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 40 }
        },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 10, right: 10 }
      })

      const endY = doc.lastAutoTable.finalY + 15
      doc.setFontSize(9)
      doc.setTextColor(...gray)
      doc.text(t('report.endOfReport'), pageWidth / 2, endY, { align: 'center' })
      doc.text(`${t('report.systemHealthReport')}`, pageWidth / 2, endY + 7, { align: 'center' })

      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(...gray)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      }
      doc.save(`CanalIQ_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error(err)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nodeOptions = ['all', ...Object.keys(NODE_COORDS)]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 transition-colors duration-300">
      
      {/* ===== GREEN HERO BANNER ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-3xl overflow-hidden mb-8"
      >
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.reportBg || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200'} alt="Report" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2">
                <FiActivity className="text-emerald-400" />
                <span>{t('report.title')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t('report.title')}
              </h1>
              <p className="mt-2 text-white/80 max-w-lg text-sm leading-relaxed">
                {t('report.description')} · {isConnected ? '🟢 ' + t('dashboard.liveData') : '🔴 ' + t('dashboard.offline')}
              </p>
            </div>
            
            {/* Top Download Button */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <button
                onClick={handleDownloadPDF}
                disabled={loading || totalRecords === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
              >
                {loading ? <FiRefreshCw className="animate-spin" size={16} /> : <FiDownload size={16} />}
                {loading ? t('report.generating') : t('report.generateBtn')}
              </button>
              {lastUpdated && (
                <span className="text-xs text-white/60 border-l border-white/20 pl-3">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* STATS CARDS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('report.totalRecords')}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalRecords}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('report.sensorRecords')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{sensorRecords}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('report.transportRecords')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transportRecords}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('report.avgCHI')}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{avgCHI.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('report.liveNodes')}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {Object.keys(liveData).length}/{Object.keys(NODE_COORDS).length}
          </p>
        </div>
      </motion.div>

      {/* FILTERS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400 dark:text-slate-500" size={16} />
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">{t('report.filterByNode')}</option>
              {nodeOptions.filter(n => n !== 'all').map(node => (
                <option key={node} value={node}>{NODE_COORDS[node]?.label || node}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <FiSearch className="text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder={t('report.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">{t('report.sortBy')}:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="timestamp">{t('report.time')}</option>
              <option value="chi">{t('node.chi')}</option>
              <option value="cwqi">{t('node.cwqi')}</option>
              <option value="mcda_score">{t('node.mcdaScore')}</option>
              <option value="nodeId">{t('node.nodeId')}</option>
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-slate-50 dark:bg-gray-700 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors"
            >
              {sortDirection === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* DATA TABLE */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FiServer className="text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('report.historicalData')}</h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {filteredData.length} records
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {isConnected ? '⏳ ' + t('dashboard.waitingForData') : t('dashboard.noConnection')}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
                <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold">{t('node.nodeId')}</th>
                  <th className="py-2 px-3 font-semibold">{t('node.type')}</th>
                  <th className="py-2 px-3 font-semibold">{t('node.chi')}</th>
                  <th className="py-2 px-3 font-semibold">{t('node.cwqi')}</th>
                  <th className="py-2 px-3 font-semibold">{t('node.mcdaScore')}</th>
                  <th className="py-2 px-3 font-semibold">{t('node.globalQScore')}</th>
                  <th className="py-2 px-3 font-semibold text-right">{t('report.time')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 100).map((record, index) => {
                  const isSensor = record.type === 'sensor'
                  const chiNum = parseFloat(record.chi)
                  const chiColor = !isNaN(chiNum) ? 
                    (chiNum >= 80 ? 'text-emerald-600 dark:text-emerald-400' : chiNum >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400') : 
                    'text-slate-400 dark:text-slate-500'

                  return (
                    <motion.tr
                      key={record.id || index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className="border-b border-slate-100 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isSensor ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-blue-500 dark:bg-blue-400'}`} />
                        {record.nodeLabel}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSensor ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                          {isSensor ? t('map.sensorNode') : t('map.transportNode')}
                        </span>
                      </td>
                      <td className={`py-2 px-3 font-medium ${chiColor}`}>{record.chi}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{record.cwqi}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{record.mcda_score}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{record.q_score}</td>
                      <td className="py-2 px-3 text-right text-xs text-slate-400 dark:text-slate-500">{record.timestampDisplay}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{t('report.showingRecords')} {Math.min(filteredData.length, 100)} of {filteredData.length}</span>
            <span>{t('dashboard.updated')}: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}</span>
          </div>
        )}
      </motion.div>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-gray-700 pt-4"
      >
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>© 2026 CanalIQ</span>
          <span className="hidden sm:inline">•</span>
          <span>{t('report.title')}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Live + Historical</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-400 dark:text-slate-500">
            {totalRecords} {t('report.recordsStored')}
          </span>
          <span className="hidden sm:inline">•</span>
          <button
            onClick={handleDownloadPDF}
            disabled={loading || totalRecords === 0}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          >
            {loading ? <FiRefreshCw className="animate-spin" size={12} /> : <FiDownload size={12} />}
            {loading ? t('report.generating') : 'PDF'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}

export default Report