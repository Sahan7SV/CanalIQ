import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  FiSun, FiMoon, FiBell, FiGlobe,
  FiUser, FiLogOut, FiChevronDown, FiCheck
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../../assets/images'
import { motion, AnimatePresence } from 'framer-motion'

const Topbar = () => {
  const { dark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()

  const [lang, setLang] = useState(i18n.language || 'en')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Mock notifications (unread count based on array length)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Node E warning: High turbidity detected', time: '5 min ago', read: false },
    { id: 2, text: 'Node J critical failure', time: '12 min ago', read: false },
    { id: 3, text: 'Season report ready for download', time: '1 hour ago', read: false },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const userMenuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    i18n.changeLanguage(lang)
  }, [lang, i18n])

  const toggleLanguage = () => setLang((prev) => (prev === 'en' ? 'si' : 'en'))

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      {/* Left: brand title (unchanged) */}
      <div className="flex items-center gap-3">
        <img
          src={IMAGES.logo}
          alt="CanalIQ"
          className="w-7 h-7 rounded-full object-cover shadow-sm"
        />
        <h1 className="text-lg font-bold bg-gradient-to-r from-healthy to-info bg-clip-text text-transparent hidden sm:block">
          {t('topbar.systemName')}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language button (unchanged) */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
                     bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-transparent
                     hover:border-healthy/30"
          title="Switch language"
        >
          <FiGlobe size={16} />
          <span className="min-w-[24px] text-center">
            {lang === 'en' ? 'EN' : 'SI'}
          </span>
        </button>

        {/* Dark mode toggle (unchanged) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* ---------- Notifications (redesigned) ---------- */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-critical text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-healthy hover:underline flex items-center gap-1"
                    >
                      <FiCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">No notifications</p>
                  ) : (
                    notifications.map(item => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          !item.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex gap-2">
                          {!item.read && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-healthy shrink-0" />
                          )}
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{item.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar + menu (unchanged) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <img
              src={IMAGES.avatar}
              alt="User"
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Guest'}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role || 'guest'}</p>
            </div>
            <FiChevronDown size={14} className="hidden md:block text-gray-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role || 'guest'}</p>
                </div>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-critical hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FiLogOut size={14} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Topbar