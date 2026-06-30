import { useRef, useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, Check, X, Trophy, RotateCcw } from 'lucide-react'

interface InteractiveBlockProps {
  html: string
  height?: string
}

// Preset parser: extracts type and config from HTML comments
function parsePreset(html: string): { type: string; config: any } | null {
  const match = html.match(/<!--\s*preset:\s*(\w+)\s*(?:\{([\s\S]*?)\})?\s*-->/)
  if (!match) return null
  try {
    const config = match[2] ? JSON.parse(match[2]) : {}
    return { type: match[1], config }
  } catch { return { type: match[1], config: {} } }
}

// ── Step-Through Tutorial ──
function StepThrough({ steps, height }: { steps: string[]; height: string }) {
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState<number[]>([0])

  const next = () => {
    if (current < steps.length - 1) {
      const nextIdx = current + 1
      setCurrent(nextIdx)
      setRevealed(prev => prev.includes(nextIdx) ? prev : [...prev, nextIdx])
    }
  }
  const prev = () => { if (current > 0) setCurrent(current - 1) }

  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="flex-1 overflow-auto p-6 space-y-4 text-left">
        {steps.map((step, i) => (
          <div key={i} className={`transition-all duration-500 ${revealed.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 h-0 overflow-hidden'}`}>
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${i === current ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--bg-card)]'}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === current ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
                {i + 1}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: step }} />
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={prev} disabled={current === 0} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30 transition-all" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{current + 1} / {steps.length}</span>
        <button onClick={next} disabled={current === steps.length - 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30 transition-all" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Interactive Quiz ──
function Quiz({ questions, height }: { questions: { q: string; options: string[]; correct: number }[]; height: string }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [done, setDone] = useState(false)

  const check = () => {
    if (selected === null) return
    setShowResult(true)
    if (selected === questions[current].correct) setScore(s => s + 1)
  }

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setDone(true)
    }
  }

  const restart = () => {
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setShowResult(false)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6" style={{ height }}>
        <Trophy size={40} style={{ color: pct >= 70 ? 'var(--accent)' : 'var(--text-muted)' }} />
        <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{score} / {questions.length}</div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pct >= 70 ? 'Great job!' : 'Keep practicing!'}</div>
        <button onClick={restart} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
          <RotateCcw size={14} /> Restart
        </button>
      </div>
    )
  }

  const q = questions[current]
  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="flex-1 overflow-auto p-6">
        <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Question {current + 1} of {questions.length}</div>
        <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{q.q}</div>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct
            const isSelected = i === selected
            let bg = 'var(--bg-card)'
            let border = 'var(--border)'
            if (showResult && isCorrect) { bg = '#166534'; border = '#22c55e' }
            else if (showResult && isSelected && !isCorrect) { bg = '#7f1d1d'; border = '#ef4444' }
            else if (isSelected) { bg = 'var(--accent-dim)'; border = 'var(--accent)' }
            return (
              <button key={i} onClick={() => !showResult && setSelected(i)} disabled={showResult}
                className="w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                style={{ background: bg, border: `1px solid ${border}`, color: 'var(--text-primary)' }}>
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {showResult && isCorrect ? <Check size={10} /> : showResult && isSelected && !isCorrect ? <X size={10} /> : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Score: {score}</span>
        {!showResult ? (
          <button onClick={check} disabled={selected === null} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            Check
          </button>
        ) : (
          <button onClick={next} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            {current < questions.length - 1 ? 'Next' : 'Finish'} <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main InteractiveBlock Component ──
export default function InteractiveBlock({ html, height = '420px' }: InteractiveBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const preset = parsePreset(html)

  // Parse preset content
  const renderPreset = () => {
    if (!preset) return null

    if (preset.type === 'steps') {
      // Parse steps from HTML: each <p> or <div> is a step
      const div = document.createElement('div')
      div.innerHTML = html.replace(/<!--[\s\S]*?-->/g, '')
      const steps = Array.from(div.querySelectorAll('p, li, h3, h4')).map(el => el.outerHTML)
      return <StepThrough steps={steps.length > 0 ? steps : ['Step 1', 'Step 2']} height={height} />
    }

    if (preset.type === 'quiz') {
      // Parse quiz from HTML: look for data-question, data-options, data-correct attributes
      const div = document.createElement('div')
      div.innerHTML = html.replace(/<!--[\s\S]*?-->/g, '')
      const qEls = div.querySelectorAll('[data-question]')
      const questions = Array.from(qEls).map(el => ({
        q: el.getAttribute('data-question') || '',
        options: (el.getAttribute('data-options') || '').split('|'),
        correct: parseInt(el.getAttribute('data-correct') || '0')
      }))
      if (questions.length > 0) return <Quiz questions={questions} height={height} />
      // Fallback: generate from text content
      return <Quiz questions={[
        { q: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
        { q: 'What color is the sky?', options: ['Green', 'Blue', 'Red', 'Yellow'], correct: 1 }
      ]} height={height} />
    }

    return null
  }

  const presetRender = renderPreset()
  if (presetRender) return presetRender

  // Generic interactive block: render HTML/JS like interactive-3d
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'width:100%;height:100%;position:relative;'
    wrapper.innerHTML = html
    container.appendChild(wrapper)

    let running = true; void running

    const resolveUrl = (spec: string): string | null => {
      if (spec === 'three') return 'https://esm.sh/three@0.169.0'
      if (spec.startsWith('http')) return spec
      return null
    }

    const scripts = Array.from(wrapper.querySelectorAll('script:not([data-ib-done])')) as HTMLScriptElement[]
    scripts.forEach(oldScript => {
      const rawCode = oldScript.textContent || ''
      const isModule = oldScript.type === 'module' || rawCode.trim().startsWith('import ')

      if (isModule) {
        const lines = rawCode.split('\n')
        const header: string[] = []
        const body: string[] = []
        for (const raw of lines) {
          const trimmed = raw.trim()
          if (!trimmed) { body.push(raw); continue }
          const match = trimmed.match(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/)
          if (match) {
            const url = resolveUrl(match[2])
            if (url) {
              const names = match[1].trim()
              const id = `__m${header.length}`
              header.push(`  const ${id} = await import('${url}');`)
              if (names.startsWith('{')) {
                const nc = names.replace(/^\{|\}$/g, '').trim()
                if (nc) for (const n of nc.split(',')) { const nn = n.trim(); if (nn) header.push(`  var ${nn} = ${id}.${nn};`) }
              } else if (names.startsWith('*')) {
                const vn = names.replace(/^\*\s+as\s+/, '').trim()
                header.push(`  var ${vn} = ${id};`)
              } else {
                header.push(`  var ${names} = ${id};`)
              }
              continue
            }
          }
          body.push(raw)
        }
        const safeBody = body.map(line => { const t = line.trimStart(); return (t.startsWith('[') || t.startsWith('(')) ? ' '.repeat(line.length - t.length) + ';' + t : line })
        const patchedBody = safeBody.map(l => l.replace(/document\.currentScript\.parentElement/g, '__ib_container'))
        const fnBody = header.join('\n') + (header.length > 0 ? '\n\n' : '') + patchedBody.join('\n')
        const fn = new Function('__ib_container', `(async function(__ib_container){\n${fnBody}\n}).call(this, arguments[0])`)
        fn(wrapper).catch((e: any) => console.error('[interactive]', e))
      } else {
        const s = document.createElement('script')
        s.textContent = rawCode
        s.dataset.ibDone = '1'
        wrapper.appendChild(s)
      }
      oldScript.remove()
    })

    return () => { running = false; container.innerHTML = '' }
  }, [html])

  if (preset) return null // already returned above

  return (
    <div className="my-6 rounded-xl border overflow-hidden" style={{ height, borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
