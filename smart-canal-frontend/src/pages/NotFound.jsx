import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'

const NotFound = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <img src={IMAGES.notFound} alt="Not Found" className="w-64 rounded-2xl shadow-lg" />
      <h2 className="text-4xl font-bold text-gray-400">{t('notFound')}</h2>
    </div>
  )
}

export default NotFound