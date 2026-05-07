import { useState } from 'react'
import Card from '../components/ui/Card'
import { predictInfrastructureHealth } from '../services/api'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'
import {
  FiServer, FiCpu, FiHardDrive, FiActivity, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiAlertOctagon, FiZap
} from 'react-icons/fi'

const CLASS_MAP = {
  Healthy:           { color: 'text-healthy', bg: 'bg-green-50 dark:bg-green-900/20', icon: FiCheckCircle,  meaning: 'System normal / No issues' },
  Slightly_Degraded: { color: 'text-warning', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: FiAlertTriangle, meaning: 'Small performance drop' },
  Moderate_Load:     { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: FiTrendingUp, meaning: 'System under load' },
  High_Stress:       { color: 'text-critical', bg: 'bg-red-50 dark:bg-red-900/20', icon: FiAlertOctagon, meaning: 'High risk condition' },
  Critical_Failure:  { color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/40', icon: FiZap,        meaning: 'System near crash' },
}

const ADMIN_CONFIG = {
  features: [
    { key: 'cpu_usage',           label: 'CPU Usage (%)',      icon: FiCpu,      placeholder: '0-100' },
    { key: 'memory_usage',        label: 'Memory Usage (%)',    icon: FiCpu,      placeholder: '0-100' },
    { key: 'disk_usage',          label: 'Disk Usage (%)',      icon: FiHardDrive, placeholder: '0-100' },
    { key: 'load_average',        label: 'Load Average',        icon: FiActivity, placeholder: '0.1-10' },
    { key: 'query_response_time', label: 'Query Response (ms)', icon: FiServer,   placeholder: '0-1000' },
    { key: 'active_connections',  label: 'Active Connections',  icon: FiServer,   placeholder: '0-500' },
    { key: 'error_count',         label: 'Error Count',         icon: FiServer,   placeholder: '0-50' },
    { key: 'latency',             label: 'Latency (ms)',        icon: FiServer,   placeholder: '0-500' },
  ]
}

const AdminDashboard = () => {
  const { t } = useTranslation()
  const [form, setForm] = useState(
    Object.fromEntries(ADMIN_CONFIG.features.map(f => [f.key, '']))
  )
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {}
      for (const f of ADMIN_CONFIG.features) {
        if (form[f.key] === '' || isNaN(parseFloat(form[f.key]))) {
          throw new Error(`Please enter a valid number for ${f.label}`)
        }
        payload[f.key] = parseFloat(form[f.key])
      }
      const response = await predictInfrastructureHealth(payload)
      setResult(response)
    } catch (err) {
      setError(err.message || 'Prediction failed')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${IMAGES.mlBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 to-transparent" />
        <h2 className="relative z-10 p-8 text-3xl font-bold text-white">
          {t('admin.title', 'Infrastructure Health Prediction')}
        </h2>
      </div>

      {/* Threshold Reference Card */}
      <Card>
        <h3 className="text-xl font-bold mb-4">System Health Status Reference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(CLASS_MAP).map(([status, info]) => {
            const Icon = info.icon
            return (
              <div key={status} className={`p-3 rounded-xl ${info.bg} border border-gray-100 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={info.color} size={18} />
                  <span className={`font-semibold text-sm ${info.color}`}>{status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{info.meaning}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Input form */}
      <Card>
        <h3 className="text-xl font-bold mb-4">Current System Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ADMIN_CONFIG.features.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Icon className="inline mr-1" size={14} /> {label}
              </label>
              <input
                type="number"
                step="any"
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm focus:ring-2 focus:ring-healthy placeholder-gray-400"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all"
        >
          {loading ? 'Analyzing...' : 'Predict System Infrastructure Health'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-critical p-3 rounded-xl">{error}</div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-lg mb-2">
              Predicted Status:{' '}
              <span className={CLASS_MAP[result.status]?.color || 'text-healthy'}>
                {result.status.replace('_', ' ')}
              </span>
            </h4>
            {CLASS_MAP[result.status] && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {CLASS_MAP[result.status].meaning}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard