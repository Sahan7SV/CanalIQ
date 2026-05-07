import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // simulate network delay
    await new Promise((r) => setTimeout(r, 800))
    const result = login(username, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(t('invalidCredentials'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side – background image (unchanged) */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${IMAGES.loginBg})` }}
      >
        <div className="absolute inset-0 bg-healthy/70 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white h-full p-12">
          <img src={IMAGES.logo} className="w-20 h-20 rounded-full mb-6" alt="Logo" />
          <h1 className="text-5xl font-bold mb-2">{t('appName')}</h1>
          <p className="text-xl opacity-90">{t('tagline')}</p>
        </div>
      </div>

      {/* Right side – improved form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-gray-900 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo (visible on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img src={IMAGES.logo} className="w-16 h-16 rounded-full mx-auto mb-2" alt="Logo" />
            <h1 className="text-3xl font-bold text-healthy">{t('appName')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('tagline')}</p>
          </div>

          {/* Form card with subtle glow */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8 sm:p-10 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('login')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('username')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-healthy focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password with visibility toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-healthy focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-critical text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"
                >
                  <FiAlertCircle />
                  {error}
                </motion.div>
              )}

              {/* Sign in button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-healthy to-emerald-600 text-white font-semibold rounded-xl hover:from-healthy/90 hover:to-emerald-500 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
              >
                {loading ? t('signingIn') : t('login')}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
              <p>{t('demoCredentials')}</p>
              <p className="mt-1">
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {t('demoAdmin')}
                </span>
                <span className="mx-2">|</span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {t('demoUser')}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login