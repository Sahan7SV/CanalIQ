import { useState, useEffect, useMemo } from 'react'
import { fetchSeasonData } from '../services/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../assets/images'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { FiSun, FiCloudRain, FiDroplet } from 'react-icons/fi'

const SeasonAnalysis = () => {
  const [allData, setAllData] = useState([])
  const [selectedYear, setSelectedYear] = useState(2024)
  const { t } = useTranslation()

  useEffect(() => {
    fetchSeasonData().then(setAllData)
  }, [])

  const data = useMemo(() => allData.filter(d => d.year === selectedYear), [allData, selectedYear])

  // Season averages
  const yalaData = data.filter(d => d.season === 'Yala')
  const mahaData = data.filter(d => d.season === 'Maha')
  const avg = (arr, key) => arr.length ? (arr.reduce((a,b) => a + b[key], 0) / arr.length).toFixed(2) : 'N/A'

  const chartData = data.map(d => ({
    month: d.month,
    CHI: d.chi,
    CWQI: d.cwqi,
    Rainfall: d.rainfall,
  }))

  // Custom tooltip for area chart
  const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Hero banner – unchanged */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.seasonBg} alt="Season" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/60 to-transparent" />
        </div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between text-white">
          <div>
            <h2 className="text-3xl font-bold">{t('season.title')}</h2>
            <p className="mt-2 opacity-80 max-w-lg">Yala (May–August) is dry session</p>
            <p className="mt-2 opacity-80 max-w-lg">Maha (September–March) is wet session</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2">
              <FiDroplet className="text-blue-300" />
              <span className="text-sm">Irrigation Year</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white/20 backdrop-blur-md text-white rounded-xl px-4 py-2 outline-none cursor-pointer font-medium"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats tiles – unchanged */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-warning/20 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-warning/20 text-warning"><FiSun size={22} /></div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Yala Season</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">May – August (Dry season)</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div><span className="text-gray-500 text-xs">Avg CHI</span><p className="font-bold text-lg">{avg(yalaData, 'chi')}</p></div>
                <div><span className="text-gray-500 text-xs">Avg CWQI</span><p className="font-bold text-lg">{avg(yalaData, 'cwqi')}</p></div>
                <div><span className="text-gray-500 text-xs">Avg Flow</span><p className="font-bold text-lg">{avg(yalaData, 'waterFlow')} m³/s</p></div>
                <div><span className="text-gray-500 text-xs">Avg Rainfall</span><p className="font-bold text-lg">{avg(yalaData, 'rainfall')} mm</p></div>
              </div>
            </div>
            <FiSun className="text-6xl text-warning/20" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-healthy/20 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-healthy/20 text-healthy"><FiCloudRain size={22} /></div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Maha Season</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">September – March (Wet season)</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div><span className="text-gray-500 text-xs">Avg CHI</span><p className="font-bold text-lg">{avg(mahaData, 'chi')}</p></div>
                <div><span className="text-gray-500 text-xs">Avg CWQI</span><p className="font-bold text-lg">{avg(mahaData, 'cwqi')}</p></div>
                <div><span className="text-gray-500 text-xs">Avg Flow</span><p className="font-bold text-lg">{avg(mahaData, 'waterFlow')} m³/s</p></div>
                <div><span className="text-gray-500 text-xs">Avg Rainfall</span><p className="font-bold text-lg">{avg(mahaData, 'rainfall')} mm</p></div>
              </div>
            </div>
            <FiCloudRain className="text-6xl text-healthy/20" />
          </div>
        </Card>
      </div>

      {/* Insight card – unchanged */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-info/20 text-info"><FiDroplet size={24} /></div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{t('season.insightTitle')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t('season.insightText')}</p>
          </div>
        </div>
      </Card>

      {/* Two charts side by side – UPDATED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: CHI & CWQI Area Chart */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">CHI & CWQI Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCHI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCWQI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 1]} />
              <Tooltip content={<AreaTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="CHI"
                stroke="#10B981"
                fill="url(#colorCHI)"
                strokeWidth={2}
                name="CHI"
              />
              <Area
                type="monotone"
                dataKey="CWQI"
                stroke="#3B82F6"
                fill="url(#colorCWQI)"
                strokeWidth={2}
                name="CWQI"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Right: Rainfall Bar Chart */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Monthly Rainfall (mm)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="Rainfall"
                fill="#8B5CF6"
                radius={[6, 6, 0, 0]}
                name="Rainfall"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

    </motion.div>
  )
}

export default SeasonAnalysis