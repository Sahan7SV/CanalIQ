import { useState } from 'react'
import Card from '../components/ui/Card'
import { predictInfrastructureHealth, predictLoraHealth } from '../services/api'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'
import {
  FiServer, FiCpu, FiHardDrive, FiActivity, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiAlertOctagon, FiZap, FiRadio,
  FiThumbsUp, FiXCircle, FiTarget, FiLayers, FiPlay
} from 'react-icons/fi'

// ==========================================
// STATUS CLASS CONFIGURATIONS
// ==========================================
const CLASS_MAP_INFRA = {
  Healthy:           { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', icon: FiCheckCircle },
  Slightly_Degraded: { color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',  icon: FiAlertTriangle },
  Moderate_Load:     { color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200',  icon: FiTrendingUp },
  High_Stress:       { color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200',           icon: FiAlertOctagon },
  Critical_Failure:  { color: 'text-red-700',     bg: 'bg-red-100 dark:bg-red-900/40 border-red-300',          icon: FiZap },
}

const CLASS_MAP_LORA = {
  Excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', icon: FiCheckCircle },
  Good:      { color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200',          icon: FiThumbsUp },
  Moderate:  { color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',    icon: FiActivity },
  Bad:       { color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200',    icon: FiAlertTriangle },
  Unusable:  { color: 'text-red-700',     bg: 'bg-red-100 dark:bg-red-900/40 border-red-300',            icon: FiXCircle },
}

// ==========================================
// FEATURE FIELDS
// ==========================================
const INFRA_FEATURES = [
  { key: 'cpu_usage',           icon: FiCpu,       placeholder: '0 - 100' },
  { key: 'memory_usage',        icon: FiLayers,    placeholder: '0 - 100' },
  { key: 'disk_usage',          icon: FiHardDrive, placeholder: '0 - 100' },
  { key: 'load_average',        icon: FiActivity,  placeholder: '0.1 - 10' },
  { key: 'query_response_time', icon: FiTarget,    placeholder: '0 - 1000' },
  { key: 'active_connections',  icon: FiServer,    placeholder: '0 - 500' },
  { key: 'error_count',         icon: FiAlertTriangle, placeholder: '0 - 50' },
  { key: 'latency',             icon: FiRadio,     placeholder: '0 - 500' },
]

const LORA_FEATURES = [
  { key: 'RSSI_A', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_A',  icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_A', icon: FiAlertTriangle, placeholder: '0 to 100' },
  { key: 'RSSI_B', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_B',  icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_B', icon: FiAlertTriangle, placeholder: '0 to 100' },
  { key: 'RSSI_C', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_C',  icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_C', icon: FiAlertTriangle, placeholder: '0 to 100' },
  { key: 'RSSI_D', icon: FiRadio, placeholder: '-40 to -130' },
  { key: 'SNR_D',  icon: FiActivity, placeholder: '-20 to 10' },
  { key: 'Loss_D', icon: FiAlertTriangle, placeholder: '0 to 100' },
]

// ==========================================
// MAIN COMPONENT (TERMINOLOGY + VISUALS)
// ==========================================
const AdminDashboard = () => {
  const { t } = useTranslation()
  
  const [activeTab, setActiveTab] = useState('infra') 

  const [infraForm, setInfraForm] = useState(Object.fromEntries(INFRA_FEATURES.map(f => [f.key, ''])))
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
      const currentFeatures = activeTab === 'infra' ? INFRA_FEATURES : LORA_FEATURES
      const currentForm = activeTab === 'infra' ? infraForm : loraForm

      for (const f of currentFeatures) {
        if (currentForm[f.key] === '' || isNaN(parseFloat(currentForm[f.key]))) {
          throw new Error(t('admin.invalidInput', 'Please enter valid numbers for all fields'))
        }
        payload[f.key] = parseFloat(currentForm[f.key])
      }

      let response;
      if (activeTab === 'infra') {
        response = await predictInfrastructureHealth(payload)
      } else {
        response = await predictLoraHealth(payload)
      }
      
      setResult(response)
    } catch (err) {
      setError(err.message || 'Prediction failed. Check backend connection.')
    }
    setLoading(false)
  }

  const currentClassMap = activeTab === 'infra' ? CLASS_MAP_INFRA : CLASS_MAP_LORA
  const currentFeatures = activeTab === 'infra' ? INFRA_FEATURES : LORA_FEATURES

  const getLabelTranslation = (status, type) => {
    if (activeTab === 'infra') return t(`admin.infraClasses.${status}.${type}`)
    return t(`admin.loraClasses.${status}.${type}`)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* HERO SECTION */}
      <div
        className="relative rounded-3xl overflow-hidden min-h-[190px] bg-cover bg-center shadow-lg shadow-indigo-500/10 border border-white/20"
        style={{ backgroundImage: `url(${IMAGES?.mlBg || ''})`, backgroundColor: '#1e1043' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-purple-900/60 to-transparent backdrop-blur-sm" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="relative z-10 p-8 md:p-10 flex flex-col justify-center h-full text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium mb-4 w-fit">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t('admin.heroActive', 'AI Prediction Engine Active')}
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              {activeTab === 'infra' ? <FiServer size={28} /> : <FiRadio size={28} />}
            </span>
            {t('admin.title', 'System Infrastructure Health Prediction')}
          </h2>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex p-1.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-inner border border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={() => handleTabSwitch('infra')}
          className={`flex-1 py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
            activeTab === 'infra' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg transform scale-[1.01] ring-1 ring-indigo-200 dark:ring-indigo-800' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <FiServer size={20} /> 
          <span>{t('admin.tabs.infra', 'System Infrastructure Health ML')}</span>
        </button>
        <button
          onClick={() => handleTabSwitch('lora')}
          className={`flex-1 py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
            activeTab === 'lora' 
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-lg transform scale-[1.01] ring-1 ring-purple-200 dark:ring-purple-800' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <FiRadio size={20} /> 
          <span>{t('admin.tabs.lora', 'LoRa Multi-Hop ML')}</span>
        </button>
      </div>

      {/* HEALTH REFERENCE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <FiTarget className="text-indigo-500" size={22} />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {activeTab === 'infra' 
              ? t('admin.referenceTitleInfra', 'System Health Categories') 
              : t('admin.referenceTitleLora', 'LoRa Link Quality Reference')}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(currentClassMap).map(([status, info]) => {
            const Icon = info.icon
            return (
              <div 
                key={status} 
                className={`group relative p-4 rounded-2xl border ${info.bg} hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden`}
              >
                {/* decorative corner */}
                <div className={`absolute top-0 right-0 w-10 h-10 rounded-bl-2xl ${info.color.replace('text','bg')} opacity-10 group-hover:scale-110 transition-transform`} />
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-md bg-white/80 dark:bg-gray-800/80 ${info.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`font-bold text-sm ${info.color}`}>
                    {getLabelTranslation(status, 'label')}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {getLabelTranslation(status, 'meaning')}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* INPUT FORM */}
      <Card className="border-none shadow-xl shadow-gray-200/40 dark:shadow-none bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeTab === 'infra' ? 'from-indigo-400 to-cyan-400' : 'from-purple-400 to-pink-400'}`} />
        
        <div className="flex items-center gap-4 mb-8 mt-2">
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
            <FiLayers size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'infra' 
                ? t('admin.systemMetricsInfra', 'System Infrastructure Metrics') 
                : t('admin.systemMetricsLora', 'LoRa Signal Metrics')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('admin.systemMetricsDesc', 'Enter current readings to diagnose system health')}
            </p>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeTab === 'lora' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
          {currentFeatures.map(({ key, icon: Icon, placeholder }) => {
            const labelStr = activeTab === 'infra' 
              ? t(`admin.infraFeatures.${key}`) 
              : t(`admin.loraFeatures.${key.toLowerCase()}`)
            
            return (
              <div key={key} className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  <Icon size={14} className="opacity-70" /> {labelStr}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={activeTab === 'infra' ? infraForm[key] : loraForm[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-3 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handlePredict}
            disabled={loading}
            className={`group relative overflow-hidden px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5
              ${activeTab === 'infra' 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20'
              }
            `}
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl" />
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.analyzing', 'Analyzing...')}
                </>
              ) : (
                <>
                  <FiPlay size={18} />
                  {t('admin.predictBtn', 'Run Diagnosis')}
                </>
              )}
            </span>
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">{t('admin.diagnosticError', 'Diagnostic Error')}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* RESULTS DISPLAY */}
        {result && (result.network_health || result.status) && (
          <div className="mt-6 animate-slideIn">
            <div className={`relative p-6 rounded-2xl border-2 ${
              currentClassMap[result.network_health || result.status]?.bg
            } ${currentClassMap[result.network_health || result.status]?.color.replace('text','border')} border-opacity-30 backdrop-blur-sm`}>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm ${
                    currentClassMap[result.network_health || result.status]?.color
                  }`}>
                    {(() => {
                      const ResultIcon = currentClassMap[result.network_health || result.status]?.icon
                      return <ResultIcon size={28} />
                    })()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                      {t('admin.diagnosticResult', 'Diagnosis')}
                    </p>
                    <h4 className={`text-2xl md:text-3xl font-black ${
                      currentClassMap[result.network_health || result.status]?.color
                    }`}>
                      {getLabelTranslation(result.network_health || result.status, 'label')}
                    </h4>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md px-5 py-3 rounded-xl shadow-sm border border-white/40 dark:border-gray-700/50 max-w-sm w-full">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {t('admin.systemAction', 'What this means')}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                    {getLabelTranslation(result.network_health || result.status, 'meaning')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard