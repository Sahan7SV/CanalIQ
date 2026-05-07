import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { fetchAllNodes, fetchSeasonData } from '../services/api'
import { IMAGES } from '../assets/images'

const Report = () => {
  const { t } = useTranslation()
  const [nodes, setNodes] = useState([])
  const [seasonData, setSeasonData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllNodes().then(setNodes).catch(console.error)
    fetchSeasonData().then(setSeasonData).catch(console.error)
  }, [])

  const stats = {
    healthy: nodes.filter(n => n.status === 'Healthy').length,
    warning: nodes.filter(n => n.status === 'Warning').length,
    critical: nodes.filter(n => n.status === 'Critical').length,
  }

  const latestYear = 2024
  const currentSeasonData = seasonData.filter(d => d.year === latestYear)
  const yalaData = currentSeasonData.filter(d => d.season === 'Yala')
  const mahaData = currentSeasonData.filter(d => d.season === 'Maha')

  const avg = (arr, key) =>
    arr.length ? (arr.reduce((a, b) => a + Number(b[key]), 0) / arr.length).toFixed(2) : 'N/A'

  // ---------- Professional PDF Generation ----------
  const handleDownloadPDF = () => {
    setLoading(true)
    setError(null)

    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Color palette (soft, corporate)
      const primary = [16, 185, 129]     // green
      const secondary = [59, 130, 246]   // blue
      const dark = [30, 41, 59]
      const gray = [107, 114, 128]
      const lightGray = [243, 244, 246]
      const accentWarm = [245, 158, 11]  // warning yellow

      // --- Helper: draw page border and logo mark ---
      const addPageBorder = () => {
        const borderMargin = 6
        doc.setDrawColor(...primary)
        doc.setLineWidth(0.8)
        doc.rect(borderMargin, borderMargin, pageWidth - 2 * borderMargin, pageHeight - 2 * borderMargin, 'S')

        // Small logo mark top-left corner
        doc.setFillColor(...primary)
        doc.roundedRect(borderMargin + 2, borderMargin + 2, 16, 8, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('CanalIQ', borderMargin + 3.5, borderMargin + 7.5)
      }

      // --- Helper: add background tint behind title area ---
      const addTitleBackground = () => {
        doc.setFillColor(240, 253, 244) // very light green
        doc.rect(0, 0, pageWidth, 35, 'F')
        doc.setFillColor(...primary)
        doc.rect(0, 0, pageWidth, 4, 'F')
      }

      // --- Page 1: Cover + Node Details ---
      addPageBorder()
      addTitleBackground()

      // Company name & title
      doc.setTextColor(...dark)
      doc.setFontSize(23)
      doc.setFont('helvetica', 'bold','center')
      doc.text('CanalIQ', pageWidth / 2, 22, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...primary)
      doc.text('Smart Irrigation Monitoring Report',pageWidth / 2, 28, { align: 'center' })

      // Report meta
      doc.setTextColor(...dark)
      doc.setFontSize(15)
      doc.text('System Health & Performance', 14, 45)

      doc.setFontSize(9)
      doc.setTextColor(...gray)
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 55)
      doc.text(`Season Focus: Yala & Maha ${latestYear}  |  Total Nodes: ${nodes.length}`, 14, 61)

      // Status summary with colored dots
      doc.setFontSize(10)
      doc.setTextColor(...dark)
      doc.text('Quick Status', 14, 72)
      doc.setFillColor(...primary)
      doc.circle(18, 78, 2, 'F')
      doc.setFontSize(9)
      doc.text(`Healthy: ${stats.healthy}`, 24, 79)
      doc.setFillColor(...accentWarm)
      doc.circle(46, 78, 2, 'F')
      doc.text(`Warning: ${stats.warning}`, 52, 79)
      doc.setFillColor(239, 68, 68)
      doc.circle(74, 78, 2, 'F')
      doc.text(`Critical: ${stats.critical}`, 80, 79)

      // Node Details Table
      doc.setFontSize(13)
      doc.setTextColor(...dark)
      doc.text('IoT Node Detail', 14, 95)

      const nodeRows = nodes.map(node => [
        `Node ${node.id}`,
        `${node.lat}, ${node.lng}`,
        node.status,
        node.chi.toFixed(2),
        node.cwqi.toFixed(2),
        `T:${node.chiComponents.turbidity} F:${node.chiComponents.waterFlow} US:${node.chiComponents.ultrasonic}`,
        `pH:${node.cwqiComponents.ph} T:${node.cwqiComponents.temperature}°C TDS:${node.cwqiComponents.tds}`,
      ])

      autoTable(doc, {
        startY: 100,
        head: [[
          'Node', 'Location (Lat, Lng)', 'Status', 'CHI', 'CWQI',
          'CHI Components', 'CWQI Components'
        ]],
        body: nodeRows,
        theme: 'striped',
        headStyles: {
          fillColor: primary,
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 14, halign: 'center' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 38 },
          6: { cellWidth: 38 },
        },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 10, right: 10 },
      })

      // --- Page 2: Seasonal Analysis ---
      doc.addPage()
      addPageBorder()  // border on new page
      addTitleBackground() // light green tint at top

      // Page 2 title
      doc.setTextColor(...dark)
      doc.setFontSize(20)
      doc.text('Seasonal Analysis', 14, 25)
      doc.setFontSize(10)
      doc.setTextColor(...gray)
      doc.text(`Yala & Maha Seasons – ${latestYear}`, 14, 33)

      // Yala Section (left column)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(12, 45, 88, 50, 2, 2, 'F')
      doc.setDrawColor(...accentWarm)
      doc.setLineWidth(0.6)
      doc.roundedRect(12, 45, 88, 50, 2, 2, 'S')

      doc.setFontSize(12)
      doc.setTextColor(...accentWarm)
      doc.text('Yala Season', 16, 55)
      doc.setFontSize(9)
      doc.setTextColor(...dark)
      doc.text('May – August (Dry)', 16, 61)
      doc.setFontSize(9)
      const yalaLines = [
        `Avg CHI: ${avg(yalaData, 'chi')}`,
        `Avg CWQI: ${avg(yalaData, 'cwqi')}`,
        `Avg Flow: ${avg(yalaData, 'waterFlow')} m³/s`,
        `Avg Rainfall: ${avg(yalaData, 'rainfall')} mm`,
      ]
      yalaLines.forEach((line, i) => doc.text(line, 18, 70 + i * 7))

      // Maha Section (right column)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(110, 45, 88, 50, 2, 2, 'F')
      doc.setDrawColor(...accentWarm)
      doc.setLineWidth(0.6)
      doc.roundedRect(110, 45, 88, 50, 2, 2, 'S')

      doc.setFontSize(12)
      doc.setTextColor(...accentWarm)
      doc.text('Maha Season', 114, 55)
      doc.setFontSize(9)
      doc.setTextColor(...dark)
      doc.text('Sep – March (Wet)', 114, 61)
      const mahaLines = [
        `Avg CHI: ${avg(mahaData, 'chi')}`,
        `Avg CWQI: ${avg(mahaData, 'cwqi')}`,
        `Avg Flow: ${avg(mahaData, 'waterFlow')} m³/s`,
        `Avg Rainfall: ${avg(mahaData, 'rainfall')} mm`,
      ]
      mahaLines.forEach((line, i) => doc.text(line, 116, 70 + i * 7))

      // Seasonal comparison table
      const seasonRows = [
        ['Yala (May - Aug)', avg(yalaData, 'chi'), avg(yalaData, 'cwqi'), avg(yalaData, 'waterFlow'), avg(yalaData, 'rainfall')],
        ['Maha (Sep - Mar)', avg(mahaData, 'chi'), avg(mahaData, 'cwqi'), avg(mahaData, 'waterFlow'), avg(mahaData, 'rainfall')],
      ]
      autoTable(doc, {
        startY: 105,
        head: [['Season', 'Avg CHI', 'Avg CWQI', 'Avg Flow (m³/s)', 'Avg Rainfall (mm)']],
        body: seasonRows,
        theme: 'grid',
        headStyles: {
          fillColor: secondary,
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
        },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { left: 14, right: 14 },
      })

      // --- Conclusion / End note ---
      doc.setFontSize(9)
      doc.setTextColor(...gray)
      const endY = doc.lastAutoTable.finalY + 15
      doc.text('— End of Report —', pageWidth / 2, endY, { align: 'center' })
      doc.text('Thank you for using CanalIQ', pageWidth / 2, endY + 7, { align: 'center' })

      // --- Add page numbers at the bottom inside border ---
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(...gray)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      }

      doc.save(`CanalIQ_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error(err)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- React UI (unchanged) ----------
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden h-48 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.reportBg})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent" />
        <div className="relative z-10 p-8 flex flex-col justify-center h-full text-white">
          <h2 className="text-3xl font-bold">{t('report.title')}</h2>
          <p className="mt-2 opacity-80">{t('report.description')}</p>
        </div>
      </div>

      {/* Node Details Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">All IoT Nodes – Full Details</h3>
          <span className="text-sm text-gray-500">{nodes.length} nodes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-4">Node</th>
                <th className="py-2 px-2">Lat/Lng</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">CHI</th>
                <th className="py-2 px-2">CHI Sensors</th>
                <th className="py-2 px-2">CWQI</th>
                <th className="py-2 px-2">CWQI Sensors</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(node => (
                <tr key={node.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 pr-4 font-medium">Node {node.id}</td>
                  <td className="py-3 px-2">{node.lat}, {node.lng}</td>
                  <td className="py-3 px-2"><Badge status={node.status} /></td>
                  <td className="py-3 px-2">{node.chi}</td>
                  <td className="py-3 px-2 text-xs">
                    Turb: {node.chiComponents.turbidity}, Flow: {node.chiComponents.waterFlow}, US: {node.chiComponents.ultrasonic}
                  </td>
                  <td className="py-3 px-2">{node.cwqi}</td>
                  <td className="py-3 px-2 text-xs">
                    pH: {node.cwqiComponents.ph}, T: {node.cwqiComponents.temperature}°C, TDS: {node.cwqiComponents.tds}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Seasonal Summary */}
      <Card>
        <h3 className="text-xl font-bold mb-4">Seasonal Analysis Summary ({latestYear})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <h4 className="font-bold text-warning">Yala Season (May - Aug)</h4>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div><span className="text-gray-500">Avg CHI</span><p className="font-bold">{avg(yalaData, 'chi')}</p></div>
              <div><span className="text-gray-500">Avg CWQI</span><p className="font-bold">{avg(yalaData, 'cwqi')}</p></div>
              <div><span className="text-gray-500">Avg Flow</span><p className="font-bold">{avg(yalaData, 'waterFlow')} m³/s</p></div>
              <div><span className="text-gray-500">Avg Rainfall</span><p className="font-bold">{avg(yalaData, 'rainfall')} mm</p></div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <h4 className="font-bold text-healthy">Maha Season (Sep - Mar)</h4>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div><span className="text-gray-500">Avg CHI</span><p className="font-bold">{avg(mahaData, 'chi')}</p></div>
              <div><span className="text-gray-500">Avg CWQI</span><p className="font-bold">{avg(mahaData, 'cwqi')}</p></div>
              <div><span className="text-gray-500">Avg Flow</span><p className="font-bold">{avg(mahaData, 'waterFlow')} m³/s</p></div>
              <div><span className="text-gray-500">Avg Rainfall</span><p className="font-bold">{avg(mahaData, 'rainfall')} mm</p></div>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-critical p-3 rounded-xl">{error}</div>
      )}

      {/* Download Button */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-info to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
        >
          <FiDownload />
          {loading ? 'Generating...' : 'Download PDF Report'}
        </button>
      </div>
    </motion.div>
  )
}

export default Report