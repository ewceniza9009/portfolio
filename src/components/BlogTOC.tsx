import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List } from 'lucide-react'
import { slugifyHeading } from '../utils/slugify'

export interface TocHeading {
  id: string
  text: string
  level: number
}

export function extractHeadings(content: string): TocHeading[] {
  if (!content) return []
  const lines = content.split('\n')
  const headings: TocHeading[] = []
  let inCodeBlock = false
  const counter = new Map<string, number>()
  for (let line of lines) {
    line = line.replace(/\r$/, '')
    if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
    if (inCodeBlock) continue
    const m = line.match(/^(#{1,6})\s+(.+)$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].replace(/[*_`~\[\]\(\)]/g, '').trim()
    if (!text) continue
    const id = slugifyHeading(m[2], counter)
    headings.push({ id, text, level })
  }
  return headings.filter(h => h.level >= 2 && h.level <= 3)
}

export default function BlogTOC({ headings, alwaysOpen = false, scrollable = false }: { headings: TocHeading[], alwaysOpen?: boolean, scrollable?: boolean }) {
  const [open, setOpen] = useState(alwaysOpen)
  if (!headings.length) return null
  return (
    <nav
      aria-label="Table of contents"
      className={`mb-10 rounded-2xl border glass${scrollable ? ' overflow-y-auto custom-scrollbar' : ''}`}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-card)',
        ...(scrollable ? { maxHeight: 'calc(100vh - 12rem)' } : {}),
      }}
    >
      {!alwaysOpen ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest font-bold"
          style={{ color: 'var(--text-secondary)' }}
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <List size={12} style={{ color: 'var(--accent)' }} />
            On This Page
          </span>
          <span className="opacity-50">{open ? '▼' : '+'}</span>
        </button>
      ) : (
        <div
          className="w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest font-bold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-2">
            <List size={12} style={{ color: 'var(--accent)' }} />
            On This Page
          </span>
        </div>
      )}
      <AnimatePresence initial={false}>
        {(open || alwaysOpen) && (
          <motion.ul
            initial={alwaysOpen ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={alwaysOpen ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden px-5 pb-3 space-y-1"
          >
            {headings.map((h) => (
              <li
                key={h.id}
                style={{ paddingLeft: `${(h.level - 2) * 14}px` }}
              >
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(h.id)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="block text-xs py-1 transition-colors hover:underline truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  )
}
