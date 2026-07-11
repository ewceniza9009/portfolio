import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AccentKey } from '../data/accents'
import { useGlobalTheme } from '../hooks/useGlobalTheme'

interface CodeHikeBlockProps {
  code: string
  lang: string
  meta?: string
  accent?: AccentKey
}

let darkHighlighterPromise: Promise<any> | null = null
let lightHighlighterPromise: Promise<any> | null = null
function getHighlighter(mode: 'dark' | 'light') {
  const theme = mode === 'dark' ? 'github-dark' : 'github-light'
  const existing = mode === 'dark' ? darkHighlighterPromise : lightHighlighterPromise
  if (existing) return existing
  const p = import('shiki').then(shiki =>
    shiki.createHighlighter({
      themes: [theme],
      langs: ['javascript', 'typescript', 'csharp', 'css', 'html', 'json', 'sql', 'python', 'bash', 'markdown', 'yaml', 'text'],
    })
  )
  if (mode === 'dark') darkHighlighterPromise = p; else lightHighlighterPromise = p
  return p
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', amber: '#f59e0b', yellow: '#eab308',
  lime: '#84cc16', green: '#22c55e', emerald: '#10b981', teal: '#14b8a6',
  cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
  violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899',
  rose: '#f43f5e', white: '#ffffff', gray: '#6b7280', grey: '#6b7280',
}

// Give each token span a staggered settle so code "animates itself" between
// steps (token-transition feel). Caps the per-line cascade so long lines don't lag.
function addTokenSettle(lineHtml: string, baseDelayMs: number): string {
  if (!lineHtml) return lineHtml
  let idx = 0
  return lineHtml.replace(/<span style="([^"]*)">/g, (_m, style: string) => {
    const delay = Math.min(baseDelayMs + idx * 12, baseDelayMs + 240)
    idx++
    return `<span style="${style}; animation: ch-token-settle 0.45s cubic-bezier(0.16,1,0.3,1) both; animation-delay: ${delay}ms">`
  })
}

interface Annotation {
  name: string
  query: string
  startLine: number
  endLine?: number
  inlineStart?: number
  inlineEnd?: number
  regex?: RegExp
  range?: string
}

interface LineAnnotation {
  type: string
  color?: string
  text?: string
  inlineStart?: number
  inlineEnd?: number
  regex?: RegExp
  startLine?: number
  endLine?: number
}

interface ParsedAnnotations {
  cleanLines: string[]
  lineAnnotations: Map<number, LineAnnotation[]>
}

function parseAnnotations(code: string): ParsedAnnotations {
  const lines = code.split('\n')
  const cleanLines: string[] = []
  const lineAnnotations = new Map<number, LineAnnotation[]>()
  const annotations: Annotation[] = []
  let cleanIndex = 0

  // Track open start/end pairs: Map<name, { startLine, query }>
  const openPairs = new Map<string, { startLine: number; query: string }>()

  function stripTrailingInlineComment(text: string): string {
    // Remove trailing // !...comment (including regex and column range styles) but preserve preceding code
    const m = text.match(/^(.*?)\s*\/\/\s*!\w+(?:\[\d+:\d+\]|(?:\/(?:[^\/\\]|\\.)+\/[gimsuy]*))?\s*(?:\([^)]*\)|.*)?\s*$/)
    return m ? m[1] : text
  }
  for (let raw of lines) {
    const trimmed = raw.trim()
    // Handle standalone annotations on their own line: !name(query), !name, !name[range](query), !name/regex/ query, !name[/regex/] query
    const standaloneMatch = trimmed.match(/^\s*\/\/\s*!(\w+)(?:\[(\d+):(\d+)\]|(?:\[?\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)\]?))?\s*(?:\(([^)]*)\)|(.*))?\s*$/)
    const inlineM = !standaloneMatch ? raw.match(/^(.*?)\/\/\s*!(\w+)(?:\[(\d+):(\d+)\]|(?:\[?\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)\]?))?\s*(?:\(([^)]*)\)|(.*))?\s*$/) : null

    if (standaloneMatch) {
      const [, name, colStart, colEnd, regexBody, regexFlags, parens, unparens] = standaloneMatch
      let range = ''
      let query = ''
      
      const val = parens !== undefined ? parens : (unparens || '').trim()

      if (val) {
        if (val === 'start' || val === 'end' || val === '-' || val === '+' || val.match(/^(\+?\d+):(\+?\d+)$/) || val.match(/^(\+?\d+)$/)) {
          range = val
        } else {
          query = val
        }
      }

      // Handle !name(start) / !name(end) pairs
      if (range === 'start') {
        openPairs.set(name, { startLine: cleanIndex, query })
        continue
      }
      if (range === 'end') {
        const open = openPairs.get(name)
        if (open) {
          if (cleanIndex - 1 >= open.startLine) {
            annotations.push({ name, query: open.query, startLine: open.startLine, endLine: cleanIndex - 1 })
          }
          openPairs.delete(name)
        }
        continue
      }

      // Diff shorthand: !diff(-) or !diff(+)
      if (name.toLowerCase() === 'diff') {
        annotations.push({ name, query, startLine: cleanIndex, endLine: cleanIndex, range })
        continue
      }

      const ann: Annotation = { name, query, startLine: cleanIndex, range }
      
      if (regexBody) {
        try { ann.regex = new RegExp(regexBody, regexFlags || 'g') } catch {}
      } else if (colStart && colEnd) {
        ann.inlineStart = parseInt(colStart) - 1
        ann.inlineEnd = parseInt(colEnd) - 1
      }

      if (range) {
        const rangeMatch = range.match(/^(\+?\d+)(?::(\+?\d+))?$/)
        if (rangeMatch && rangeMatch[2]) {
          ann.startLine = cleanIndex + parseInt(rangeMatch[1]) - 1
          ann.endLine = cleanIndex + parseInt(rangeMatch[2]) - 1
        } else if (rangeMatch) {
          ann.startLine = cleanIndex
          ann.endLine = cleanIndex + parseInt(rangeMatch[1]) - 1
        } else if (range === '+' || range === '-') {
          ann.startLine = cleanIndex
          ann.endLine = cleanIndex
        }
      } else {
        const lowerName = name.toLowerCase()
        if ((lowerName === 'fold' || lowerName === 'collapse') && range === '') {
          openPairs.set(name, { startLine: cleanIndex, query })
          continue
        }
        ann.startLine = cleanIndex
        ann.endLine = cleanIndex
      }
      annotations.push(ann)
      continue
    }

    if (inlineM && inlineM[1].trim().length > 0) {
      const [, , name, colStart, colEnd, regexBody, regexFlags, parens, unparens] = inlineM
      const val = parens !== undefined ? parens : (unparens || '').trim()
      const ann: Annotation = { name, query: val, startLine: cleanIndex }
      if (regexBody) {
        try { ann.regex = new RegExp(regexBody, regexFlags || 'g') } catch {}
      } else if (colStart && colEnd) {
        ann.inlineStart = parseInt(colStart) - 1
        ann.inlineEnd = parseInt(colEnd) - 1
      }
      annotations.push(ann)
      cleanLines.push(stripTrailingInlineComment(raw))
      cleanIndex++
      continue
    }

    cleanLines.push(raw)
    cleanIndex++
  }

  // Close any unclosed start/end pairs (extend to end of code)
  for (const [name, open] of openPairs) {
    annotations.push({ name, query: open.query, startLine: open.startLine, endLine: cleanLines.length - 1 })
  }

  for (const ann of annotations) {
    const endLine = ann.endLine ?? ann.startLine
    const color = ann.query || undefined

    const lowerName = ann.name.toLowerCase()
    const isInlineRange = !!(ann.regex || (ann.inlineStart !== undefined && ann.inlineEnd !== undefined))

    if (!isInlineRange && ['border', 'mark', 'bg', 'focus', 'highlight', 'add', 'remove', 'diff', 'collapse', 'fold', 'wrap', 'classname'].includes(lowerName)) {
      for (let i = ann.startLine; i <= endLine && i < cleanLines.length; i++) {
        if (!lineAnnotations.has(i)) lineAnnotations.set(i, [])
        let t = lowerName
        if (t === 'diff') {
          t = (ann.query.includes('-') || ann.range === '-') ? 'remove' : 'add'
        }
        lineAnnotations.get(i)!.push({ type: t, color, inlineStart: ann.inlineStart, inlineEnd: ann.inlineEnd, regex: ann.regex, startLine: ann.startLine, endLine })
      }
    } else if (!isInlineRange && ['callout', 'tooltip', 'link', 'footnote', 'label', 'style'].includes(lowerName)) {
      // Inline annotations apply to the target line; if regex/column, apply to that line, otherwise next line
      const targetLine = ann.startLine
      if (targetLine < cleanLines.length) {
        if (!lineAnnotations.has(targetLine)) lineAnnotations.set(targetLine, [])
        lineAnnotations.get(targetLine)!.push({ type: lowerName, text: color, regex: ann.regex, inlineStart: ann.inlineStart, inlineEnd: ann.inlineEnd })
      }
    } else if (ann.regex) {
      const targetLine = ann.startLine
      if (targetLine < cleanLines.length && ann.regex.test(cleanLines[targetLine])) {
        if (!lineAnnotations.has(targetLine)) lineAnnotations.set(targetLine, [])
        lineAnnotations.get(targetLine)!.push({ type: lowerName, color, text: color, regex: ann.regex })
      }
      ann.regex.lastIndex = 0
    } else if (isInlineRange) {
      const targetLine = ann.startLine
      if (targetLine < cleanLines.length) {
        if (!lineAnnotations.has(targetLine)) lineAnnotations.set(targetLine, [])
        lineAnnotations.get(targetLine)!.push({ type: lowerName, color, text: color, inlineStart: ann.inlineStart, inlineEnd: ann.inlineEnd, regex: ann.regex })
      }
    }
  }

  return { cleanLines, lineAnnotations }
}

/* ── Slideshow wrapper ─────────────────────────────────────────── */
function SlideshowBlock({ code, lang, meta }: CodeHikeBlockProps) {
  const { theme } = useGlobalTheme()
  const steps = useMemo(() => {
    return code.split(/^\s*\/\/\s*---\s*$/m).map(s => s.trim()).filter(Boolean)
  }, [code])

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [animKey, setAnimKey] = useState(0)

  const isDark = theme === 'dark'
  const total = steps.length
  const cleanMeta = meta?.replace(/\bslideshow\b/gi, '').trim() || undefined

  const goNext = useCallback(() => {
    if (step < total - 1) {
      setDirection('right')
      setStep(s => s + 1)
      setAnimKey(k => k + 1)
    }
  }, [step, total])

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection('left')
      setStep(s => s - 1)
      setAnimKey(k => k + 1)
    }
  }, [step])

  if (total <= 1) {
    return <CodeHikeBlockInner code={code} lang={lang} meta={cleanMeta} />
  }

  const animName = direction === 'right' ? 'ch-step-resolve-right' : 'ch-step-resolve-left'

  return (
    <div className="relative my-6">
      <style>{`
        @keyframes ch-step-resolve-right {
          0% { opacity: 0; filter: blur(8px); transform: translateX(34px) scale(0.985); }
          100% { opacity: 1; filter: blur(0); transform: translateX(0) scale(1); }
        }
        @keyframes ch-step-resolve-left {
          0% { opacity: 0; filter: blur(8px); transform: translateX(-34px) scale(0.985); }
          100% { opacity: 1; filter: blur(0); transform: translateX(0) scale(1); }
        }
        .ch-slideshow-step {
          animation-duration: 0.5s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
          will-change: opacity, transform, filter;
        }
      `}</style>
      <div key={animKey} className="ch-slideshow-step" style={{ animationName: animName }}>
        <CodeHikeBlockInner code={steps[step]} lang={lang} meta={cleanMeta} />
      </div>
      {/* Navigation bar */}
      <div
        className="flex items-center justify-between mt-2 px-1"
        style={{ color: isDark ? '#8b949e' : '#656d76' }}
      >
        <button
          onClick={goPrev}
          disabled={step === 0}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-150 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: step > 0 ? 'var(--accent)' : undefined }}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setDirection(idx > step ? 'right' : 'left'); setStep(idx); setAnimKey(k => k + 1) }}
              className="rounded-full transition-all duration-200"
              style={{
                width: idx === step ? 20 : 6,
                height: 6,
                background: idx === step ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
          <span className="text-[10px] ml-2 opacity-60">{step + 1} / {total}</span>
        </div>
        <button
          onClick={goNext}
          disabled={step === total - 1}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-150 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: step < total - 1 ? 'var(--accent)' : undefined }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Exported wrapper ──────────────────────────────────────────── */
export default function CodeHikeBlock(props: CodeHikeBlockProps) {
  const isSlideshow = props.meta?.toLowerCase().includes('slideshow')
  if (isSlideshow) {
    return <SlideshowBlock {...props} />
  }
  return <CodeHikeBlockInner {...props} />
}

function CodeHikeBlockInner({ code, lang, meta }: CodeHikeBlockProps) {
  const { theme } = useGlobalTheme()
  const [copied, setCopied] = useState(false)
  const [highlightedLines, setHighlightedLines] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [linesRevealed, setLinesRevealed] = useState(false)
  const [unfoldedRanges, setUnfoldedRanges] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'
  const shikiTheme = isDark ? 'github-dark' : 'github-light'

  const { cleanLines, lineAnnotations } = useMemo(() => parseAnnotations(code), [code])
  const hasAnnotations = lineAnnotations.size > 0
  const hasFocus = useMemo(() => {
    for (const anns of lineAnnotations.values()) {
      if (anns.some(a => a.type === 'focus')) return true
    }
    return false
  }, [lineAnnotations])

  const isWrapped = useMemo(() => {
    if (meta && meta.toLowerCase().includes('wrap')) return true
    for (const anns of lineAnnotations.values()) {
      if (anns.some(a => a.type === 'wrap')) return true
    }
    return false
  }, [meta, lineAnnotations])

  useEffect(() => {
    let cancelled = false
    const cleanCode = cleanLines.join('\n')
    if (!cleanCode.trim()) return

    getHighlighter(theme)
      .then(highlighter => {
        if (cancelled) return
        const loaded = highlighter.getLoadedLanguages()
        const resolvedLang = loaded.includes(lang) ? lang : 'text'
        return highlighter.codeToHtml(cleanCode, { lang: resolvedLang, theme: shikiTheme })
      })
      .then(html => {
        if (!cancelled && html) {
          const codeMatch = html.match(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/)
          if (codeMatch) {
            setHighlightedLines(codeMatch[1].split('\n'))
          } else {
            setHighlightedLines([html])
          }
          requestAnimationFrame(() => setRevealed(true))
          setTimeout(() => setLinesRevealed(true), 800)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [cleanLines, lang, theme])



  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanLines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [cleanLines])

  const lineCount = cleanLines.length

  const getLineColor = (color?: string): string => {
    if (!color) return 'var(--accent)'
    return COLOR_MAP[color.toLowerCase()] || color
  }

  return (
    <div
      ref={containerRef}
      className="relative group my-6 rounded-2xl select-text ch-container"
      style={{
        background: isDark ? '#0d1117' : '#ffffff',
      }}
    >
      <style>{`
        @keyframes ch-container-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
          60% { opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes ch-border-in {
          0% { border-color: transparent; }
          100% { border-color: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}; }
        }
        @keyframes ch-shadow-in {
          0% { box-shadow: 0 0 0 0 transparent; }
          100% { box-shadow: 0 8px 32px -8px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}, 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; }
        }
        .ch-container {
          animation: ch-container-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both,
                     ch-border-in 0.6s 0.1s ease both,
                     ch-shadow-in 0.6s 0.15s ease both;
          border: 1px solid transparent;
        }

        @keyframes ch-header-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ch-header { animation: ch-header-in 0.3s 0.2s ease both; }

        @keyframes ch-dot-blink {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        .ch-dot { animation: ch-dot-blink 3s ease-in-out infinite; }
        .ch-dot:nth-child(2) { animation-delay: 0.5s; }
        .ch-dot:nth-child(3) { animation-delay: 1s; }

        @keyframes ch-line-reveal {
          0% { opacity: 0; transform: translateY(6px); clip-path: inset(-50px 100% -50px -50px); }
          40% { clip-path: inset(-50px -50px -50px -50px); }
          100% { opacity: 1; transform: none; clip-path: none; }
        }
        @keyframes ch-line-dim-reveal {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 0.45; transform: none; }
        }
        .ch-line {
          padding: 2px 20px 2px 16px;
          border-left: 3px solid transparent;
          min-height: 1.4em;
          position: relative;
          z-index: 1;
          overflow: visible;
          transition: background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, color 0.3s ease;
        }
        /* Smoothly ease annotation highlights in/out (token-transition feel) */
        .ch-line-focused,
        .ch-line-mark,
        .ch-line-bg,
        .ch-line-border-single,
        .ch-line-border-first,
        .ch-line-border-mid,
        .ch-line-border-last,
        .ch-line-diff-add,
        .ch-line-diff-remove {
          transition: background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }

        @keyframes ch-token-settle {
          0% { opacity: 0.35; filter: blur(1.5px); transform: translateY(3px); }
          100% { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        .ch-line:hover {
          z-index: 100;
          opacity: 1 !important;
          transition: opacity 0.2s ease;
        }
        /* Prevent page horizontal stretching while allowing scroll */
        .ch-container { overflow-x: auto !important; overflow-y: hidden !important; }

        @keyframes ch-focus-border-in {
          0% { border-left-width: 0; opacity: 0; }
          50% { border-left-width: 3px; opacity: 1; }
          100% { border-left-width: 3px; opacity: 1; }
        }
        @keyframes ch-focus-glow {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: inset 0 0 20px rgba(250, 204, 21, 0.06); }
        }
        .ch-line-focused {
          background: rgba(250, 204, 21, 0.08) !important;
          border-left-color: #facc15 !important;
          animation: ch-focus-border-in 0.4s ease both, ch-focus-glow 3s ease-in-out infinite !important;
        }

        /* Border: grouped box (first / mid / last / single) */
        .ch-line-border-single {
          border: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-left-width: 3px !important;
          border-radius: 6px;
          margin: 2px 8px;
        }
        .ch-line-border-first {
          border-top: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-left: 3px solid var(--ch-ann-color, var(--accent)) !important;
          border-right: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-bottom: none !important;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          margin: 2px 8px 0 8px;
        }
        .ch-line-border-mid {
          border-left: 3px solid var(--ch-ann-color, var(--accent)) !important;
          border-right: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-top: none !important;
          border-bottom: none !important;
          margin: 0 8px;
        }
        .ch-line-border-last {
          border-bottom: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-left: 3px solid var(--ch-ann-color, var(--accent)) !important;
          border-right: 1px solid var(--ch-ann-color, var(--accent)) !important;
          border-top: none !important;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          margin: 0 8px 2px 8px;
        }

        @keyframes ch-bg-pulse {
          0%, 100% { background-color: var(--ch-bg-color); }
          50% { background-color: var(--ch-bg-color-hover); }
        }
        .ch-line-bg {
          background-color: var(--ch-bg-color) !important;
        }

        .ch-line-mark {
          background-color: var(--ch-bg-color) !important;
          border-left: 3px solid var(--ch-ann-color, var(--accent)) !important;
          border-radius: 0;
        }

        .ch-line-diff-add {
          background-color: rgba(34, 197, 94, 0.15) !important;
          border-left-color: #22c55e !important;
          border-left-width: 3px !important;
          border-left-style: solid !important;
        }
        .ch-line-diff-remove {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-left-color: #ef4444 !important;
          border-left-width: 3px !important;
          border-left-style: solid !important;
          opacity: 0.8;
        }
        .ch-line-diff-remove .text-xs {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .ch-line-callout { position: relative; }
        @keyframes ch-callout-in {
          0% { opacity: 0; transform: translateY(-50%) translateX(8px) scale(0.9); }
          60% { transform: translateY(-50%) translateX(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
        }
        .ch-callout-tag {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          pointer-events: none;
          white-space: nowrap;
          padding: 4px 8px;
          border-radius: 4px;
          backdrop-filter: blur(8px);
          opacity: 1;
        }
        .ch-callout-target {
          border-bottom: 2px dashed var(--accent);
          background-color: var(--accent-dim);
          border-radius: 2px;
          padding: 0 2px;
        }
        .ch-line-callout:hover .ch-callout-tag {
          animation: ch-callout-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Tooltip */
        .ch-tooltip-trigger {
          border-bottom: 1px dotted var(--accent);
          cursor: help;
          position: relative;
          display: inline-block;
        }
        .ch-tooltip-popup {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.92);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 50;
          opacity: 0 !important;
          pointer-events: none;
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ch-tooltip-trigger:hover .ch-tooltip-popup {
          opacity: 1 !important;
          transform: translateX(-50%) scale(1);
        }
        .ch-tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
        }

        /* Footnote */
        .ch-footnote-trigger {
          position: relative;
          cursor: help;
          border-bottom: 1px dashed currentColor;
          display: inline-block;
        }
        .ch-footnote-popup {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.92);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 50;
          opacity: 0 !important;
          pointer-events: none;
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ch-footnote-trigger:hover .ch-footnote-popup {
          opacity: 1 !important;
          transform: translateX(-50%) scale(1);
        }
        .ch-footnote-popup::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: inherit;
        }

        /* Callout (Always visible, inline next to token) */
        .ch-callout-inline {
          display: inline-block;
          margin-left: 6px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          font-family: inherit;
          white-space: normal;
          word-break: break-word;
          max-width: 250px;
          line-height: 1.4;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          vertical-align: middle;
          position: relative;
          z-index: 10;
        }


        /* Link */
        .ch-link-token {
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }
        .ch-link-token:hover {
          color: var(--accent) !important;
          text-decoration-color: var(--accent);
        }

        /* Footnote */
        .ch-footnote-marker {
          position: relative;
          border-bottom: 1px dashed currentColor;
        }
        .ch-footnote-sup {
          font-size: 9px;
          color: var(--accent);
          font-weight: 700;
          cursor: default;
          vertical-align: super;
          margin-right: 2px;
        }
        .ch-footnote-list {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 10px 20px;
          font-size: 11px;
          line-height: 1.6;
        }
        .ch-footnote-item {
          display: flex;
          gap: 8px;
          padding: 3px 0;
        }
        .ch-footnote-num {
          color: var(--accent);
          font-weight: 700;
          min-width: 16px;
        }

        /* Label */
        .ch-label-wrapper {
          position: relative;
          display: inline-block;
        }
        .ch-label-pill {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translate3d(-50%, -4px, 0);
          opacity: 1 !important;
          pointer-events: none;
          font-size: 9px; padding: 1px 6px; border-radius: 4px;
          white-space: nowrap; line-height: 1.4;
          z-index: 20;
          color: #fff !important;
          background: var(--accent) !important;
        }

        @keyframes ch-accent-sweep {
          0% { transform: scaleX(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        .ch-accent-line {
          transform-origin: left;
          animation: ch-accent-sweep 1.2s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes ch-copy-success {
          0% { transform: scale(1); }
          30% { transform: scale(1.25) rotate(-5deg); }
          60% { transform: scale(0.95) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .ch-copy-success { animation: ch-copy-success 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      {/* Header */}
      <div
        className={`ch-header flex items-center justify-between ${meta ? 'px-0 pt-0 pb-0 rounded-t-2xl overflow-hidden' : 'px-5 py-2.5 rounded-t-2xl'} text-[10px] font-bold tracking-wider select-none border-b transition-colors duration-300`}
        style={{
          background: isDark ? '#161b22' : '#f6f8fa',
          color: isDark ? '#8b949e' : '#656d76',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }}
      >
        {meta ? (
          <div className="flex items-center">
             <div className="px-4 py-2.5 border-r border-t-2 bg-[#0d1117] flex items-center gap-2" style={{ borderTopColor: 'var(--accent)', borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: isDark ? '#c9d1d9' : '#24292f' }}>
                <span className="normal-case text-[12px]">{meta}</span>
             </div>
             <div className="px-4 flex items-center gap-3 opacity-60 uppercase text-[9px]">
               <span>{lang || 'code'}</span>
               <span>{lineCount} lines</span>
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 uppercase">
            <div className="ch-dot w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="ch-dot w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="ch-dot w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2">{lang || 'code'}</span>
            <span style={{ color: isDark ? '#484f58' : '#d0d7de' }}>{lineCount} lines</span>
            {hasAnnotations && (
              <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                annotated
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 ${meta ? 'mr-3' : ''} px-2.5 py-1 rounded-lg transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 ${copied ? 'ch-copy-success' : ''}`}
          style={{ color: copied ? 'var(--accent)' : 'inherit', textTransform: 'uppercase' }}
        >
          {copied ? <><Check size={11} /><span>Copied!</span></> : <><Copy size={11} /><span>Copy</span></>}
        </button>
      </div>

      {/* Code lines */}
      <div className="rounded-b-2xl" style={{ transition: 'opacity 0.7s ease', opacity: revealed ? 1 : 0 }}>
        <div className="p-0 m-0 rounded-b-2xl" style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
          {(() => {
            let footnoteCounter = 0
            const footnotes: { num: number; text: string }[] = []
            const lines = highlightedLines.length > 0 ? (
            highlightedLines.map((lineHtmlStr, i) => {
              let lineHtml = lineHtmlStr
              const rawAnns = lineAnnotations.get(i)
              const anns = !rawAnns ? undefined : rawAnns.map(a => {
                if (['footnote', 'tooltip', 'callout', 'link', 'label'].includes(a.type) && !a.regex && a.inlineStart === undefined && a.inlineEnd === undefined) {
                  const textLine = cleanLines[i] || ''
                  const indent = textLine.search(/\S/)
                  return {
                    ...a,
                    inlineStart: indent === -1 ? 0 : indent,
                    inlineEnd: Math.max(0, textLine.length - 1)
                  }
                }
                return a
              })
              let cls = 'ch-line'
              let borderLeftColor = 'transparent'
              let bgColor: string | undefined
              let bgColorHover: string | undefined
              let isCollapsed = false

              if (anns) {
                for (const a of anns) {
                  if (a.type === 'focus') cls += ' ch-line-focused'
                  else if (a.type === 'border') {
                    // Grouped border: determine position within range
                    const bStart = a.startLine ?? i
                    const bEnd = a.endLine ?? i
                    if (bStart === bEnd) cls += ' ch-line-border-single'
                    else if (i === bStart) cls += ' ch-line-border-first'
                    else if (i === bEnd) cls += ' ch-line-border-last'
                    else cls += ' ch-line-border-mid'
                    borderLeftColor = getLineColor(a.color)
                  }
                  else if (a.type === 'highlight') cls += ' ch-line-focused'
                  else if (a.type === 'mark') {
                    cls += ' ch-line-mark'
                    bgColor = `color-mix(in srgb, ${getLineColor(a.color)} 25%, transparent)`
                    bgColorHover = `color-mix(in srgb, ${getLineColor(a.color)} 35%, transparent)`
                    borderLeftColor = getLineColor(a.color)
                  }
                  else if (a.type === 'bg') {
                    cls += ' ch-line-bg'
                    bgColor = `color-mix(in srgb, ${getLineColor(a.color)} 25%, transparent)`
                    bgColorHover = `color-mix(in srgb, ${getLineColor(a.color)} 35%, transparent)`
                  }
                  else if (a.type === 'add') {
                    cls += ' ch-line-diff-add'
                    borderLeftColor = '#22c55e'
                  }
                  else if (a.type === 'remove') {
                    cls += ' ch-line-diff-remove'
                    borderLeftColor = '#ef4444'
                  }
                  else if (a.type === 'collapse' || a.type === 'fold') {
                    const rangeKey = `${a.startLine}-${a.endLine}`
                    if (!unfoldedRanges.includes(rangeKey)) {
                      isCollapsed = true
                    }
                  }
                  else if (a.type === 'callout') {
                    cls += ' ch-line-callout'
                  }
                }

                // Inline annotations at LINE LEVEL (no regex, no column range):
                // treat the whole visible text on the line as the trigger.
                // Used by: !tooltip(text), !footnote(text), !label(text), !style(...), !link(url), !callout(text), !classname(class)
                const lineAnns = anns.filter(a =>
                  ['tooltip', 'footnote', 'label', 'style', 'link', 'callout', 'classname'].includes(a.type)
                  && !a.regex
                  && a.inlineStart === undefined
                  && a.inlineEnd === undefined
                )
                lineAnns.forEach(a => {
                  let wrapped = lineHtml
                  if (a.type === 'tooltip') {
                    const bg = 'var(--accent)'
                    const border = 'transparent'
                    const color = isDark ? '#000000' : '#ffffff'
                    const arrowColor = 'var(--accent)'
                    const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                    wrapped = `<span class="ch-tooltip-trigger">${lineHtml}<span class="ch-tooltip-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow}">${a.text || ''}<span class="ch-tooltip-arrow" style="border-top-color:${arrowColor}"></span></span></span>`
                  } else if (a.type === 'footnote') {
                    footnoteCounter++
                    const num = footnoteCounter
                    footnotes.push({ num, text: a.text || '' })
                    const bg = 'var(--accent)'
                    const border = 'transparent'
                    const color = isDark ? '#000000' : '#ffffff'
                    const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                    wrapped = `<span class="ch-footnote-trigger" style="position:relative"><sup class="ch-footnote-sup">[${num}]</sup>${lineHtml}<span class="ch-footnote-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow};border-bottom-color:${bg}">${a.text || ''}</span></span>`
                  } else if (a.type === 'link') {
                    const url = a.text || '#'
                    wrapped = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ch-link-token">${lineHtml}</a>`
                  } else if (a.type === 'callout') {
                    const bg = 'var(--accent)'
                    const border = 'transparent'
                    const color = isDark ? '#000000' : '#ffffff'
                    const indentMatch = (cleanLines[i] || '').match(/^\s+/)
                    const indentStr = indentMatch ? indentMatch[0] : ''
                    wrapped = `${lineHtml}\n${indentStr}<span class="ch-callout-inline" style="background:${bg};border:1px solid ${border};color:${color};margin-top:4px;display:inline-block">${a.text || ''}</span>`
                  } else if (a.type === 'label') {
                    const bg = isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)'
                    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    wrapped = `<span class="ch-label-wrapper">${lineHtml}<span class="ch-label-pill" style="background:${bg};border:1px solid ${border};color:var(--accent)">${a.text || ''}</span></span>`
                  } else if (a.type === 'style') {
                    wrapped = `<span style="${a.text || ''}">${lineHtml}</span>`
                  } else {
                    // classname
                    wrapped = `<span class="${a.color || ''}">${lineHtml}</span>`
                  }
                  lineHtml = wrapped
                })

                // Inline annotations with regex match a token in the line and wrap it
                const inlineAnns = anns.filter(a => ['classname', 'callout', 'tooltip', 'link', 'footnote', 'label', 'style'].includes(a.type) && a.regex)
                inlineAnns.forEach(a => {
                  if (a.regex) {
                    let wrapper: (m: string) => string
                    if (a.type === 'callout' || a.type === 'tooltip') {
                      const bg = 'var(--accent)'
                      const border = 'transparent'
                      const color = isDark ? '#000000' : '#ffffff'
                      const arrowColor = 'var(--accent)'
                      const isCallout = a.type === 'callout'
                      if (isCallout) {
                        wrapper = (m) => `<span class="ch-callout-target" style="border-bottom: 1px dashed rgba(255,255,255,0.4); cursor: help">${m}</span><span class="ch-callout-inline" style="background:${bg};border:1px solid ${border};color:${color};margin-left:8px">${a.text || ''}</span>`
                      } else {
                        const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                        wrapper = (m) => `<span class="ch-tooltip-trigger" style="position:relative">${m}<span class="ch-tooltip-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow}">${a.text || ''}<span class="ch-tooltip-arrow" style="border-top-color:${arrowColor}"></span></span></span>`
                      }
                    } else if (a.type === 'link') {
                      const url = a.text || '#'
                      wrapper = (m) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ch-link-token">${m}</a>`
                    } else if (a.type === 'footnote') {
                      footnoteCounter++
                      const num = footnoteCounter
                      footnotes.push({ num, text: a.text || '' })
                      const bg = 'var(--accent)'
                      const border = 'transparent'
                      const color = isDark ? '#000000' : '#ffffff'
                      const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                      wrapper = (m) => `<span class="ch-footnote-trigger" style="position:relative">${m}<span class="ch-footnote-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow}">${a.text || ''}</span></span>`
                    } else if (a.type === 'label') {
                      const bg = isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)'
                      const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      const color = 'var(--accent)'
                      wrapper = (m) => `<span class="ch-label-wrapper">${m}<span class="ch-label-pill" style="background:${bg};border:1px solid ${border};color:${color}">${a.text || ''}</span></span>`
                    } else if (a.type === 'style') {
                      wrapper = (m) => `<span style="${a.text || ''}">${m}</span>`
                    } else {
                      wrapper = (m) => `<span class="${a.color || ''}">${m}</span>`
                    }
                    const parts = lineHtml.split(/(<[^>]+>)/g)
                    for (let p = 0; p < parts.length; p++) {
                      if (!parts[p].startsWith('<')) {
                        parts[p] = parts[p].replace(a.regex, wrapper)
                      }
                    }
                    lineHtml = parts.join('')
                  }
                })

                const colAnns = anns.filter(a => ['callout', 'tooltip', 'link', 'footnote', 'label', 'style', 'classname', 'mark', 'highlight'].includes(a.type) && a.inlineStart !== undefined && a.inlineEnd !== undefined && !a.regex)
                colAnns.forEach(a => {
                  const parts = lineHtml.split(/(<[^>]+>)/g)
                  let visiblePos = 0
                  const overlaps: { p: number, start: number, end: number, len: number }[] = []
                  for (let p = 0; p < parts.length; p++) {
                    if (!parts[p].startsWith('<')) {
                      const segLen = parts[p].length
                      const segStart = visiblePos
                      const segEnd = visiblePos + segLen
                      if (segEnd > (a.inlineStart ?? 0) && segStart < (a.inlineEnd ?? 0) + 1) {
                        overlaps.push({ p, start: segStart, end: segEnd, len: segLen })
                      }
                      visiblePos = segEnd
                    }
                  }

                  overlaps.forEach((overlap, idx) => {
                    const isLast = idx === overlaps.length - 1
                    const { p, start: segStart, len: segLen } = overlap
                    const localStart = Math.max(0, (a.inlineStart ?? 0) - segStart)
                    const localEnd = Math.min(segLen, (a.inlineEnd ?? 0) - segStart + 1)
                    const before = parts[p].slice(0, localStart)
                    const target = parts[p].slice(localStart, localEnd)
                    const after = parts[p].slice(localEnd)
                    
                    let wrapped = target
                    if (a.type === 'mark' || a.type === 'highlight') {
                      wrapped = `<span style="background:color-mix(in srgb, ${getLineColor(a.color)} 25%, transparent);border-radius:3px;padding:0 2px">${target}</span>`
                    } else if (a.type === 'callout') {
                      const bg = 'var(--accent)'
                      const border = 'transparent'
                      const color = isDark ? '#000000' : '#ffffff'
                      wrapped = `<span class="ch-callout-target" style="border-bottom: 1px dashed rgba(255,255,255,0.4); cursor: help">${target}</span>`
                      if (isLast) {
                        wrapped += `<span class="ch-callout-inline" style="background:${bg};border:1px solid ${border};color:${color};margin-left:8px">${a.text || ''}</span>`
                      }
                    } else if (a.type === 'tooltip') {
                      const bg = 'var(--accent)'
                      const border = 'transparent'
                      const color = isDark ? '#000000' : '#ffffff'
                      const arrowColor = 'var(--accent)'
                      const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                      wrapped = `<span class="ch-tooltip-trigger" style="position:relative">${target}<span class="ch-tooltip-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow}">${a.text || ''}<span class="ch-tooltip-arrow" style="border-top-color:${arrowColor}"></span></span></span>`
                    } else if (a.type === 'link') {
                      const url = a.text || '#'
                      wrapped = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ch-link-token">${target}</a>`
                    } else if (a.type === 'footnote') {
                      const bg = 'var(--accent)'
                      const border = 'transparent'
                      const color = isDark ? '#000000' : '#ffffff'
                      if (isLast) {
                        footnoteCounter++
                        const num = footnoteCounter
                        footnotes.push({ num, text: a.text || '' })
                        const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
                        wrapped = `<span class="ch-footnote-trigger" style="position:relative">${target}<span class="ch-footnote-popup" style="background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 16px ${shadow}">${a.text || ''}</span></span>`
                      } else {
                        wrapped = `<span class="ch-footnote-trigger" style="position:relative">${target}</span>`
                      }
                    } else if (a.type === 'label') {
                      const bg = isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)'
                      const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      if (isLast) {
                        wrapped = `<span class="ch-label-wrapper">${target}<span class="ch-label-pill" style="background:${bg};border:1px solid ${border};color:var(--accent)">${a.text || ''}</span></span>`
                      } else {
                        wrapped = `<span class="ch-label-target">${target}</span>`
                      }
                    } else if (a.type === 'style') {
                      wrapped = `<span style="${a.text || ''}">${target}</span>`
                    } else if (a.type === 'classname') {
                      wrapped = `<span class="${a.color || ''}">${target}</span>`
                    }
                    parts[p] = before + wrapped + after
                  })
                  lineHtml = parts.join('')
                })
              }

              // Apply token settle animation for staggered token entrance (cascading per line)
              lineHtml = addTokenSettle(lineHtml, i * 10)

              const isFocused = anns?.some(a => a.type === 'focus' || a.type === 'highlight')
              const isDimmed = hasFocus && !isFocused

              // --- VS Code-style fold/collapse ---
              const collapseAnn = anns?.find(a => a.type === 'collapse' || a.type === 'fold')
              const isFoldFirstLine = collapseAnn && i === collapseAnn.startLine
              const rangeKey = collapseAnn ? `${collapseAnn.startLine}-${collapseAnn.endLine}` : ''
              const isFolded = isCollapsed // this line is in a folded range and NOT unfolded
              const isUnfolded = collapseAnn && unfoldedRanges.includes(rangeKey)

              // If this line is inside a folded range but NOT the first line, skip it entirely
              if (isFolded && !isFoldFirstLine) {
                return null
              }

              // First line of a folded range: show line + ellipsis badge
              if (isFolded && isFoldFirstLine) {
                const linesHidden = (collapseAnn!.endLine ?? collapseAnn!.startLine!) - collapseAnn!.startLine!
                return (
                  <div
                    key={i}
                    className={cls}
                    style={{
                      position: 'relative',
                      animation: linesRevealed
                        ? isDimmed
                          ? `ch-line-dim-reveal 0.3s ${0.05 + i * 0.02}s ease both`
                          : `ch-line-reveal 0.4s ${0.05 + i * 0.025}s cubic-bezier(0.16, 1, 0.3, 1) both`
                        : 'none',
                      borderLeftColor,
                      background: bgColor,
                      whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
                      wordBreak: isWrapped ? 'break-word' : 'normal',
                      '--ch-ann-color': borderLeftColor !== 'transparent' ? borderLeftColor : undefined,
                      '--ch-bg-color': bgColor,
                      '--ch-bg-color-hover': bgColorHover,
                    } as React.CSSProperties}
                  >
                    <span
                      className="ch-fold-chevron"
                      onClick={() => setUnfoldedRanges([...unfoldedRanges, rangeKey])}
                      title={`Expand ${linesHidden} hidden lines`}
                      style={{
                        display: 'inline-block',
                        width: '2rem',
                        textAlign: 'right',
                        marginRight: '1rem',
                        color: 'var(--accent)',
                        userSelect: 'none',
                        cursor: 'pointer',
                        fontSize: '10px',
                        opacity: 0.7,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      ▶
                    </span>
                    <span
                      className="text-xs font-mono select-text"
                      dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                    />
                    <span
                      className="ch-fold-ellipsis"
                      onClick={() => setUnfoldedRanges([...unfoldedRanges, rangeKey])}
                      title={`Expand ${linesHidden} hidden lines`}
                      style={{
                        display: 'inline-block',
                        marginLeft: '8px',
                        padding: '0 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                        color: isDark ? '#8b949e' : '#656d76',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        userSelect: 'none',
                        lineHeight: '18px',
                        verticalAlign: 'middle',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'
                        e.currentTarget.style.color = isDark ? '#c9d1d9' : '#1f2328'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
                        e.currentTarget.style.color = isDark ? '#8b949e' : '#656d76'
                      }}
                    >
                      ⋯ {linesHidden} lines
                    </span>
                  </div>
                )
              }

              // Normal line render (including unfolded fold lines)
              return (
                <div
                  key={i}
                  className={cls}
                  style={{
                    position: 'relative',
                    animation: linesRevealed
                      ? isDimmed
                        ? `ch-line-dim-reveal 0.3s ${0.05 + i * 0.02}s ease both`
                        : `ch-line-reveal 0.4s ${0.05 + i * 0.025}s cubic-bezier(0.16, 1, 0.3, 1) both`
                      : 'none',
                    borderLeftColor,
                    background: bgColor,
                    whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
                    wordBreak: isWrapped ? 'break-word' : 'normal',
                    '--ch-ann-color': borderLeftColor !== 'transparent' ? borderLeftColor : undefined,
                    '--ch-bg-color': bgColor,
                    '--ch-bg-color-hover': bgColorHover,
                  } as React.CSSProperties}
                >
                  {/* Gutter: ▼ chevron for unfold-first-line, else line number */}
                  {isFoldFirstLine && isUnfolded ? (
                    <span
                      className="ch-fold-chevron"
                      onClick={() => setUnfoldedRanges(unfoldedRanges.filter(r => r !== rangeKey))}
                      title="Fold lines"
                      style={{
                        display: 'inline-block',
                        width: '2rem',
                        textAlign: 'right',
                        marginRight: '1rem',
                        color: 'var(--accent)',
                        userSelect: 'none',
                        cursor: 'pointer',
                        fontSize: '10px',
                        opacity: 0.7,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      ▼
                    </span>
                  ) : (
                    <span style={{ display: 'inline-block', width: '2rem', textAlign: 'right', marginRight: '1rem', color: isDark ? '#6e7681' : '#8c959f', userSelect: 'none', opacity: isDimmed ? 0.5 : 1 }}>
                      {i + 1}
                    </span>
                  )}
                  <span
                    className="text-xs font-mono select-text flex-1"
                    dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                  />
                </div>
              )
            })
            ) : (
              <pre className={`p-5 overflow-x-auto text-xs font-mono select-text m-0 ${isWrapped ? 'whitespace-pre-wrap break-words' : ''}`} style={{ background: isDark ? '#0d1117' : '#ffffff', color: isDark ? '#c9d1d9' : '#24292f' }}>
                <code>{cleanLines.join('\n')}</code>
              </pre>
            )
            return (
              <>
                {lines}
                {footnotes.length > 0 && (
                  <div className="ch-footnote-list" style={{ background: isDark ? '#0d1117' : '#ffffff', color: isDark ? '#8b949e' : '#656d76' }}>
                    {footnotes.map(f => (
                      <div key={f.num} className="ch-footnote-item">
                        <span className="ch-footnote-num">[{f.num}]</span>
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>

      {/* Bottom accent sweep line */}
      <div className="relative overflow-hidden" style={{ height: '2px' }}>
        <div
          className="ch-accent-line absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          }}
        />
      </div>
    </div>
  )
}
