import React, { useState, useEffect, useRef } from 'react'
import { ACCENT_THEMES, AccentKey } from '../data/accents'
import { Copy, Check, Maximize2, X, Download, Minus, Plus, RotateCcw } from 'lucide-react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })

interface MermaidRendererProps {
  code: string
  theme?: 'dark' | 'light'
  accent?: AccentKey
}

function MermaidRenderer({ code, theme = 'dark', accent = 'gold' }: MermaidRendererProps) {
  const [svgHtml, setSvgHtml] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showCode, setShowCode] = useState(false)

  // Interactive zoom & pan states
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const renderId = useRef(0)
  const svgRef = useRef<HTMLDivElement>(null)

  // Auto-fit diagram to viewport after render
  useEffect(() => {
    if (!svgHtml || hasError) return
    const el = svgRef.current
    if (!el) return
    const svg = el.querySelector('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const containerW = el.closest('.cursor-grab')?.clientWidth || 800
    const containerH = el.closest('.cursor-grab')?.clientHeight || 360
    const padX = 48
    const padY = 48
    const fitW = (containerW - padX) / rect.width
    const fitH = (containerH - padY) / rect.height
    const fit = Math.min(fitW, fitH, 1)
    setScale(Math.round(fit * 100) / 100)
    setPosition({ x: 0, y: 0 })
  }, [svgHtml, hasError])

  const cleanCode = code.trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')

  // Resolve active theme colors
  const accentColors = ACCENT_THEMES[accent]?.[theme] || ACCENT_THEMES.gold[theme]
  const primaryColor = accentColors.accent
  const secondaryColor = accentColors.accentSecondary
  const isDark = theme === 'dark'

  // Build Mermaid config matching the previously embedded init syntax
  const mermaidConfig = {
    theme: (isDark ? 'dark' : 'neutral') as 'dark' | 'neutral',
    themeVariables: {
      fontFamily: 'Outfit, Inter, system-ui, -apple-system, sans-serif',
      primaryColor: isDark ? '#1e293b' : '#f1f5f9',
      primaryTextColor: isDark ? '#f8fafc' : '#0f172a',
      lineColor: isDark ? '#475569' : '#94a3b8',
      mainBkg: isDark ? '#0d1117' : '#ffffff',
      actorBkg: isDark ? '#1e293b' : '#f8fafc',
      actorTextColor: isDark ? '#f8fafc' : '#0f172a',
      actorLineColor: primaryColor,
      signalColor: secondaryColor,
      signalTextColor: isDark ? '#cbd5e1' : '#475569',
      labelBoxBkgColor: isDark ? '#1e293b' : '#f1f5f9',
      labelBoxBorderColor: primaryColor,
      labelTextColor: isDark ? '#f8fafc' : '#0f172a',
      loopLimitColor: primaryColor,
      loopLimitTextColor: isDark ? '#cbd5e1' : '#475569',
      noteBkgColor: isDark ? '#1e293b' : '#fef08a',
      noteTextColor: isDark ? '#f8fafc' : '#0f172a',
      noteBorderColor: primaryColor,
    },
    sequence: {
      actorMargin: 85,
      messageMargin: 45,
      boxMargin: 15,
      noteMargin: 15,
      messageFontSize: 11,
      actorFontSize: 11,
      noteFontSize: 11,
      actorFontFamily: 'Outfit, Inter, system-ui, sans-serif',
      noteFontFamily: 'Outfit, Inter, system-ui, sans-serif',
      messageFontFamily: 'Outfit, Inter, system-ui, sans-serif',
    },
  }

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setHasError(false)
    setSvgHtml('')

    const id = `mermaid-${renderId.current++}-${Date.now()}`

    async function render() {
      try {
        mermaid.initialize(mermaidConfig)
        const { svg } = await mermaid.render(id, cleanCode)
        if (active) {
          setSvgHtml(svg)
          setIsLoading(false)
        }
      } catch (e) {
        console.warn('[Mermaid] render error:', e)
        if (active) {
          setHasError(true)
          setIsLoading(false)
        }
      }
    }

    render()

    return () => { active = false }
  }, [cleanCode, theme, accent, primaryColor, secondaryColor])

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.15))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.4, prev - 0.15))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Modal full-screen viewer state
  const [showModal, setShowModal] = useState(false)
  const [modalScale, setModalScale] = useState(1.5)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [modalIsDragging, setModalIsDragging] = useState(false)
  const [modalDragStart, setModalDragStart] = useState({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  const handleOpenModal = () => {
    setModalScale(1.5)
    setModalPosition({ x: 0, y: 0 })
    setShowModal(true)
    document.body.style.overflow = 'hidden'
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalPosition({ x: 0, y: 0 })
    document.body.style.overflow = ''
  }

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  const handleModalZoomIn = () => {
    setModalScale(prev => Math.min(5, prev + 0.3))
  }

  const handleModalZoomOut = () => {
    setModalScale(prev => Math.max(0.3, prev - 0.3))
  }

  const handleModalReset = () => {
    setModalScale(1.5)
    setModalPosition({ x: 0, y: 0 })
  }

  const handleDownloadSvg = () => {
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Modal mouse/touch drag
  const handleModalMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setModalIsDragging(true)
    setModalDragStart({ x: e.clientX - modalPosition.x, y: e.clientY - modalPosition.y })
  }

  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (!modalIsDragging) return
    setModalPosition({ x: e.clientX - modalDragStart.x, y: e.clientY - modalDragStart.y })
  }

  const handleModalMouseUp = () => {
    setModalIsDragging(false)
  }

  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setModalIsDragging(true)
    const t = e.touches[0]
    setModalDragStart({ x: t.clientX - modalPosition.x, y: t.clientY - modalPosition.y })
  }

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (!modalIsDragging || e.touches.length !== 1) return
    const t = e.touches[0]
    setModalPosition({ x: t.clientX - modalDragStart.x, y: t.clientY - modalDragStart.y })
  }

  return (
    <div className="my-8 flex flex-col space-y-3 w-full">
      <style>{`
        .mermaid-svg-container svg {
          width: 100% !important;
          max-width: 900px !important;
          height: auto !important;
        }
        .mermaid-svg-container svg path {
          stroke: var(--text-muted) !important;
        }
        .mermaid-svg-container svg .node rect,
        .mermaid-svg-container svg .node circle,
        .mermaid-svg-container svg .node path,
        .mermaid-svg-container svg .node polygon,
        .mermaid-svg-container svg .mindmap-node rect,
        .mermaid-svg-container svg .mindmap-node circle,
        .mermaid-svg-container svg .mindmap-node path,
        .mermaid-svg-container svg .mindmap-node polygon {
          fill: var(--bg-card) !important;
          stroke: var(--accent) !important;
          stroke-width: 1.5px !important;
        }
        .mermaid-svg-container svg .node text,
        .mermaid-svg-container svg .node tspan,
        .mermaid-svg-container svg .mindmap-node text,
        .mermaid-svg-container svg .mindmap-node tspan {
          fill: var(--text-primary) !important;
          color: var(--text-primary) !important;
        }
        .mermaid-svg-container svg .node foreignObject *,
        .mermaid-svg-container svg .mindmap-node foreignObject * {
          color: var(--text-primary) !important;
        }
      `}</style>

      {/* Interactive Sandbox Container */}
      <div 
        className="w-full relative rounded-3xl border glass bg-white/5 overflow-hidden flex flex-col select-none" 
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Floating Controls HUD */}
        <div 
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border glass text-xs font-mono backdrop-blur-md shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--glass-bg)' }}
        >
          {/* Zoom Out Button */}
          <button 
            onClick={handleZoomOut} 
            title="Zoom Out" 
            className="p-1 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          
          {/* Zoom Level Indicator */}
          <span className="px-1 text-[10px] font-bold text-[var(--text-secondary)] w-10 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          
          {/* Zoom In Button */}
          <button 
            onClick={handleZoomIn} 
            title="Zoom In" 
            className="p-1 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          
          <div className="w-[1px] h-3 bg-white/10 mx-1" />
          
          {/* Reset Zoom & Pan */}
          <button 
            onClick={handleReset} 
            title="Reset Position" 
            className="p-1 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          </button>
          
          <div className="w-[1px] h-3 bg-white/10 mx-1" />
          
          {/* Toggle Raw Code Block */}
          <button 
            onClick={() => setShowCode(!showCode)} 
            title="Show Code" 
            className="p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
            style={{ color: showCode ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </button>

          <div className="w-[1px] h-3 bg-white/10 mx-1" />

          {/* Expand to Fullscreen Modal */}
          <button
            onClick={handleOpenModal}
            title="Fullscreen View"
            disabled={!svgHtml}
            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Maximize2 size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Floating User Guidelines */}
        <div 
          className="absolute bottom-4 left-4 z-20 pointer-events-none opacity-50 text-[9px] font-mono tracking-wider uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          Drag to Pan • Zoom with +/- Buttons
        </div>

        {/* Viewport Frame */}
        <div 
          className="w-full h-[360px] md:h-[420px] overflow-auto flex items-start justify-center p-6 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--bg-primary)' }}>
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
            </div>
          )}
          {hasError || !svgHtml ? (
            <pre 
              className="w-full h-full overflow-auto text-xs font-mono select-text p-4 m-0" 
              style={{ 
                background: '#0d1117', 
                color: '#c9d1d9' 
              }}
            >
              <code>{cleanCode}</code>
            </pre>
          ) : (
            <div 
              ref={svgRef}
              className="w-full flex justify-center mermaid-svg-container"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      </div>

      {/* Dynamic Code Drawer */}
      {showCode && (
        <pre 
          className="border rounded-xl p-4 overflow-x-auto text-xs font-mono select-text" 
          style={{ 
            background: '#0d1117', 
            color: '#c9d1d9', 
            borderColor: 'rgba(255, 255, 255, 0.15)' 
          }}
        >
          <code>{cleanCode}</code>
        </pre>
      )}

      {/* Fullscreen Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: isDark ? '#0a0a0f' : '#ffffff', overflow: 'hidden' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 shrink-0 select-none"
            style={{
              background: isDark ? '#1a1a2e' : '#f1f5f9',
              borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
            }}
          >
            <span className="text-xs font-mono tracking-wider uppercase font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              Diagram Viewer
            </span>
            <div className="flex items-center gap-1">
              <button onClick={handleModalZoomOut} title="Zoom Out" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <Minus size={15} />
              </button>
              <span className="text-xs font-mono w-10 text-center font-medium" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                {Math.round(modalScale * 100)}%
              </span>
              <button onClick={handleModalZoomIn} title="Zoom In" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <Plus size={15} />
              </button>
              <div className="w-px h-5 mx-1.5" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <button onClick={handleModalReset} title="Reset View" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <RotateCcw size={15} />
              </button>
              <button onClick={handleDownloadSvg} title="Download SVG" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <Download size={15} />
              </button>
              <div className="w-px h-5 mx-1.5" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <button onClick={handleCloseModal} title="Close" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-red-500/15" style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <X size={17} />
              </button>
            </div>
          </div>
          <div
            ref={modalRef}
            className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ background: isDark ? '#0a0a0f' : '#f8fafc' }}
            onMouseDown={handleModalMouseDown}
            onMouseMove={handleModalMouseMove}
            onMouseUp={handleModalMouseUp}
            onMouseLeave={handleModalMouseUp}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleModalMouseUp}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px) scale(${modalScale})` }}
            >
              <div
                className="mermaid-svg-container"
                style={{ maxWidth: 'none', width: 'auto' }}
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CodeBlockProps {
  code: string
  lang: string
  highlightedHtml: string
}

function CodeBlock({ code, lang, highlightedHtml }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Failed to copy code: ', err)
    }
  }

  return (
    <div className="relative group my-6 rounded-2xl overflow-hidden border select-text" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
      {/* Header bar / Lang badge */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#161b22] text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none border-b border-white/5">
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors hover:bg-white/10 hover:text-white"
          style={{ color: copied ? 'var(--accent)' : 'inherit' }}
        >
          {copied ? (
            <>
              <Check size={11} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre 
        className="p-5 overflow-x-auto text-xs font-mono select-text" 
        style={{ 
          background: '#0d1117', 
          color: '#c9d1d9', 
          margin: 0
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  )
}

function highlightCode(code: string, lang: string): string {
  const l = lang ? lang.toLowerCase() : ''
  
  // Escape HTML entities to prevent rendering tags
  let text = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const comments: string[] = []
  const strings: string[] = []

  // 1. Mask and highlight comments
  text = text.replace(/(\/\/.*)$/gm, (match) => {
    const idx = comments.length
    comments.push(`<span style="color: #6a9955; font-style: italic;">${match}</span>`)
    return `__COMMENT_TOKEN_${idx}__`
  })

  // 2. Mask and highlight strings
  text = text.replace(/("(?:\\.|[^"\\])*")/g, (match) => {
    const idx = strings.length
    strings.push(`<span style="color: #ce9178;">${match}</span>`)
    return `__STRING_TOKEN_${idx}__`
  })
  text = text.replace(/('(?:\\.|[^'\\])*')/g, (match) => {
    const idx = strings.length
    strings.push(`<span style="color: #ce9178;">${match}</span>`)
    return `__STRING_TOKEN_${idx}__`
  })
  text = text.replace(/(`(?:\\.|[^`\\])*`)/g, (match) => {
    const idx = strings.length
    strings.push(`<span style="color: #ce9178;">${match}</span>`)
    return `__STRING_TOKEN_${idx}__`
  })

  if (l === 'csharp' || l === 'cs') {
    // 3. Keywords
    const keywords = /\b(using|namespace|public|private|protected|internal|class|interface|struct|enum|async|await|Task|override|void|string|var|out|int|decimal|bool|if|else|foreach|in|new|return|throw|default|static|readonly)\b/g
    text = text.replace(keywords, '<span style="color: #569cd6; font-weight: bold;">$1</span>')

    // 4. Attributes (e.g. [Authorize])
    text = text.replace(/(\[Authorize\])/g, '<span style="color: #4ec9b0;">$1</span>')

    // 5. Methods (words followed by paren)
    text = text.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, (match) => {
      const csharpKeywords = ['if', 'foreach', 'typeof', 'default', 'await', 'switch', 'while', 'for', 'catch']
      if (csharpKeywords.includes(match)) return match
      return `<span style="color: #dcdcaa;">${match}</span>`
    })

    // 6. Types (Capitalized words)
    text = text.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, (match) => {
      return `<span style="color: #4ec9b0;">${match}</span>`
    })

  } else if (l === 'typescript' || l === 'js' || l === 'ts' || l === 'javascript' || l === 'json') {
    // 3. Keywords
    const keywords = /\b(import|from|export|default|const|let|var|class|interface|type|extends|implements|private|public|static|readonly|async|await|return|new|try|catch|function|if|else|throw|null|undefined|true|false)\b/g
    text = text.replace(keywords, '<span style="color: #569cd6; font-weight: bold;">$1</span>')

    // 4. Methods
    text = text.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, (match) => {
      const jsKeywords = ['if', 'catch', 'require', 'await', 'switch', 'while', 'for']
      if (jsKeywords.includes(match)) return match
      return `<span style="color: #dcdcaa;">${match}</span>`
    })

    // 5. Types / Classes (Capitalized words)
    text = text.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, (match) => {
      return `<span style="color: #4ec9b0;">${match}</span>`
    })
  }

  // 7. Restore strings and comments in reverse order
  for (let i = 0; i < strings.length; i++) {
    text = text.replace(`__STRING_TOKEN_${i}__`, strings[i])
  }
  for (let i = 0; i < comments.length; i++) {
    text = text.replace(`__COMMENT_TOKEN_${i}__`, comments[i])
  }

  return text
}

export function parseMarkdown(md: string, theme?: 'dark' | 'light', accent?: AccentKey): React.ReactNode[] {
  if (!md) return []

  const result: React.ReactNode[] = []
  const lines = md.split('\n')
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeLang = ''
  let currentBlock: string[] = []
  let keyIndex = 0
  let currentBlockType: 'paragraph' | 'list-unordered' | 'list-ordered' | 'none' = 'none'

  const flushCurrentBlock = () => {
    if (currentBlock.length > 0) {
      const blockText = currentBlock.join('\n').trim()
      if (blockText) {
        result.push(parseBlock(blockText, keyIndex++))
      }
      currentBlock = []
    }
    currentBlockType = 'none'
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    if (inCodeBlock) {
      if (trimmedLine.startsWith('```')) {
        // End of code block
        const codeText = codeLines.join('\n')
        if (codeLang.toLowerCase() === 'mermaid') {
          result.push(<MermaidRenderer key={keyIndex++} code={codeText} theme={theme} accent={accent} />)
        } else {
          const highlightedHtml = highlightCode(codeText, codeLang)
          result.push(
            <CodeBlock 
              key={keyIndex++} 
              code={codeText} 
              lang={codeLang} 
              highlightedHtml={highlightedHtml} 
            />
          )
        }
        inCodeBlock = false
        codeLines = []
      } else {
        codeLines.push(line)
      }
    } else {
      if (trimmedLine.startsWith('```')) {
        flushCurrentBlock()
        inCodeBlock = true
        codeLang = trimmedLine.slice(3).trim()
      } else if (trimmedLine.startsWith('#')) {
        flushCurrentBlock()
        result.push(parseBlock(trimmedLine, keyIndex++))
      } else if (/^[-*_]{3,}$/.test(trimmedLine)) {
        flushCurrentBlock()
        result.push(<hr key={keyIndex++} className="my-8 border-t" style={{ borderColor: 'var(--border)' }} />)
      } else if (trimmedLine === '') {
        flushCurrentBlock()
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (currentBlockType !== 'list-unordered') {
          flushCurrentBlock()
          currentBlockType = 'list-unordered'
        }
        currentBlock.push(line)
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        if (currentBlockType !== 'list-ordered') {
          flushCurrentBlock()
          currentBlockType = 'list-ordered'
        }
        currentBlock.push(line)
      } else {
        if (currentBlockType !== 'paragraph' && currentBlockType !== 'none') {
          flushCurrentBlock()
        }
        currentBlockType = 'paragraph'
        currentBlock.push(line)
      }
    }
  }

  flushCurrentBlock()

  return result
}

function parseBlock(block: string, i: number): React.ReactNode {
  // Horizontal Rule
  if (/^[-*_]{3,}$/.test(block.trim())) {
    return <hr key={i} className="my-8 border-t" style={{ borderColor: 'var(--border)' }} />
  }

  // Table Parsing
  const lines = block.split('\n')
  if (lines.length >= 2) {
    const secondLine = lines[1].trim()
    const isTableSeparator = secondLine.startsWith('|') && /^[|:\s-]+$/.test(secondLine)
    
    if (isTableSeparator) {
      const headers = lines[0].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      const rows = lines.slice(2).map(line => {
        return line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      }).filter(row => row.length > 0)

      return (
        <div key={i} className="my-6 w-full overflow-x-auto rounded-2xl border bg-white/5" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm border-collapse text-left select-text">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                {headers.map((header, hIdx) => (
                  <th key={hIdx} className="px-4 py-3 font-semibold text-[var(--accent)] tracking-tight">
                    {parseInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className="border-b last:border-b-0 hover:bg-white/5 transition-colors" 
                  style={{ borderColor: 'var(--border)' }}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-[var(--text-secondary)]">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }

  // Headers (h1 to h6)
  const headerMatch = block.match(/^(#{1,6})\s+([\s\S]*)$/)
  if (headerMatch) {
    const level = headerMatch[1].length
    const content = headerMatch[2]
    const headerClasses = [
      "text-3xl font-bold mt-8 mb-4 text-[var(--accent)] tracking-tight",
      "text-2xl font-bold mt-6 mb-3 text-[var(--accent-secondary)] tracking-tight",
      "text-xl font-bold mt-5 mb-2 tracking-tight text-[var(--text-primary)]",
      "text-base font-bold mt-4 mb-2 tracking-tight text-[var(--text-primary)]",
      "text-sm font-bold mt-3.5 mb-1.5 tracking-tight text-[var(--text-secondary)]",
      "text-xs font-bold mt-3 mb-1 tracking-tight text-[var(--text-muted)]"
    ]
    const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <HeadingTag key={i} className={headerClasses[level - 1]}>
        {parseInline(content)}
      </HeadingTag>
    )
  }

  // Blockquote
  if (block.startsWith('>')) {
    const text = block.split('\n').map(line => line.replace(/^>\s*/, '')).join('\n')
    return (
      <blockquote key={i} className="border-l-4 border-[var(--accent)] pl-4 italic my-4 text-[var(--text-secondary)]">
        {parseInline(text)}
      </blockquote>
    )
  }

  // Unordered lists
  if (block.startsWith('- ') || block.startsWith('* ')) {
    const items = block.split('\n').map(line => line.replace(/^[-*]\s*/, ''))
    return (
      <ul key={i} className="list-disc pl-6 my-4 space-y-2 text-[var(--text-primary)]">
        {items.map((item, idx) => <li key={idx}>{parseInline(item)}</li>)}
      </ul>
    )
  }

  // Ordered lists
  if (/^\d+\.\s/.test(block)) {
    const items = block.split('\n').map(line => line.replace(/^\d+\.\s*/, ''))
    return (
      <ol key={i} className="list-decimal pl-6 my-4 space-y-2 text-[var(--text-primary)]">
        {items.map((item, idx) => <li key={idx}>{parseInline(item)}</li>)}
      </ol>
    )
  }

  // Default paragraph
  return <p key={i} className="my-4 leading-relaxed text-[var(--text-primary)]">{parseInline(block)}</p>
}

function parseInline(text: string): React.ReactNode[] {
  const tokenRegex = /(!\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g
  const tokens = text.split(tokenRegex)
  
  return tokens.map((token, index) => {
    if (token.startsWith('![') && token.includes('](') && token.endsWith(')')) {
      const match = token.match(/!\[(.*?)\]\((.*?)\)/)
      if (match) {
        const [_, alt, url] = match
        return (
          <span key={index} className="block my-6 text-center select-none">
            <img 
              src={url} 
              alt={alt} 
              className="mx-auto max-w-full rounded-2xl border p-2 bg-white/5" 
              style={{ borderColor: 'var(--border)' }} 
            />
            {alt && <span className="block text-xs mt-2 opacity-50 font-sans">{alt}</span>}
          </span>
        )
      }
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index} className="font-bold">{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={index} className="italic">{token.slice(1, -1)}</em>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index} className="bg-[var(--accent-dim)] px-1.5 py-0.5 rounded text-xs font-mono text-[var(--accent)]">{token.slice(1, -1)}</code>
    }
    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const match = token.match(/\[(.*?)\]\((.*?)\)/)
      if (match) {
        const [_, label, url] = match
        return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline font-semibold">{label}</a>
      }
    }
    return token
  })
}
