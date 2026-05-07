import { useTranslation } from 'react-i18next'

const statusColors = {
  Healthy: 'bg-healthy/20 text-healthy',
  Warning: 'bg-warning/20 text-warning',
  Critical: 'bg-critical/20 text-critical',
}

const Badge = ({ status }) => {
  const { t } = useTranslation()
  const translatedStatus = t(`status.${status.toLowerCase()}`, status) // fallback to original
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || ''}`}>
      {translatedStatus}
    </span>
  )
}

export default Badge