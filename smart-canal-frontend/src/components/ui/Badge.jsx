import { useTranslation } from 'react-i18next'

const statusColors = {
  'Good': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Moderate': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Poor': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Healthy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Warning': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Unknown': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

const Badge = ({ status }) => {
  const { t } = useTranslation()
  
  // Normalize status for display
  const displayStatus = status || 'Unknown'
  const colorClass = statusColors[displayStatus] || statusColors.Unknown
  
  // Translate status - map to translation keys
  let translateKey = displayStatus.toLowerCase()
  // Map specific statuses to translation keys
  if (translateKey === 'healthy') translateKey = 'healthy'
  if (translateKey === 'warning') translateKey = 'warning'
  if (translateKey === 'critical') translateKey = 'critical'
  
  const translatedStatus = t(`status.${translateKey}`, displayStatus)
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {translatedStatus}
    </span>
  )
}

export default Badge