import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiCheckCircle, FiAlertTriangle, FiAlertOctagon, FiFileText, FiArrowRight } from 'react-icons/fi'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { fetchAllNodes } from '../services/api'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { IMAGES } from '../assets/images'

// Create custom colour-coded circle markers for the mini map
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
      className="space-y-8"
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${IMAGES.dashboardHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-transparent" />
        <div className="relative z-10 p-8 flex flex-col justify-center h-full text-white">
          <h2 className="text-3xl font-bold">{t('dashboard.title')}</h2>
          <p className="mt-2 opacity-80">{t('tagline')}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('dashboard.healthyNodes'), count: stats.healthy, color: 'text-healthy', bg: 'bg-healthy/20', Icon: FiCheckCircle, border: 'border-l-healthy' },
          { label: t('dashboard.warningNodes'), count: stats.warning, color: 'text-warning', bg: 'bg-warning/20 fly', Icon: FiAlertTriangle, border: 'border-l-warning' },
          { label: t('dashboard.criticalNodes'), count: stats.critical, color: 'text-critical', bg: 'bg-critical/20', Icon: FiAlertOctagon, border: 'border-l-critical' },
        ].map((item, idx) => (
          <motion.div key={idx} whileHover={{ y: -4 }}>
            <Card className={`border-l-4 ${item.border} bg-white/80 dark:bg-gray-800/80`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${item.bg} ${item.color}`}><item.Icon size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pie chart + Mini map row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie chart */}
        <Card>
          <h3 className="text-xl font-bold mb-4">Node Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
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

        {/* Mini map with colour-coded nodes and click-to-navigate */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold">{t('map.title')}</h3>
            <button onClick={() => navigate('/map')} className="text-sm text-info flex items-center gap-1 hover:underline">
              View full map <FiArrowRight />
            </button>
          </div>
          <div className="h-72 w-full">
            <MapContainer 
              center={[7.1365, 80.0415]} 
              zoom={15} 
              className="h-full w-full" 
              zoomControl={false} 
              dragging={false} 
              scrollWheelZoom={false} 
              doubleClickZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {nodes.map(node => (
                <Marker 
                  key={node.id} 
                  position={[node.lat, node.lng]} 
                  icon={createStatusIcon(node.status)} 
                />
              ))}
            </MapContainer>
          </div>
        </Card>
      </div>

      {/* All node details table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">All IoT Nodes</h3>
          <span className="text-sm text-gray-500">{nodes.length} nodes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-4">Node</th>
                <th className="py-2 px-2">Latitude</th>
                <th className="py-2 px-2">Longitude</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">CHI</th>
                <th className="py-2 px-2">CWQI</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(node => (
                <motion.tr
                  key={node.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * node.id.charCodeAt(0) }}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-3 pr-4 font-medium">Node {node.id}</td>
                  <td className="py-3 px-2">{node.lat}</td>
                  <td className="py-3 px-2">{node.lng}</td>
                  <td className="py-3 px-2"><Badge status={node.status} /></td>
                  <td className="py-3 px-2">{node.chi}</td>
                  <td className="py-3 px-2">{node.cwqi}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report generation CTA */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-info to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <FiFileText />
          {t('report.title')}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Dashboard