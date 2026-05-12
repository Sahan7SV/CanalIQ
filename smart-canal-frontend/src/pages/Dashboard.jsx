import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FiCheckCircle, FiAlertTriangle, FiAlertOctagon,
  FiFileText, FiArrowRight, FiDroplet, FiActivity
} from 'react-icons/fi'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { fetchAllNodes } from '../services/api'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { IMAGES } from '../assets/images'

// Colour-coded circle markers for mini map
const createStatusIcon = (status) => {
  const color = status === 'Healthy' ? '#10B981' : status === 'Warning' ? '#F59E0B' : '#EF4444'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const COLORS = { Healthy: '#10B981', Warning: '#F59E0B', Critical: '#EF4444' }

const Dashboard = () => {
  const [nodes, setNodes] = useState([])
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    fetchAllNodes().then(setNodes)
  }, [])

  const stats = {
    healthy: nodes.filter(n => n.status === 'Healthy').length,
    warning: nodes.filter(n => n.status === 'Warning').length,
    critical: nodes.filter(n => n.status === 'Critical').length,
    total: nodes.length,
  }

  const pieData = [
    { name: t('status.healthy'), value: stats.healthy, color: COLORS.Healthy },
    { name: t('status.warning'), value: stats.warning, color: COLORS.Warning },
    { name: t('status.critical'), value: stats.critical, color: COLORS.Critical },
  ].filter(d => d.value > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-8"
    >
      {/* --- ENHANCED HERO with integrated quick stats --- */}
      <div
        className="relative rounded-[2.5rem] overflow-hidden bg-cover bg-center shadow-xl shadow-green-900/10 border border-white/20"
        style={{ backgroundImage: `url(${IMAGES.dashboardHero})` }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/85 via-green-900/60 to-transparent backdrop-blur-sm" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
          {/* Left: title + definitions */}
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              {t('dashboard.title')}
            </h1>
            <p className="mt-2 text-white/80 text-sm md:text-base">
              {t('tagline')}
            </p>

            {/* CHI / CWQI meaning pills */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-sm font-medium border border-white/20 shadow-sm">
                <FiDroplet className="text-blue-200" size={16} />
                <span className="font-bold">CHI</span>
                <span className="text-white/90 hidden sm:inline">
                  - {t('dashboard.chiMeaning', 'Canal Health Index')}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-sm font-medium border border-white/20 shadow-sm">
                <FiActivity className="text-green-200" size={16} />
                <span className="font-bold">CWQI</span>
                <span className="text-white/90 hidden sm:inline">
                  - {t('dashboard.cwqiMeaning', 'Canal Water Quality Index')}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- STAT CARDS (slightly refined) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('dashboard.healthyNodes'), count: stats.healthy, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', Icon: FiCheckCircle, border: 'border-l-emerald-500' },
          { label: t('dashboard.warningNodes'), count: stats.warning, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', Icon: FiAlertTriangle, border: 'border-l-amber-500' },
          { label: t('dashboard.criticalNodes'), count: stats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', Icon: FiAlertOctagon, border: 'border-l-red-500' },
        ].map((item, idx) => (
          <motion.div key={idx} whileHover={{ y: -4 }}>
            <Card className={`border-l-4 ${item.border} bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.bg} ${item.color} shadow-sm`}>
                  <item.Icon size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* --- PIE + MINI MAP (unchanged) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md">
          <h3 className="text-xl font-bold mb-4">Node Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">{t('report.noData')}</p>
          )}
        </Card>

        <Card className="overflow-hidden p-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold">{t('map.title')}</h3>
            <button onClick={() => navigate('/map')} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium hover:underline">
              View full map <FiArrowRight />
            </button>
          </div>
          <div className="h-72 w-full">
            <MapContainer center={[7.1365, 80.0415]} zoom={15} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {nodes.map(node => (
                <Marker key={node.id} position={[node.lat, node.lng]} icon={createStatusIcon(node.status)} />
              ))}
            </MapContainer>
          </div>
        </Card>
      </div>

      {/* --- ALL NODES TABLE (glass rows) --- */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">All IoT Nodes</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{stats.total} nodes</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-3 pr-4 text-left pl-4">Node</th>
                <th className="py-3 px-2 text-left">Latitude</th>
                <th className="py-3 px-2 text-left">Longitude</th>
                <th className="py-3 px-2 text-left">Status</th>
                <th className="py-3 px-2 text-left">CHI</th>
                <th className="py-3 px-2 text-left">CWQI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {nodes.map((node) => (
                <motion.tr
                  key={node.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * node.id.charCodeAt(0) }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 pl-4 font-medium text-gray-900 dark:text-white">Node {node.id}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{node.lat}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{node.lng}</td>
                  <td className="py-3 px-2"><Badge status={node.status} /></td>
                  <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">{node.chi}</td>
                  <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">{node.cwqi}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- REPORT BUTTON (same style, just minor spacing) --- */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
        >
          <FiFileText />
          {t('report.title')}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Dashboard