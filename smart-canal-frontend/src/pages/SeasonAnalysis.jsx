import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { motion } from 'framer-motion'
import { IMAGES } from '../assets/images'
import { 
  FiSun, FiCloudRain, FiDroplet, FiTrendingUp, FiTrendingDown,
  FiCalendar, FiActivity, FiZap, FiInfo, FiBarChart2, FiPieChart,
  FiMap, FiAward, FiClock, FiRefreshCw
} from 'react-icons/fi'

// ============================================================
// MOCK DATA - Sri Lankan Irrigation Realistic Values (2025 & 2026)
// ============================================================
const generateSeasonData = (year) => {
  const yalaBase = { rainfall: 120, waterFlow: 4.2, reservoirLevel: 45, cropArea: 38000 }
  const mahaBase = { rainfall: 280, waterFlow: 8.5, reservoirLevel: 78, cropArea: 52000 }
  const variation = year === 2025 ? 0.95 : 1.08

  const yala = {
    name: 'Yala',
    season: 'Yala',
    year,
    months: 'May – August',
    rainfall: yalaBase.rainfall * (0.9 + 0.2 * Math.random()) * variation,
    waterFlow: yalaBase.waterFlow * (0.9 + 0.2 * Math.random()) * variation,
    reservoirLevel: yalaBase.reservoirLevel * (0.9 + 0.1 * Math.random()) * variation,
    cropArea: yalaBase.cropArea * (0.95 + 0.1 * Math.random()) * variation,
  }
  const maha = {
    name: 'Maha',
    season: 'Maha',
    year,
    months: 'September – March',
    rainfall: mahaBase.rainfall * (0.9 + 0.2 * Math.random()) * variation,
    waterFlow: mahaBase.waterFlow * (0.9 + 0.2 * Math.random()) * variation,
    reservoirLevel: mahaBase.reservoirLevel * (0.9 + 0.1 * Math.random()) * variation,
    cropArea: mahaBase.cropArea * (0.95 + 0.1 * Math.random()) * variation,
  }
  return [yala, maha]
}

const generateMonthlyData = (year) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const baseRain = [120, 100, 140, 80, 70, 60, 80, 120, 250, 300, 280, 200]
  const baseFlow = [6, 5, 7, 4, 3, 2.5, 3.5, 5, 9, 11, 10, 8]
  const baseRes = [70, 65, 60, 50, 45, 40, 45, 55, 70, 80, 78, 75]
  const factor = year === 2025 ? 1.0 : 1.05
  return months.map((month, i) => ({
    month,
    rainfall: baseRain[i] * factor * (0.9 + 0.2 * Math.random()),
    waterFlow: baseFlow[i] * factor * (0.9 + 0.2 * Math.random()),
    reservoirLevel: baseRes[i] * factor * (0.95 + 0.1 * Math.random()),
  }))
}

const SEASON_INFO = {
  yala: {
    title: 'yala',
    subtitle: 'yalaDesc',
    icon: FiSun,
    color: '#F59E0B',
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'yalaDescription',
    characteristics: [
      'yalaChar1', 'yalaChar2', 'yalaChar3', 'yalaChar4', 'yalaChar5'
    ],
    strategies: [
      'yalaStrat1', 'yalaStrat2', 'yalaStrat3', 'yalaStrat4'
    ]
  },
  maha: {
    title: 'maha',
    subtitle: 'mahaDesc',
    icon: FiCloudRain,
    color: '#3B82F6',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'mahaDescription',
    characteristics: [
      'mahaChar1', 'mahaChar2', 'mahaChar3', 'mahaChar4', 'mahaChar5'
    ],
    strategies: [
      'mahaStrat1', 'mahaStrat2', 'mahaStrat3', 'mahaStrat4'
    ]
  }
}

const SeasonAnalysis = () => {
  const { t } = useTranslation()
  const [selectedYear, setSelectedYear] = useState(2025)
  const [allData, setAllData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [activeView, setActiveView] = useState('overview')

  useEffect(() => {
    const seasons = generateSeasonData(selectedYear)
    const months = generateMonthlyData(selectedYear)
    setAllData(seasons)
    setMonthlyData(months)
  }, [selectedYear])

  const yalaData = allData.find(d => d.season === 'Yala')
  const mahaData = allData.find(d => d.season === 'Maha')

  const avg = (data, key) => data ? data[key]?.toFixed(2) : 'N/A'

  const rainDiff = (parseFloat(avg(mahaData, 'rainfall')) - parseFloat(avg(yalaData, 'rainfall'))).toFixed(1)
  const flowDiff = (parseFloat(avg(mahaData, 'waterFlow')) - parseFloat(avg(yalaData, 'waterFlow'))).toFixed(1)

  const chartData = monthlyData

  const radarData = [
    { subject: t('season.rainfall'), Yala: parseFloat(avg(yalaData, 'rainfall')), Maha: parseFloat(avg(mahaData, 'rainfall')) },
    { subject: t('season.waterFlow'), Yala: parseFloat(avg(yalaData, 'waterFlow')), Maha: parseFloat(avg(mahaData, 'waterFlow')) },
    { subject: t('season.reservoirLevel'), Yala: parseFloat(avg(yalaData, 'reservoirLevel')), Maha: parseFloat(avg(mahaData, 'reservoirLevel')) },
    { subject: t('season.cropArea'), Yala: parseFloat(avg(yalaData, 'cropArea')) / 1000, Maha: parseFloat(avg(mahaData, 'cropArea')) / 1000 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-sm text-slate-800 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Get description with translation
  const getDescription = (seasonKey) => {
    const descMap = {
      'yalaDescription': t('season.yalaDescription', 'The Yala season is the main dry season in Sri Lanka, typically lasting from May to August...'),
      'mahaDescription': t('season.mahaDescription', 'The Maha season is the main rainy season in Sri Lanka, spanning from September to March...'),
      'yalaChar1': t('season.yalaChar1', 'Low rainfall (average 120-150 mm)'),
      'yalaChar2': t('season.yalaChar2', 'Reduced canal water flow'),
      'yalaChar3': t('season.yalaChar3', 'High evaporation rates'),
      'yalaChar4': t('season.yalaChar4', 'Increased reliance on irrigation'),
      'yalaChar5': t('season.yalaChar5', 'Crop water stress possible'),
      'yalaStrat1': t('season.yalaStrat1', 'Efficient water use practices'),
      'yalaStrat2': t('season.yalaStrat2', 'Crop selection for dry conditions'),
      'yalaStrat3': t('season.yalaStrat3', 'Scheduled irrigation rotations'),
      'yalaStrat4': t('season.yalaStrat4', 'Rainwater harvesting'),
      'mahaChar1': t('season.mahaChar1', 'High rainfall (average 250-300 mm)'),
      'mahaChar2': t('season.mahaChar2', 'Increased canal water flow'),
      'mahaChar3': t('season.mahaChar3', 'Reservoir levels rise significantly'),
      'mahaChar4': t('season.mahaChar4', 'Risk of flooding in low-lying areas'),
      'mahaChar5': t('season.mahaChar5', 'Ideal for paddy cultivation'),
      'mahaStrat1': t('season.mahaStrat1', 'Flood control measures'),
      'mahaStrat2': t('season.mahaStrat2', 'Optimizing reservoir storage'),
      'mahaStrat3': t('season.mahaStrat3', 'Crop planning to align with rains'),
      'mahaStrat4': t('season.mahaStrat4', 'Drainage management'),
    }
    return descMap[seasonKey] || seasonKey
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      
      {/* HERO SECTION */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-3xl overflow-hidden mb-8"
      >
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.seasonBg || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200'} alt="Seasons" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/85 via-green-800/70 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2">
                <FiCalendar className="text-emerald-400" />
                <span>{t('season.title')} · {selectedYear}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t('season.title')}
              </h1>
              <p className="mt-2 text-white/80 max-w-lg text-sm leading-relaxed">
                {t('season.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <FiDroplet className="text-blue-300" />
              <span className="text-sm font-medium">{t('season.rainfall')}</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white/20 backdrop-blur-md text-white rounded-xl px-3 py-1 outline-none cursor-pointer font-medium text-sm border border-white/10 focus:ring-2 focus:ring-emerald-400"
              >
                <option value={2025} className="text-slate-800">2025</option>
                <option value={2026} className="text-slate-800">2026</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QUICK STATS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><FiSun className="text-lg" /></div>
            <div>
              <p className="text-xs text-slate-400">{t('season.yala')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">May – Aug</p>
              <p className="text-xs text-amber-600">{t('season.yalaDesc')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><FiCloudRain className="text-lg" /></div>
            <div>
              <p className="text-xs text-slate-400">{t('season.maha')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">Sep – Mar</p>
              <p className="text-xs text-blue-600">{t('season.mahaDesc')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><FiTrendingUp className="text-lg" /></div>
            <div>
              <p className="text-xs text-slate-400">{t('season.rainfallIncrease')}</p>
              <p className="text-lg font-bold text-emerald-600">
                {rainDiff !== 'NaN' ? (parseFloat(rainDiff) > 0 ? `+${rainDiff}%` : `${rainDiff}%`) : 'N/A'}
              </p>
              <p className="text-xs text-slate-400">Yala → Maha</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><FiDroplet className="text-lg" /></div>
            <div>
              <p className="text-xs text-slate-400">{t('season.avgFlow')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {avg(mahaData, 'waterFlow')} m³/s
              </p>
              <p className="text-xs text-slate-400">{t('season.maha')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* VIEW TOGGLE */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'overview' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FiBarChart2 className="inline mr-2" size={14} />
          {t('season.overview')}
        </button>
        <button
          onClick={() => setActiveView('comparison')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'comparison' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FiPieChart className="inline mr-2" size={14} />
          {t('season.comparison')}
        </button>
        <button
          onClick={() => setActiveView('info')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'info' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FiInfo className="inline mr-2" size={14} />
          {t('season.aboutSeasons')}
        </button>
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/30 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiSun className="text-amber-500 text-xl" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('season.yala')}</h3>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">{t('season.yalaDesc')}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><span className="text-xs text-slate-500">{t('season.rainfall')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(yalaData, 'rainfall')} mm</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.waterFlow')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(yalaData, 'waterFlow')} m³/s</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.reservoirLevel')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(yalaData, 'reservoirLevel')}%</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.cropArea')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(yalaData, 'cropArea')} ha</p></div>
                  </div>
                </div>
                <FiSun className="text-6xl text-amber-200/50 dark:text-amber-700/30" />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiCloudRain className="text-blue-500 text-xl" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('season.maha')}</h3>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">{t('season.mahaDesc')}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><span className="text-xs text-slate-500">{t('season.rainfall')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(mahaData, 'rainfall')} mm</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.waterFlow')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(mahaData, 'waterFlow')} m³/s</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.reservoirLevel')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(mahaData, 'reservoirLevel')}%</p></div>
                    <div><span className="text-xs text-slate-500">{t('season.cropArea')}</span><p className="text-lg font-bold text-slate-800 dark:text-white">{avg(mahaData, 'cropArea')} ha</p></div>
                  </div>
                </div>
                <FiCloudRain className="text-6xl text-blue-200/50 dark:text-blue-700/30" />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" />
                {t('season.monthlyRainfall')} & {t('season.waterFlow')}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="rainfall" fill="url(#colorRain)" radius={[4,4,0,0]} name={t('season.rainfall')} />
                  <Line yAxisId="right" type="monotone" dataKey="waterFlow" stroke="#F59E0B" strokeWidth={2} name={t('season.waterFlow')} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <FiDroplet className="text-blue-500" />
                {t('season.reservoirLevel')} & {t('season.cropArea')}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="reservoirLevel" stroke="#3B82F6" fill="#3B82F630" name={t('season.reservoirLevel')} />
                  <Line yAxisId="right" type="monotone" dataKey="cropArea" stroke="#10B981" strokeWidth={2} name={t('season.cropArea')} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FiInfo size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                  {t('season.seasonalInsight')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('season.insightText')}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">{t('season.yala')}: Dry, lower flow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">{t('season.maha')}: Wet, higher flow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Reservoir: {avg(mahaData, 'reservoirLevel')}% capacity</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* COMPARISON VIEW */}
      {activeView === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <FiPieChart className="text-purple-500" />
              {t('season.seasonComparison')} Radar
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name={t('season.yala')} dataKey="Yala" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Radar name={t('season.maha')} dataKey="Maha" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" />
              {t('season.seasonComparison')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('seasonLabels.month')}</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-amber-600">{t('season.yala')}</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-blue-600">{t('season.maha')}</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-emerald-600">{t('seasonLabels.waterFlow')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: t('season.rainfall'), yala: avg(yalaData, 'rainfall'), maha: avg(mahaData, 'rainfall') },
                    { key: t('season.waterFlow'), yala: avg(yalaData, 'waterFlow'), maha: avg(mahaData, 'waterFlow') },
                    { key: t('season.reservoirLevel'), yala: avg(yalaData, 'reservoirLevel'), maha: avg(mahaData, 'reservoirLevel') },
                    { key: t('season.cropArea'), yala: avg(yalaData, 'cropArea'), maha: avg(mahaData, 'cropArea') },
                  ].map((item, idx) => {
                    const diff = (parseFloat(item.maha) - parseFloat(item.yala)).toFixed(2)
                    const isPositive = parseFloat(diff) > 0
                    return (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{item.key}</td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">{item.yala}</td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">{item.maha}</td>
                        <td className={`py-2 px-3 text-center font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isPositive ? `+${diff}` : diff}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
              * {t('seasonLabels.month')} {selectedYear}
            </div>
          </div>
        </div>
      )}

      {/* INFO VIEW */}
      {activeView === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`bg-gradient-to-br ${SEASON_INFO.yala.bg} dark:${SEASON_INFO.yala.bg.replace('50','900/20')} rounded-2xl border ${SEASON_INFO.yala.border} dark:border-amber-700/30 p-6 shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-3">
              <FiSun className="text-amber-500 text-2xl" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t(`season.${SEASON_INFO.yala.title}`)}</h3>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{t(`season.${SEASON_INFO.yala.subtitle}`)}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {getDescription('yalaDescription')}
            </p>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('season.keyCharacteristics')}</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {[1,2,3,4,5].map(i => (
                  <li key={i}>{getDescription(`yalaChar${i}`)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('season.managementStrategies')}</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {[1,2,3,4].map(i => (
                  <li key={i}>{getDescription(`yalaStrat${i}`)}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`bg-gradient-to-br ${SEASON_INFO.maha.bg} dark:${SEASON_INFO.maha.bg.replace('50','900/20')} rounded-2xl border ${SEASON_INFO.maha.border} dark:border-blue-700/30 p-6 shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-3">
              <FiCloudRain className="text-blue-500 text-2xl" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t(`season.${SEASON_INFO.maha.title}`)}</h3>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t(`season.${SEASON_INFO.maha.subtitle}`)}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {getDescription('mahaDescription')}
            </p>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('season.keyCharacteristics')}</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {[1,2,3,4,5].map(i => (
                  <li key={i}>{getDescription(`mahaChar${i}`)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('season.managementStrategies')}</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {[1,2,3,4].map(i => (
                  <li key={i}>{getDescription(`mahaStrat${i}`)}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="md:col-span-2 mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <FiMap className="text-emerald-500" />
              {t('season.importanceOfPlanning')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('season.insightText')}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2 border border-amber-200 dark:border-amber-700/30">
                <span className="text-xs text-slate-500">{t('season.yala')}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{t('season.yalaDesc')}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 border border-blue-200 dark:border-blue-700/30">
                <span className="text-xs text-slate-500">{t('season.maha')}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{t('season.mahaDesc')}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2 border border-emerald-200 dark:border-emerald-700/30">
                <span className="text-xs text-slate-500">{t('seasonLabels.waterFlow')}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Reservoir filling & release</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>© 2026 CanalIQ</span>
          <span className="hidden sm:inline">•</span>
          <span>{t('season.title')}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Data-driven insights</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-400">
            {selectedYear} · Sri Lanka
          </span>
        </p>
      </motion.div>
    </div>
  )
}

export default SeasonAnalysis