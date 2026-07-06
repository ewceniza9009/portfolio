interface SectionCounterProps {
  active: string
  total: number
  map?: Record<string, string>
}

export default function SectionCounter({ active, total, map }: SectionCounterProps) {
  const labels = map || {
    hero: '01',
    about: '02',
    experience: '03',
    awards: '04',
    projects: '05',
    gallery: '06',
    github: '07',
    skills: '08',
    contact: '09',
  }
  const name = labels[active] ? active.charAt(0).toUpperCase() + active.slice(1) : 'Hero'
  const num = labels[active] || '01'
  return (
    <div
      aria-hidden="true"
      className="fixed bottom-4 left-4 z-[60] hidden md:flex items-baseline gap-2 font-mono text-[10px] tracking-widest uppercase pointer-events-none select-none"
      style={{ color: 'var(--text-muted)' }}
    >
      <span style={{ color: 'var(--accent)' }}>{num}</span>
      <span className="opacity-40">/ {total.toString().padStart(2, '0')}</span>
      <span className="opacity-40">·</span>
      <span>{name}</span>
    </div>
  )
}
