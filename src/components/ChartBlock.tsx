import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
)

interface ChartBlockProps {
  code: string
}

interface ParsedChart {
  type: string
  title: string
  labels: string[]
  datasets: { label: string; data: number[]; color: string }[]
}

function parseChartCode(code: string): ParsedChart | null {
  const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length < 3) return null

  const typeLine = lines.find(l => l.startsWith('type:'))
  const titleLine = lines.find(l => l.startsWith('title:'))
  const labelsLine = lines.find(l => l.startsWith('labels:'))

  if (!typeLine || !labelsLine) return null

  const chartType = typeLine.slice(5).trim().toLowerCase()
  const title = titleLine ? titleLine.slice(6).trim() : ''
  const labels = parseArray(labelsLine.slice(7).trim())

  const datasetLines: string[] = []
  let inDatasets = false
  for (const line of lines) {
    if (line.startsWith('datasets:')) {
      inDatasets = true
      continue
    }
    if (inDatasets) {
      if (line.startsWith('- label:')) {
        datasetLines.push(line)
      } else if (datasetLines.length > 0 && line.startsWith('label:') && !line.startsWith('-')) {
        datasetLines[datasetLines.length - 1] += '\n' + line
      } else if (datasetLines.length > 0) {
        datasetLines[datasetLines.length - 1] += '\n' + line
      }
    }
  }

  const datasets = datasetLines.map(block => {
    const labelMatch = block.match(/label:\s*(.+)/)
    const dataMatch = block.match(/data:\s*\[(.+?)\]/)
    const colorMatch = block.match(/color:\s*(.+)/)
    return {
      label: labelMatch ? labelMatch[1].trim() : '',
      data: dataMatch ? dataMatch[1].split(',').map(Number) : [],
      color: colorMatch ? colorMatch[1].trim() : '#3b82f6',
    }
  })

  return { type: chartType, title, labels, datasets }
}

function parseArray(s: string): string[] {
  const cleaned = s.replace(/^\[/, '').replace(/\]$/, '').trim()
  if (!cleaned) return []
  return cleaned.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''))
}

const CHART_TYPE_MAP: Record<string, string> = {
  bar: 'bar',
  line: 'line',
  pie: 'pie',
  doughnut: 'doughnut',
  donut: 'doughnut',
  radar: 'radar',
  polar: 'polarArea',
  polararea: 'polarArea',
  polarArea: 'polarArea',
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#06b6d4', '#d946ef',
]

function getIsDark(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.classList.contains('dark')
}

export default function ChartBlock({ code }: ChartBlockProps) {
  const parsed = parseChartCode(code)
  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    setIsDark(getIsDark())
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!parsed) {
    return (
      <pre className="my-6 p-4 rounded-2xl border text-xs font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9', borderColor: 'rgba(255,255,255,0.15)' }}>
        <code>{code}</code>
      </pre>
    )
  }

  const themeKey = isDark ? 'dark' : 'light'

  const chartType = CHART_TYPE_MAP[parsed.type] || 'bar'

  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const gridColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const bgColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  const datasets = parsed.datasets.length > 0
    ? parsed.datasets.map((ds, i) => ({
        ...ds,
        color: ds.color || COLORS[i % COLORS.length],
      }))
    : [{ label: '', data: [] as number[], color: '' }]

  if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
    return (
      <pre className="my-6 p-4 rounded-2xl border text-xs font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9', borderColor: 'rgba(255,255,255,0.15)' }}>
        <code>{code}</code>
      </pre>
    )
  }

  const isPolarType = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea'

  if (isPolarType) {
    const ChartComponent = chartType === 'doughnut' ? Doughnut : chartType === 'polarArea' ? PolarArea : Pie
    const labelColors = parsed.labels.map((_, i) => COLORS[i % COLORS.length])
    const polarData = {
      labels: parsed.labels,
      datasets: datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: labelColors.map(c => hexToRgba(c, 0.75)),
        borderColor: labelColors,
        borderWidth: 2,
      })),
    }
    const polarOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: textColor, font: { size: 11, family: 'Outfit, Inter, sans-serif' } },
        },
        title: parsed.title ? {
          display: true,
          text: parsed.title,
          color: textColor,
          font: { size: 14, weight: 'bold', family: 'Outfit, Inter, sans-serif' },
        } : undefined,
      },
    }
    return (
      <div className="my-6 flex justify-center">
        <div className="w-full max-w-md">
          <ChartComponent key={themeKey} data={polarData as any} options={polarOptions as any} />
        </div>
      </div>
    )
  }

  const chartData: ChartData<'bar'> = {
    labels: parsed.labels,
    datasets: datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: hexToRgba(ds.color, 0.7),
      borderColor: ds.color,
      borderWidth: 2,
      borderRadius: chartType === 'bar' ? 4 : undefined,
      tension: chartType === 'line' ? 0.3 : undefined,
      pointBackgroundColor: ds.color,
      pointBorderColor: isDark ? '#0a0a0a' : '#ffffff',
      pointRadius: chartType === 'line' ? 3 : undefined,
      fill: chartType === 'line' ? false : undefined,
    })),
  }

  const baseOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    backgroundColor: bgColor,
    plugins: {
      legend: {
        labels: { color: textColor, font: { size: 11, family: 'Outfit, Inter, sans-serif' } },
      },
      title: parsed.title ? {
        display: true,
        text: parsed.title,
        color: textColor,
        font: { size: 14, weight: 'bold', family: 'Outfit, Inter, sans-serif' },
      } : undefined,
    },
    scales: chartType !== 'radar' ? {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10, family: 'Outfit, Inter, sans-serif' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10, family: 'Outfit, Inter, sans-serif' } },
      },
    } : undefined,
  }

  const commonProps = { key: themeKey, data: chartData as any, options: baseOptions as any }

  if (chartType === 'radar') {
    return (
      <div className="my-6 flex justify-center">
        <div className="w-full max-w-md">
          <Radar {...commonProps} />
        </div>
      </div>
    )
  }

  if (chartType === 'line') {
    return (
      <div className="my-6">
        <Line {...commonProps} />
      </div>
    )
  }

  return (
    <div className="my-6">
      <Bar {...commonProps} />
    </div>
  )
}
