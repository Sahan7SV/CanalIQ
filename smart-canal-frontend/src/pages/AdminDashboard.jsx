import { useState } from 'react'
import Card from '../components/ui/Card'
import { predictInfrastructureHealth } from '../services/api'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'
import {
  FiServer, FiCpu, FiHardDrive, FiActivity, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiAlertOctagon, FiZap, FiRadio,
  FiThumbsUp, FiXCircle, FiTarget, FiLayers
} from 'react-icons/fi'

// ==========================================
// 1. INFRASTRUCTURE ML CONFIGURATION
// ==========================================
const CLASS_MAP_INFRA = {
  Healthy:           { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', icon: FiCheckCircle,  meaning: 'System normal / No issues' },
  Slightly_Degraded: { color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',  icon: FiAlertTriangle,meaning: 'Small performance drop' },
  Moderate_Load:     { color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200',  icon: FiTrendingUp, meaning: 'System under load' },
  High_Stress:       { color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200',           icon: FiAlertOctagon, meaning: 'High risk condition' },
  Critical_Failure:  { color: 'text-red-700',     bg: 'bg-red-100 dark:bg-red-900/40 border-red-300',          icon: FiZap,          meaning: 'System near crash' },
}

const ADMIN_CONFIG = {
  features: [
    { key: 'cpu_usage',           label: 'CPU Usage (%)',       icon: FiCpu,       placeholder: '0 - 100' },
    { key: 'memory_usage',        label: 'Memory Usage (%)',    icon: FiLayers,    placeholder: '0 - 100' },
    { key: 'disk_usage',          label: 'Disk Usage (%)',      icon: FiHardDrive, placeholder: '0 - 100' },
    { key: 'load_average',        label: 'Load Average',        icon: FiActivity,  placeholder: '0.1 - 10' },
    { key: 'query_response_time', label: 'Query Response (ms)', icon: FiTarget,    placeholder: '0 - 1000' },
    { key: 'active_connections',  label: 'Active Connections',  icon: FiServer,    placeholder: '0 - 500' },
    { key: 'error_count',         label: 'Error Count',         icon: FiAlertTriangle, placeholder: '0 - 50' },
    { key: 'latency',             label: 'Latency (ms)',        icon: FiRadio,     placeholder: '0 - 500' },
  ]
}

// ==========================================
// 2. LORA MULTI-HOP ML CONFIGURATION
// ==========================================
const CLASS_MAP_LORA = {
  Excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', icon: FiCheckCircle,   meaning: 'Perfect transmission' },
  Good:      { color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200',          icon: FiThumbsUp,      meaning: 'Highly reliable' },
  Moderate:  { color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',    icon: FiActivity,      meaning: 'Signal degrading' },
  Bad:       { color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200',    icon: FiAlertTriangle, meaning: 'High packet loss risk' },
  Unusable:  { color: 'text-red-700',     bg: 'bg-red-100 dark:bg-red-900/40 border-red-300',            icon: FiXCircle,       meaning: 'Network failed / Bottlenecked' },
}

const LORA_FEATURES = [
  { key: 'RSSI_A', label: 'Hop A: RSSI (dBm)', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_A',  label: 'Hop A: SNR (dB)',   icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_A', label: 'Hop A: Loss (%)',   icon: FiAlertTriangle, placeholder: '0 to 100' },

  { key: 'RSSI_B', label: 'Hop B: RSSI (dBm)', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_B',  label: 'Hop B: SNR (dB)',   icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_B', label: 'Hop B: Loss (%)',   icon: FiAlertTriangle, placeholder: '0 to 100' },

  { key: 'RSSI_C', label: 'Hop C: RSSI (dBm)', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_C',  label: 'Hop C: SNR (dB)',   icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_C', label: 'Hop C: Loss (%)',   icon: FiAlertTriangle, placeholder: '0 to 100' },

  { key: 'RSSI_D', label: 'Hop D: RSSI (dBm)', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_D',  label: 'Hop D: SNR (dB)',   icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_D', label: 'Hop D: Loss (%)',   icon: FiAlertTriangle, placeholder: '0 to 100' },
]

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminDashboard = () => {
  const { t } = useTranslation()
  
  // Set default tab to 'infra' (Server Infrastructure as 1)
  const [activeTab, setActiveTab] = useState('infra') 

  const [infraForm, setInfraForm] = useState(Object.fromEntries(ADMIN_CONFIG.features.map(f => [f.key, ''])))
  const [loraForm, setLoraForm] = useState(Object.fromEntries(LORA_FEATURES.map(f => [f.key, ''])))
  
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setResult(null)
    setError(null)
  }

  const handleChange = (key, value) => {
    if (activeTab === 'infra') {
      setInfraForm(prev => ({ ...prev, [key]: value }))
    } else {
      setLoraForm(prev => ({ ...prev, [key]: value }))
    }
  }

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const payload = {}
      const currentFeatures = activeTab === 'infra' ? ADMIN_CONFIG.features : LORA_FEATURES
      const currentForm = activeTab === 'infra' ? infraForm : loraForm

      for (const f of currentFeatures) {
        if (currentForm[f.key] === '' || isNaN(parseFloat(currentForm[f.key]))) {
          throw new Error(`Please enter a valid number for ${f.label}`)
        }
        payload[f.key] = parseFloat(currentForm[f.key])
      }

      // Execute AI Prediction
      const response = await predictInfrastructureHealth(payload)
      setResult(response)
      
    } catch (err) {
      setError(err.message || 'Prediction failed. Check backend connection.')
    }
    setLoading(false)
  }

  const currentClassMap = activeTab === 'infra' ? CLASS_MAP_INFRA : CLASS_MAP_LORA

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* --- HERO SECTION --- */}
      <div
        className="relative rounded-[2rem] overflow-hidden min-h-[180px] bg-cover bg-center shadow-2xl shadow-indigo-500/20 border border-white/10"
        style={{ backgroundImage: `url(${IMAGES?.mlBg || ''})`, backgroundColor: '#2e1065' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-transparent backdrop-blur-[2px]" />
        
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-24 right-10 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

        <div className="relative z-10 p-10 h-full flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-100 text-sm font-medium mb-4 w-fit">
            <FiActivity className="animate-pulse" /> AI Prediction Engine Active
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white flex items-center gap-4 tracking-tight">
            {activeTab === 'infra' ? <FiServer className="text-indigo-400 drop-shadow-lg" /> : <FiRadio className="text-purple-400 drop-shadow-lg" />}
            {t('admin.title', 'ML Control Center')}
          </h2>
        </div>
      </div>

      {/* --- PREMIUM TAB SELECTOR --- */}
      <div className="relative p-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-inner border border-gray-200/50 dark:border-gray-700/50 flex flex-col md:flex-row gap-2">
        <button
          onClick={() => handleTabSwitch('infra')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
            activeTab === 'infra' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.01]' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <FiServer size={20} /> 
          <span>1. Server Infrastructure ML</span>
        </button>
        <button
          onClick={() => handleTabSwitch('lora')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
            activeTab === 'lora' 
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md transform scale-[1.01]' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <FiRadio size={20} /> 
          <span>2. LoRa Multi-Hop ML</span>
        </button>
      </div>

      {/* --- STATUS REFERENCE CARDS --- */}
      <Card className="border-none shadow-xl shadow-gray-200/40 dark:shadow-none bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${activeTab === 'infra' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'} dark:bg-gray-700`}>
            <FiTarget size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {activeTab === 'infra' ? 'Server Health Categories' : 'Network Bottleneck Logic'}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(currentClassMap).map(([status, info]) => {
            const Icon = info.icon
            return (
              <div 
                key={status} 
                className={`p-4 rounded-2xl border ${info.bg} hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default group`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-md bg-white/50 dark:bg-gray-800/50 group-hover:scale-110 transition-transform`}>
                    <Icon className={info.color} size={18} />
                  </div>
                  <span className={`font-bold text-sm ${info.color}`}>{status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{info.meaning}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* --- INPUT FORM SECTION --- */}
      <Card className="border-none shadow-2xl shadow-gray-200/50 dark:shadow-none relative overflow-hidden">
        {/* Subtle decorative top border */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeTab === 'infra' ? 'from-indigo-400 to-cyan-400' : 'from-purple-400 to-pink-400'}`} />
        
        <div className="flex items-center gap-3 mb-8 mt-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <FiLayers size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'infra' ? 'Live System Metrics' : 'Simulate Node Payload'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the real-time telemetry data to generate an AI prediction.
            </p>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeTab === 'lora' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
          {(activeTab === 'infra' ? ADMIN_CONFIG.features : LORA_FEATURES).map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors">
                <Icon size={14} className="opacity-70" /> {label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={activeTab === 'infra' ? infraForm[key] : loraForm[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-white dark:focus:bg-gray-800 transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className="mt-10 border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={handlePredict}
            disabled={loading}
            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5
              ${activeTab === 'infra' 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-blue-500' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-pink-500'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Telemetry...
              </span>
            ) : (
              <>
                <FiZap size={20} className={activeTab === 'infra' ? 'text-blue-200' : 'text-pink-200'} />
                Run AI Assessment
              </>
            )}
          </button>
        </div>

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-r-xl animate-pulse">
            <div className="flex items-center gap-2">
              <FiAlertTriangle size={18} />
              <span className="font-semibold">Diagnostic Error:</span> {error}
            </div>
          </div>
        )}

        {/* --- RESULTS DISPLAY --- */}
        {result && (result.network_health || result.status) && (
          <div className="mt-8 relative overflow-hidden rounded-2xl animate-[fadeIn_0.5s_ease-out]">
            <div className={`absolute inset-0 opacity-20 ${currentClassMap[result.network_health || result.status]?.bg}`} />
            
            <div className={`relative p-6 md:p-8 border-2 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 ${currentClassMap[result.network_health || result.status]?.bg}`}>
              
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm ${currentClassMap[result.network_health || result.status]?.color}`}>
                  {(() => {
                    const ResultIcon = currentClassMap[result.network_health || result.status]?.icon
                    return <ResultIcon size={32} />
                  })()}
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    AI Diagnostic Result
                  </p>
                  <h4 className={`text-3xl font-black ${currentClassMap[result.network_health || result.status]?.color}`}>
                    {(result.network_health || result.status).replace('_', ' ')}
                  </h4>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-900/60 px-6 py-4 rounded-xl shadow-sm border border-white/40 dark:border-gray-700/50 max-w-sm w-full">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  <span className="block text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">System Action</span>
                  {currentClassMap[result.network_health || result.status]?.meaning || "Unknown Status"}
                </p>
              </div>

            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard