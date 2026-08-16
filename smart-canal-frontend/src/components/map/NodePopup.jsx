import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FiActivity,
  FiDroplet,
  FiWind,
  FiThermometer,
  FiWifi,
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi'

const statusConfig = {
  Healthy: { color: '#10B981', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', icon: FiCheckCircle },
  Warning: { color: '#F59E0B', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', icon: FiAlertTriangle },
  Critical: { color: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', icon: FiAlertCircle },
}

const NodePopup = ({ node }) => {
  const { t } = useTranslation()
  const statusInfo = statusConfig[node.status] || statusConfig.Healthy

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-72 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
    >
      {/* Header with status color */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: statusInfo.color + '20' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
          <h3 className="font-bold text-sm text-gray-800 dark:text-white">
            Node {node.id}
          </h3>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: statusInfo.color, backgroundColor: statusInfo.color + '30' }}
        >
          {t(`status.${node.status.toLowerCase()}`, node.status)}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* CHI Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FiActivity className="text-healthy" size={14} />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('node.chi')}</h4>
            </div>
            <span className="text-sm font-bold text-healthy">{node.chi?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xxs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FiWifi size={10} />
              <span>{t('node.turbidity')}: {node.chiComponents?.turbidity || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiWind size={10} />
              <span>{t('node.waterFlow')}: {node.chiComponents?.waterFlow || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiActivity size={10} />
              <span>{t('node.ultrasonic')}: {node.chiComponents?.ultrasonic || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* CWQI Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FiDroplet className="text-info" size={14} />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('node.cwqi')}</h4>
            </div>
            <span className="text-sm font-bold text-info">{node.cwqi?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xxs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FiDroplet size={10} />
              <span>{t('node.ph')}: {node.cwqiComponents?.ph || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiThermometer size={10} />
              <span>{t('node.temperature')}: {node.cwqiComponents?.temperature || 'N/A'}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <FiWifi size={10} />
              <span>{t('node.tds')}: {node.cwqiComponents?.tds || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default NodePopup