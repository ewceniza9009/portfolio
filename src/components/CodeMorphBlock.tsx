import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, RotateCcw } from 'lucide-react'

const HIGH_KEY = '__cm_shiki'
async function getHighlighter() {
  if ((window as any)[HIGH_KEY]) return (window as any)[HIGH_KEY] as Promise<any>
  const shiki = await import('shiki')
  const init = shiki.createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['javascript', 'typescript', 'csharp', 'css', 'html', 'json', 'sql', 'python', 'bash', 'markdown', 'yaml', 'text'],
  })
  ;(window as any)[HIGH_KEY] = init
  const h = await init
  return h
}

function detectLang(code: string): string {
  const t = code.trim()
  if (/\b(import|export|const|let|var|function|=>|async|await|require)\b/.test(t)) return 'javascript'
  if (/^(type|interface|enum)\s/.test(t) || /\b(interface|type|as)\b/.test(t)) return 'typescript'
  if (/\b(class|public|private|namespace|using|void|string|int|var|decimal|bool)\b/.test(t)) return 'csharp'
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE)\b/i.test(t)) return 'sql'
  if (/^\s*</.test(t) || /<(div|span|html|head|body)/i.test(t)) return 'html'
  if (t.startsWith('{') || t.startsWith('[')) return 'json'
  if (/^#/.test(t) || /\b(def|print|return)\b/.test(t)) return 'python'
  return 'text'
}

interface TokenItem {
  content: string
  offset: number
  color: string
  fontStyle: number
}

interface TokenRect {
  text: string
  rect: DOMRect
  color: string
  weight: string
  idx: number
}

interface AnimLayer {
  layer: HTMLElement
  wr: DOMRect
  pos: (r: DOMRect) => { left: number; top: number }
  add: (el: HTMLElement) => HTMLElement
  anims: Animation[]
}

interface CodeMorphBlockProps {
  code: string
  anim?: string
}

export type AnimMode = 'morph' | 'fade' | 'flip' | 'diff' | 'flight' | 'typewriter' | 'highlight' | 'scroll' | 'blur' | 'slide' | 'zoom' | 'glitch' | 'erase' | 'matrix' | 'explode'

const ANIM_MODES: { key: AnimMode; label: string; desc: string }[] = [
  { key: 'morph', label: 'Morph', desc: 'Tokens glide to new positions (HyperFrames)' },
  { key: 'fade', label: 'Fade', desc: 'Cross-fade between old and new' },
  { key: 'flip', label: 'Flip', desc: '3D card flip rotation' },
  { key: 'diff', label: 'Diff', desc: 'Line-level diff with collapse/expand' },
  { key: 'flight', label: 'Flight', desc: 'Lines fly in from left staggered' },
  { key: 'typewriter', label: 'Typewriter', desc: 'Per-character reveal with caret' },
  { key: 'highlight', label: 'Highlight', desc: 'Line highlight box, dim others' },
  { key: 'scroll', label: 'Scroll', desc: 'Scroll to target line + highlight' },
  { key: 'blur', label: 'Blur', desc: 'Cinematic out-of-focus crossfade' },
  { key: 'slide', label: 'Slide', desc: 'Carousel slide transition' },
  { key: 'zoom', label: 'Zoom', desc: 'Z-axis depth scaling' },
  { key: 'glitch', label: 'Glitch', desc: 'Cyberpunk neon scramble' },
  { key: 'erase', label: 'Erase', desc: 'Realistic backspace and re-type' },
  { key: 'matrix', label: 'Matrix', desc: 'Digital rain character cascade' },
  { key: 'explode', label: 'Explode', desc: 'Tokens scatter outwards' },
]

function ensureStyles() {
  if (typeof document === 'undefined') return
  const styleId = 'cm-block-styles'
  let style = document.getElementById(styleId) as HTMLStyleElement
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }
  style.innerHTML = `
    .cm-wrapper { position:relative;transition:height 0.35s ease-out;transform-origin:top; }
    .cm-tok { white-space: pre; display: inline; }
    .cm-line { display: block; white-space: pre; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; line-height: 1.6; }
    .cm-dropdown { position:absolute;top:100%;left:0;margin-top:4px;min-width:150px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:50;overflow:hidden; }
    .cm-dropdown button { display:flex;flex-direction:column;width:100%;text-align:left;padding:6px 10px;font-size:11px;border:none;background:none;cursor:pointer;color:var(--text-primary); }
    .cm-dropdown button:hover { background:rgba(255,255,255,0.08); }
    .cm-dropdown button.active { background:rgba(255,255,255,0.05); }
    .cm-dropdown button .lbl { font-size:11px;font-weight:600; }
    .cm-dropdown button.active .lbl { color:var(--accent); }
    .cm-dropdown button .dsc { font-size:9px;color:var(--text-muted);margin-top:1px; }
    .cm-diff-del { background:rgba(248,81,73,0.12); box-shadow:inset 3px 0 #f85149; }
    .cm-diff-add { background:rgba(63,185,80,0.12); box-shadow:inset 3px 0 #3fb950; }
    .cm-diff-sign { display:inline-block;width:32px;padding-left:16px;user-select:none; }
    .cm-diff-del .cm-diff-sign { color:#f85149; }
    .cm-diff-add .cm-diff-sign { color:#3fb950; }
    .cm-highlight-box { position:absolute;background:rgba(88,166,255,0.16);border-left:3px solid #58a6ff;border-radius:6px;pointer-events:none; }
    .cm-caret { position:absolute;width:2px;background:#58a6ff;border-radius:1px;pointer-events:none; }
    @keyframes cm-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes cm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  `
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildTokenHtml(tokens: TokenItem[][], fg: string): string {
  return tokens.map(line =>
    line.length === 0
      ? '<div class="cm-line"><br></div>'
      : `<div class="cm-line">${
          line.map(t => {
            const color = t.color || fg
            let style = `color:${color}`
            if (t.fontStyle & 1) style += ';font-style:italic'
            if (t.fontStyle & 2) style += ';font-weight:bold'
            return `<span class="cm-tok" style="${style}">${esc(t.content)}</span>`
          }).join('')
        }</div>`
  ).join('')
}

function measureTokens(wrapper: HTMLElement, html: string): TokenRect[] {
  wrapper.innerHTML = html
  void wrapper.offsetHeight
  return Array.from(wrapper.querySelectorAll('.cm-tok')).map((el, i) => {
    const h = el as HTMLElement
    return {
      text: h.textContent || '',
      rect: h.getBoundingClientRect(),
      color: getComputedStyle(h).color,
      weight: getComputedStyle(h).fontWeight,
      idx: i,
    }
  })
}

function matchByKey(from: TokenRect[], to: TokenRect[]) {
  const fromByText = new Map<string, TokenRect[]>()
  for (const f of from) {
    const arr = fromByText.get(f.text) || []
    arr.push(f)
    fromByText.set(f.text, arr)
  }
  const used = new Set<number>()
  const matched: Array<{ f: TokenRect; t: TokenRect }> = []
  const entering: TokenRect[] = []
  for (const t of to) {
    const arr = fromByText.get(t.text)
    if (arr) {
      const f = arr.find(c => !used.has(c.idx))
      if (f) { used.add(f.idx); matched.push({ f, t }); continue }
    }
    entering.push(t)
  }
  const leaving = from.filter(f => !used.has(f.idx))
  return { matched, leaving, entering }
}

function buildAnimLayer(wrapper: HTMLElement, anims: Animation[]): AnimLayer {
  wrapper.style.position = 'relative'
  const layer = document.createElement('div')
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:JetBrains Mono,Fira Code,Cascadia Code,Consolas,monospace;font-size:inherit;line-height:1.6;font-variant-ligatures:none'
  wrapper.appendChild(layer)
  const wr = wrapper.getBoundingClientRect()
  const pos = (r: DOMRect) => ({ left: r.left - wr.left, top: r.top - wr.top })
  const add = (el: HTMLElement) => { layer.appendChild(el); return el }
  return { layer, wr, pos, add, anims }
}

// ── HyperFrames-accurate animations ──

function animMorph(m: AnimLayer, matched: ReturnType<typeof matchByKey>) {
  // 1. Tokens glide between positions
  matched.matched.forEach(({ f, t }) => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:transform`
    const dx = t.rect.left - f.rect.left, dy = t.rect.top - f.rect.top
    m.anims.push(el.animate(
      [
        { transform: `translate3d(0,0,0)` },
        { transform: `translate3d(${dx}px,${dy}px,0)` },
      ],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
  
  // 2. Leavers fade out cleanly
  matched.leaving.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity`
    m.anims.push(el.animate(
      [
        { opacity: 1 }, 
        { opacity: 0 }
      ],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
  
  // 3. Enterers fade in cleanly
  matched.entering.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity`
    m.anims.push(el.animate(
      [
        { opacity: 0 }, 
        { opacity: 1 }
      ],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
}

function animFade(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 1 }, { opacity: 0, transform: 'translate3d(0,-8px,0)' }],
      { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 0, transform: 'translate3d(0,8px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
      { duration: 400, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'forwards', delay: 200 }
    ))
  })
}

function animFlip(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  const both = [...from, ...to]
  const l = Math.min(...both.map(r => r.rect.left)), t = Math.min(...both.map(r => r.rect.top))
  const r = Math.max(...both.map(r => r.rect.right)), b = Math.max(...both.map(r => r.rect.bottom))
  const fw = r - l + 40, fh = b - t + 40
  const cx = (l + r) / 2 - m.wr.left, cy = (t + b) / 2 - m.wr.top
  const card = m.add(Object.assign(document.createElement('div'), { className: 'cm-flip-card' }))
  card.style.cssText = `position:absolute;left:${cx - fw / 2}px;top:${cy - fh / 2}px;width:${fw}px;height:${fh}px;perspective:1400px`
  const inner = document.createElement('div')
  inner.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;will-change:transform'
  card.appendChild(inner)
  const front = document.createElement('div')
  front.style.cssText = 'position:absolute;inset:0;backface-visibility:hidden;background:var(--bg-primary);border-radius:8px'
  from.forEach(f => { const p = m.pos(f.rect); const s = Object.assign(document.createElement('span'), { textContent: f.text }); s.style.cssText = `position:absolute;left:${p.left - (cx - fw / 2)}px;top:${p.top - (cy - fh / 2)}px;color:${f.color};font-weight:${f.weight};white-space:pre`; front.appendChild(s) })
  inner.appendChild(front)
  const back = document.createElement('div')
  back.style.cssText = 'position:absolute;inset:0;backface-visibility:hidden;transform:rotateX(180deg);background:var(--bg-primary);border-radius:8px'
  to.forEach(t => { const p = m.pos(t.rect); const s = Object.assign(document.createElement('span'), { textContent: t.text }); s.style.cssText = `position:absolute;left:${p.left - (cx - fw / 2)}px;top:${p.top - (cy - fh / 2)}px;color:${t.color};font-weight:${t.weight};white-space:pre`; back.appendChild(s) })
  inner.appendChild(back)
  m.anims.push(inner.animate(
    [
      { transform: 'rotateX(0deg) scale(1)' },
      { transform: 'rotateX(90deg) scale(0.92)', offset: 0.5 },
      { transform: 'rotateX(180deg) scale(1)' }
    ],
    { duration: 800, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
  ))
}

interface DiffOp {
  type: 'same' | 'del' | 'add'
  text: string
}

function lineDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length, m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops: DiffOp[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: 'same', text: b[j] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'del', text: a[i] }); i++ }
    else { ops.push({ type: 'add', text: b[j] }); j++ }
  }
  while (i < n) ops.push({ type: 'del', text: a[i++] })
  while (j < m) ops.push({ type: 'add', text: b[j++] })
  return ops
}

function animDiff(m: AnimLayer, _from: TokenRect[], _to: TokenRect[], fromHtml: string, toHtml: string, wrapper: HTMLElement, _cb: () => void) {
  // We use the already-rendered content in wrapper to get lines
  // Actually we reconstruct from html strings
  const fromLines = fromHtml.match(/<div class="cm-line">.*?<\/div>/g) || []
  const toLines = toHtml.match(/<div class="cm-line">.*?<\/div>/g) || []
  const lineText = (h: string) => h.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  const lineInner = (h: string) => h.replace(/^<div class="cm-line">/, '').replace(/<\/div>$/, '')

  const ops = lineDiff(fromLines.map(lineText), toLines.map(lineText))
  const lineH = 26

  wrapper.innerHTML = ''
  const delEls: HTMLElement[] = []
  const addEls: HTMLElement[] = []
  const allEls: HTMLElement[] = []
  let fi = 0, ti = 0

  ops.forEach(op => {
    const ln = document.createElement('div')
    ln.className = 'cm-line' + (op.type === 'del' ? ' cm-diff-del' : op.type === 'add' ? ' cm-diff-add' : '')
    const sign = document.createElement('span')
    sign.className = 'cm-diff-sign'
    sign.textContent = op.type === 'del' ? '- ' : op.type === 'add' ? '+ ' : '  '
    ln.appendChild(sign)

    let innerHtml = ''
    if (op.type === 'del') { innerHtml = fromLines[fi] ? lineInner(fromLines[fi]) : ''; fi++ }
    else if (op.type === 'add') { innerHtml = toLines[ti] ? lineInner(toLines[ti]) : ''; ti++ }
    else { innerHtml = toLines[ti] ? lineInner(toLines[ti]) : ''; fi++; ti++ }

    const inner = document.createElement('span')
    inner.innerHTML = innerHtml
    ln.appendChild(inner)
    wrapper.appendChild(ln)
    allEls.push(ln)
    if (op.type === 'del') { delEls.push(ln); ln.style.overflow = 'hidden' }
    else if (op.type === 'add') { addEls.push(ln); ln.style.overflow = 'hidden' }
  })

  void wrapper.offsetHeight
  const totalHeight = wrapper.scrollHeight
  wrapper.style.minHeight = `${totalHeight}px`
  wrapper.innerHTML = ''

  // Re-render same + full-height del/add initially
  allEls.forEach(el => wrapper.appendChild(el))
  void wrapper.offsetHeight

  const addH = addEls.map(el => el.scrollHeight || lineH)

  // Fade in del lines (do not collapse height so they stay visible as a diff)
  delEls.forEach((el, i) => {
    el.style.opacity = '0'
    m.anims.push(el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 300, easing: 'ease-in', fill: 'forwards', delay: i * 60 }
    ))
  })

  // Expand add lines
  addEls.forEach((el, i) => {
    const h = addH[i]
    el.style.height = '0px'
    el.style.opacity = '0'
    m.anims.push(el.animate(
      [{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }],
      { duration: 350, easing: 'ease-out', fill: 'forwards', delay: 350 + i * 80 }
    ))
  })
}

function animFlight(m: AnimLayer, _from: TokenRect[], _to: TokenRect[], fromHtml: string, toHtml: string, wrapper: HTMLElement) {
  const fromLines = fromHtml.match(/<div class="cm-line">.*?<\/div>/g) || []
  const toLines = toHtml.match(/<div class="cm-line">.*?<\/div>/g) || []
  wrapper.innerHTML = ''
  
  const oldBlocks: HTMLElement[] = []
  const newBlocks: HTMLElement[] = []

  fromLines.forEach(h => {
    const blk = document.createElement('div')
    blk.style.cssText = 'position:absolute;white-space:pre;border-radius:8px;padding:4px 10px;background:var(--bg-card);border:1px solid var(--border);font-size:inherit;line-height:1.6;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,0.1)'
    blk.innerHTML = h
    wrapper.appendChild(blk)
    oldBlocks.push(blk)
  })

  toLines.forEach(h => {
    const blk = document.createElement('div')
    blk.style.cssText = 'position:absolute;white-space:pre;border-radius:8px;padding:4px 10px;background:var(--bg-card);border:1px solid var(--border);font-size:inherit;line-height:1.6;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,0.1);opacity:0'
    blk.innerHTML = h
    wrapper.appendChild(blk)
    newBlocks.push(blk)
  })

  void wrapper.offsetHeight
  let maxW = 0
  ;[...oldBlocks, ...newBlocks].forEach(b => { const r = b.getBoundingClientRect(); if (r.width > maxW) maxW = r.width })
  ;[...oldBlocks, ...newBlocks].forEach(b => { b.style.width = maxW + 'px' })
  void wrapper.offsetHeight

  const GAP = 8
  const lineH = parseInt(getComputedStyle(wrapper).lineHeight) || 26
  const n = Math.max(oldBlocks.length, newBlocks.length)
  const stackH = n * lineH + (n - 1) * GAP + 16
  
  // Instantly lock height to prevent resizing during animation
  wrapper.style.height = `${stackH}px`
  wrapper.style.position = 'relative'

  // Position all blocks statically within relative wrapper before flying
  oldBlocks.forEach((blk, i) => { blk.style.top = `${i * (lineH + GAP) + 8}px` })
  newBlocks.forEach((blk, i) => { blk.style.top = `${i * (lineH + GAP) + 8}px` })

  const flyDist = maxW + 100

  // Fly out old from right
  oldBlocks.forEach((blk, i) => {
    m.anims.push(blk.animate(
      [
        { transform: 'translate3d(0,0,0)', opacity: 1 },
        { transform: `translate3d(${flyDist}px,0,0)`, opacity: 0 },
      ],
      { duration: 400, easing: 'cubic-bezier(0.36, 0, 0.66, -0.56)', fill: 'forwards', delay: i * 50 }
    ))
  })

  // Fly in new from left
  newBlocks.forEach((blk, i) => {
    m.anims.push(blk.animate(
      [
        { transform: `translate3d(-${flyDist}px,0,0)`, opacity: 0 },
        { transform: 'translate3d(0,0,0)', opacity: 1 },
      ],
      { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards', delay: 300 + i * 50 }
    ))
  })
}

function animTypewriter(m: AnimLayer, from: TokenRect[], _to: TokenRect[], toHtml: string, wrapper: HTMLElement) {
  // Render to HTML with per-character tokens
  const toHtmlChar = toHtml.replace(/<span class="cm-tok"[^>]*>([^<]+)<\/span>/g, (_, txt) =>
    [...txt].map(ch =>
      ch === ' ' ? '<span class="cm-tok">&nbsp;</span>'
        : `<span class="cm-tok">${esc(ch)}</span>`
    ).join('')
  )
  wrapper.innerHTML = toHtmlChar
  void wrapper.offsetHeight

  const wr = wrapper.getBoundingClientRect()
  const charEls = Array.from(wrapper.querySelectorAll('.cm-tok')) as HTMLElement[]

  // Hide all chars initially
  charEls.forEach(el => { el.style.opacity = '0' })

  // Create blinking caret
  const caret = document.createElement('div')
  caret.className = 'cm-caret'
  caret.style.animation = 'cm-blink 0.8s step-end infinite'
  const firstRect = charEls[0]?.getBoundingClientRect()
  if (firstRect) {
    caret.style.cssText += `;left:${firstRect.left - wr.left}px;top:${firstRect.top - wr.top}px;height:${firstRect.height}px`
  }
  m.layer.appendChild(caret)

  // Reveal chars sequentially with human-like variable speed
  let currentDelay = 0
  charEls.forEach((el, i) => {
    const isSpace = el.textContent === ' ' || el.textContent === '\u00A0'
    const isPunctuation = /[,.;(){}\[\]]/.test(el.textContent || '')
    // Variable timing: spaces are fast, punctuation pauses slightly, others vary
    const charDelay = isSpace ? 10 : isPunctuation ? 80 + Math.random() * 50 : 20 + Math.random() * 40
    
    m.anims.push(el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 10, easing: 'ease-out', fill: 'forwards', delay: currentDelay }
    ))

    // Animate caret to the right of the current char
    const r = el.getBoundingClientRect()
    const x = r.right - wr.left
    const y = r.top - wr.top
    const isLast = i === charEls.length - 1
    m.anims.push(caret.animate(
      [{ left: `${x}px`, top: `${y}px` }],
      { duration: isLast ? 1 : charDelay, easing: 'steps(1)', fill: 'forwards', delay: currentDelay }
    ))

    currentDelay += charDelay
  })

  // Fade out "from" content gracefully
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre`
    m.anims.push(el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 200, easing: 'ease-in-out', fill: 'forwards' }
    ))
  })
}

function animHighlight(m: AnimLayer, toHtml: string, wrapper: HTMLElement, targetIdxRaw: number | null) {
  wrapper.innerHTML = toHtml
  void wrapper.offsetHeight

  const lines = wrapper.querySelectorAll('.cm-line')
  if (!lines.length) return

  // Default to middle line if not specified, bounded to array
  let targetIdx = targetIdxRaw !== null ? targetIdxRaw - 1 : Math.floor(lines.length / 2)
  targetIdx = Math.max(0, Math.min(targetIdx, lines.length - 1))
  
  const targetLine = lines[targetIdx] as HTMLElement
  const lr = targetLine.getBoundingClientRect()
  const wr = wrapper.getBoundingClientRect()

  // Highlight box
  const box = document.createElement('div')
  box.className = 'cm-highlight-box'
  box.style.left = `${lr.left - wr.left - 8}px`
  box.style.top = `${lr.top - wr.top - 2}px`
  box.style.width = '0px'
  box.style.height = `${lr.height + 4}px`
  box.style.opacity = '0'
  box.style.animation = 'cm-pulse 2.5s ease-in-out infinite alternate'
  box.style.animationDelay = '0.7s'
  wrapper.insertBefore(box, wrapper.firstChild)

  // Dim other lines
  const otherLines = Array.from(lines).filter((_, i) => i !== targetIdx)
  otherLines.forEach((el, i) => {
    m.anims.push((el as HTMLElement).animate(
      [{ opacity: 1 }, { opacity: 0.35 }],
      { duration: 400, easing: 'ease-out', fill: 'forwards', delay: i * 30 }
    ))
  })

  // Expand highlight box
  m.anims.push(box.animate(
    [{ width: '0px', opacity: '0' }, { width: `${lr.width + 18}px`, opacity: '1' }],
    { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards', delay: 200 }
  ))
}

function animScroll(m: AnimLayer, toHtml: string, wrapper: HTMLElement, targetIdxRaw: number | null) {
  wrapper.innerHTML = toHtml
  void wrapper.offsetHeight

  const lines = wrapper.querySelectorAll('.cm-line')
  if (!lines.length) return

  // Default to middle line if not specified, bounded to array
  let targetIdx = targetIdxRaw !== null ? targetIdxRaw - 1 : Math.floor(lines.length / 2)
  targetIdx = Math.max(0, Math.min(targetIdx, lines.length - 1))
  
  const targetLine = lines[targetIdx] as HTMLElement
  const lr = targetLine.getBoundingClientRect()
  const wr = wrapper.getBoundingClientRect()
  const surfRect = wrapper.parentElement?.getBoundingClientRect() || wr

  // Center target line
  const lineCenter = lr.top + lr.height / 2 - surfRect.top
  const dy = surfRect.height * 0.4 - lineCenter

  // Highlight box
  const box = document.createElement('div')
  box.className = 'cm-highlight-box'
  box.style.left = `${targetLine.offsetLeft - 8}px`
  box.style.top = `${targetLine.offsetTop - 2}px`
  box.style.width = `${lr.width + 18}px`
  box.style.height = `${lr.height + 4}px`
  box.style.opacity = '0'
  box.style.animation = 'cm-pulse 2.5s ease-in-out infinite alternate'
  box.style.animationDelay = '0.85s'
  wrapper.insertBefore(box, wrapper.firstChild)

  // Dim others
  const otherLines = Array.from(lines).filter((_, i) => i !== targetIdx)
  otherLines.forEach((el, i) => {
    m.anims.push((el as HTMLElement).animate(
      [{ opacity: 1 }, { opacity: 0.35 }],
      { duration: 350, easing: 'ease-out', fill: 'forwards', delay: 500 + i * 30 }
    ))
  })

  // Scroll wrapper
  m.anims.push(wrapper.animate(
    [{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }],
    { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
  ))

  // Show box
  m.anims.push(box.animate(
    [{ opacity: '0' }, { opacity: '1' }],
    { duration: 300, easing: 'ease-out', fill: 'forwards', delay: 550 }
  ))
}

type AnimFn = (m: AnimLayer, ...args: any[]) => void

function animBlur(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,filter`
    m.anims.push(el.animate(
      [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)' }],
      { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,filter`
    m.anims.push(el.animate(
      [{ opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)' }],
      { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
    ))
  })
}

function animSlide(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 1, transform: 'translate3d(0,0,0)' }, { opacity: 0, transform: 'translate3d(-50px,0,0)' }],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 0, transform: 'translate3d(50px,0,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
}

function animZoom(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform;transform-origin:center`
    m.anims.push(el.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.8)' }],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform;transform-origin:center`
    m.anims.push(el.animate(
      [{ opacity: 0, transform: 'scale(1.2)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
}

function animGlitch(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [
        { opacity: 1, transform: 'translate(0)' },
        { opacity: 0.8, transform: 'translate(-2px, 1px)', color: '#0ff' },
        { opacity: 0.9, transform: 'translate(2px, -1px)', color: '#f0f' },
        { opacity: 0.5, transform: 'translate(-1px, 2px)', color: '#f0f' },
        { opacity: 0, transform: 'translate(1px, -2px)' }
      ],
      { duration: 300, easing: 'steps(4, end)', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [
        { opacity: 0, transform: 'translate(-2px, 2px)', color: '#0ff' },
        { opacity: 0.8, transform: 'translate(2px, -2px)', color: '#f0f' },
        { opacity: 0.5, transform: 'translate(-1px, 1px)', color: '#0ff' },
        { opacity: 0.9, transform: 'translate(1px, -1px)' },
        { opacity: 1, transform: 'translate(0)', color: t.color }
      ],
      { duration: 300, easing: 'steps(4, end)', fill: 'forwards', delay: 200 }
    ))
  })
}

function animErase(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  const maxDelayFrom = from.length * 5
  from.reverse().forEach((f, i) => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;`
    m.anims.push(el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 1, delay: i * 5, fill: 'forwards' }
    ))
  })
  to.forEach((t, i) => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;opacity:0`
    m.anims.push(el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 1, delay: maxDelayFrom + 100 + (i * 5), fill: 'forwards' }
    ))
  })
}

function animMatrix(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f, i) => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:#0f0;font-weight:${f.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(20px)' }],
      { duration: 300, easing: 'ease-in', fill: 'forwards', delay: i * 3 }
    ))
  })
  to.forEach((t, i) => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:#0f0;font-weight:${t.weight};white-space:pre;will-change:opacity,transform`
    m.anims.push(el.animate(
      [{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'translateY(0)', color: t.color }],
      { duration: 300, easing: 'ease-out', fill: 'forwards', delay: i * 3 + 200 }
    ))
  })
}

function animExplode(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach(f => {
    const fp = m.pos(f.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: f.text }))
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`
    const angle = Math.random() * Math.PI * 2
    const dist = 50 + Math.random() * 100
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    m.anims.push(el.animate(
      [
        { opacity: 1, transform: 'translate3d(0,0,0) rotate(0deg)' }, 
        { opacity: 0, transform: `translate3d(${dx}px,${dy}px,0) rotate(${(Math.random()-0.5)*180}deg)` }
      ],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
  to.forEach(t => {
    const tp = m.pos(t.rect)
    const el = m.add(Object.assign(document.createElement('span'), { textContent: t.text }))
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`
    const angle = Math.random() * Math.PI * 2
    const dist = 50 + Math.random() * 100
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    m.anims.push(el.animate(
      [
        { opacity: 0, transform: `translate3d(${dx}px,${dy}px,0) rotate(${(Math.random()-0.5)*180}deg)` }, 
        { opacity: 1, transform: 'translate3d(0,0,0) rotate(0deg)' }
      ],
      { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ))
  })
}

const ANIM_FNS: Record<AnimMode, AnimFn> = {
  morph: animMorph,
  fade: animFade,
  flip: animFlip,
  diff: animDiff,
  flight: animFlight,
  typewriter: animTypewriter,
  highlight: animHighlight,
  scroll: animScroll,
  blur: animBlur,
  slide: animSlide,
  zoom: animZoom,
  glitch: animGlitch,
  erase: animErase,
  matrix: animMatrix,
  explode: animExplode,
}

export default function CodeMorphBlock({ code, anim: initialAnim }: CodeMorphBlockProps) {
  const parts = code.split(/^---$/m)
  const beforeCode = parts[0]?.trim() || ''
  const afterCode = parts[1]?.trim() || ''
  const lang = detectLang(beforeCode || afterCode)
  const validMode = (m: string): AnimMode => ANIM_MODES.some(a => a.key === m) ? m as AnimMode : 'morph'
  
  // Parse mode and potential target (e.g., highlight:3)
  const animParts = (initialAnim || 'morph').split(':')
  const baseModeStr = animParts[0].trim()
  const parsedTarget = parseInt(animParts[1]?.trim() || '', 10)
  
  const [animMode, setAnimMode] = useState<AnimMode>(validMode(baseModeStr))
  const animTargetIdx = isNaN(parsedTarget) ? null : parsedTarget
  
  const [morphed, setMorphed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [beforeHtml, setBeforeHtml] = useState('')
  const [afterHtml, setAfterHtml] = useState('')
  const [morphing, setMorphing] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') === 'light' ? 'github-light' : 'github-dark')

  useEffect(() => {
    ensureStyles()
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'github-light' : 'github-dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      document.removeEventListener('mousedown', handler)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const shiki = await getHighlighter()
        const beforeData = shiki.codeToTokens(beforeCode, { lang, theme })
        const afterData = shiki.codeToTokens(afterCode, { lang, theme })
        if (!cancelled) {
          const b = buildTokenHtml(beforeData.tokens, beforeData.fg)
          const a = buildTokenHtml(afterData.tokens, afterData.fg)
          setBeforeHtml(b)
          setAfterHtml(a)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          const fb = `<span style="color:var(--text-secondary)">${e(beforeCode)}</span>`
          setBeforeHtml(fb)
          setAfterHtml(`<span style="color:var(--text-secondary)">${e(afterCode)}</span>`)
          setLoading(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [beforeCode, afterCode, lang, theme])

  // Sync beforeHtml to stage div (initial / theme change)
  useEffect(() => {
    if (!loading && beforeHtml && stageRef.current) {
      stageRef.current.innerHTML = beforeHtml
    }
  }, [beforeHtml, loading])

  const runMorph = useCallback(async (fromHtml: string, toHtml: string, forward: boolean) => {
    if (!stageRef.current || morphing) return
    const wrapper = stageRef.current
    setMorphing(true)
    try {
      // 1. Accurately measure heights first
      wrapper.style.height = ''
      wrapper.innerHTML = fromHtml
      void wrapper.offsetHeight
      const h1 = wrapper.scrollHeight
      
      wrapper.innerHTML = toHtml
      void wrapper.offsetHeight
      const h2 = wrapper.scrollHeight
      
      // 2. Lock height to max to prevent page scroll/layout shift during measurements and animation
      const maxH = Math.max(h1, h2)
      wrapper.style.height = `${maxH}px`
      
      const from = measureTokens(wrapper, fromHtml)
      const to = measureTokens(wrapper, toHtml)
      
      const matched = matchByKey(from, to)
      wrapper.innerHTML = ''
      const m = buildAnimLayer(wrapper, [])
      
      // 3. Keep height locked at maxH during animation for stability, except for flight/diff which handle their own layout
      if (animMode === 'diff' || animMode === 'flight') {
        wrapper.style.height = ''
      }

      const fn = ANIM_FNS[animMode]
      if (animMode === 'diff') {
        (fn as Function)(m, from, to, fromHtml, toHtml, wrapper, () => {})
      } else if (animMode === 'flight') {
        (fn as Function)(m, from, to, fromHtml, toHtml, wrapper)
      } else if (animMode === 'highlight' || animMode === 'scroll') {
        (fn as Function)(m, toHtml, wrapper, animTargetIdx)
      } else if (animMode === 'typewriter') {
        (fn as Function)(m, from, to, toHtml, wrapper)
      } else if (animMode === 'morph') {
        (fn as Function)(m, matched)
      } else {
        (fn as Function)(m, from, to)
      }

      await Promise.all(m.anims.map(a => a.finished.catch(() => {})))
      wrapper.style.position = ''
      wrapper.style.height = ''
      wrapper.style.minHeight = ''
      
      const keepStructure = ['diff', 'highlight', 'scroll'].includes(animMode)
      if (!keepStructure) {
        wrapper.innerHTML = toHtml
      }

      if (['diff', 'flight', 'typewriter', 'highlight', 'scroll'].includes(animMode)) {
        wrapper.querySelectorAll('.cm-tok').forEach((el) => { (el as HTMLElement).style.opacity = '1' })
      }
      if (forward) setMorphed(true); else setMorphed(false)
    } finally {
      setMorphing(false)
    }
  }, [animMode, morphing])

  const handleMorph = useCallback(() => runMorph(beforeHtml, afterHtml, true), [runMorph, beforeHtml, afterHtml])
  const handleReset = useCallback(() => runMorph(afterHtml, beforeHtml, false), [runMorph, afterHtml, beforeHtml])

  if (loading) {
    return (
      <div className="my-6 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>Code Anim</span>
        </div>
        <div className="p-4 text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="my-6 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>Code Anim</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-1"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {animMode}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {dropdownOpen && (
              <div className="cm-dropdown">
                {ANIM_MODES.map(m => (
                  <button
                    key={m.key}
                    className={m.key === animMode ? 'active' : ''}
                    onClick={() => { setAnimMode(m.key); setDropdownOpen(false) }}
                  >
                    <span className="lbl">{m.label}</span>
                    <span className="dsc">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={morphed ? handleReset : handleMorph}
          disabled={morphing}
          className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold disabled:opacity-40"
          style={{ color: 'var(--text-secondary)' }}
        >
          {morphing ? (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>...</span>
          ) : morphed ? (
            <><RotateCcw size={13} /><span className="hidden sm:inline ml-1">Reset</span></>
          ) : (
            <><Play size={13} /><span className="hidden sm:inline ml-1">Play</span></>
          )}
        </button>
      </div>
      <div ref={containerRef} className="text-sm leading-relaxed overflow-x-auto overflow-y-hidden" style={{ fontVariantLigatures: 'none' }}>
        <div ref={stageRef} data-cm="stage" className="p-4" />
      </div>
    </div>
  )
}
