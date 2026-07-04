import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

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
      data: dataMatch ? dataMatch[1].split(',').map(v => {
        const num = Number(v.trim());
        return isNaN(num) || v.trim().toLowerCase() === 'null' ? null : num;
      }) as number[] : [],
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

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#06b6d4', '#d946ef',
]

function getIsDark(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

export default function ChartBlock({ code }: ChartBlockProps) {
  const parsed = parseChartCode(code)
  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    setIsDark(getIsDark())
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark())
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  if (!parsed) {
    return (
      <pre className="my-6 p-4 rounded-2xl border text-xs font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9', borderColor: 'rgba(255,255,255,0.15)' }}>
        <code>{code}</code>
      </pre>
    )
  }

  const chartType = CHART_TYPE_MAP[parsed.type] || 'bar'

  const textColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const datasets = parsed.datasets.length > 0
    ? parsed.datasets.map((ds, i) => ({
        ...ds,
        color: ds.color || COLORS[i % COLORS.length],
      }))
    : [{ label: '', data: [] as (number|null)[], color: '' }]

  if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
    return (
      <pre className="my-6 p-4 rounded-2xl border text-xs font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9', borderColor: 'rgba(255,255,255,0.15)' }}>
        <code>{code}</code>
      </pre>
    )
  }

  // Common data transformation for Bar/Line/Radar
  const rechartsData = parsed.labels.map((label, index) => {
    const row: any = { name: label }
    datasets.forEach(ds => {
      row[ds.label] = ds.data[index]
    })
    return row
  })

  // Common Tooltip Props
  const tooltipContentStyle = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };
  const tooltipItemStyle = { fontSize: '13px', fontWeight: 600 };

  const isPolarType = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea'

  if (isPolarType) {
    const isDoughnut = chartType === 'doughnut';
    const pieData = parsed.labels.map((label, i) => ({
      name: label,
      value: datasets[0]?.data[i] || 0
    }))
    
    return (
      <div className="my-6 w-full flex flex-col items-center" style={{ height: 350 }}>
        {parsed.title && <h4 className="text-center mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{parsed.title}</h4>}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip 
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipItemStyle}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Pie 
              data={pieData} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              innerRadius={isDoughnut ? 60 : 0} 
              outerRadius={100}
              stroke={isDark ? '#0a0a0a' : '#ffffff'}
              strokeWidth={2}
              paddingAngle={isDoughnut ? 2 : 0}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'radar') {
    return (
      <div className="my-6 w-full flex flex-col items-center" style={{ height: 350 }}>
        {parsed.title && <h4 className="text-center mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{parsed.title}</h4>}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rechartsData}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: textColor, fontSize: 10 }} />
            <Tooltip 
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipItemStyle}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {datasets.map((ds) => (
              <Radar 
                key={ds.label} 
                name={ds.label} 
                dataKey={ds.label} 
                stroke={ds.color} 
                fill={ds.color} 
                fillOpacity={0.5} 
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'line') {
    return (
      <div className="my-6 w-full" style={{ height: 350 }}>
        {parsed.title && <h4 className="text-center mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{parsed.title}</h4>}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rechartsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipItemStyle}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {datasets.map(ds => (
              <Line 
                type="monotone" 
                key={ds.label} 
                dataKey={ds.label} 
                stroke={ds.color} 
                strokeWidth={2} 
                dot={{ r: 4, fill: ds.color }} 
                activeDot={{ r: 6 }} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Default Bar Chart
  return (
    <div className="my-6 w-full" style={{ height: 350 }}>
      {parsed.title && <h4 className="text-center mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{parsed.title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rechartsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            contentStyle={tooltipContentStyle}
            itemStyle={tooltipItemStyle}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          {datasets.map(ds => (
            <Bar 
              key={ds.label} 
              dataKey={ds.label} 
              fill={ds.color} 
              radius={[4, 4, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
