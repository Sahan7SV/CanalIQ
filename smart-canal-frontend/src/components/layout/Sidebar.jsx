import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiHome, FiMap, FiBarChart2, FiFileText, FiShield } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../../assets/images'

const Sidebar = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const navItems = [
    { to: '/', icon: FiHome, label: t('navigation.dashboard') },
    { to: '/map', icon: FiMap, label: t('navigation.canalMap') },
    { to: '/season-analysis', icon: FiBarChart2, label: t('navigation.seasonAnalysis') },
    { to: '/report', icon: FiFileText, label: t('navigation.reports') },
  ]

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 flex flex-col h-full sticky top-0 z-20"
    >
      <div className="p-5 flex items-center gap-3">
        <img src={IMAGES.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
        <span className="font-bold text-2xl text-healthy">{t('appName')}</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-healthy/20 text-healthy shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
              }`
            }
          >
            <Icon className="text-lg" />
            {label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-info/20 text-info shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
              }`
            }
          >
            <FiShield className="text-lg" />
            {t('navigation.mlPredictions')}
          </NavLink>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
        © 2026 CanalIQ
      </div>
    </motion.aside>
  )
}

export default Sidebar