import React, { useState, useEffect } from 'react'
import { ACCENT_THEMES, AccentKey } from '../data/accents'

interface MermaidRendererProps {
  code: string
  theme?: 'dark' | 'light'
  accent?: AccentKey
}

function MermaidRenderer({ code, theme = 'dark', accent = 'gold' }: MermaidRendererProps) {
  const [svgHtml, setSvgHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showCode, setShowCode] = useState(false)
  
  // Interactive zoom & pan states
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const cleanCode = code.trim()
  
  // Resolve active theme colors
  const accentColors = ACCENT_THEMES[accent]?.[theme] || ACCENT_THEMES.gold[theme]
  const primaryColor = accentColors.accent
  const secondaryColor = accentColors.accentSecondary
  const isDark = theme === 'dark'

  // Prepend dynamic theme styling variables inside the Mermaid graph configuration
  const initConfig = `%%{init: {
    "theme": "${isDark ? 'dark' : 'neutral'}",
    "themeVariables": {
      "fontFamily": "Outfit, Inter, system-ui, -apple-system, sans-serif",
      "primaryColor": "${isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9'}",
      "primaryTextColor": "${isDark ? '#f8fafc' : '#0f172a'}",
      "lineColor": "${isDark ? '#475569' : '#94a3b8'}",
      "mainBkg": "${isDark ? '#0d1117' : '#ffffff'}",
      "actorBkg": "${isDark ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc'}",
      "actorTextColor": "${isDark ? '#f8fafc' : '#0f172a'}",
      "actorLineColor": "${primaryColor}",
      "signalColor": "${secondaryColor}",
      "signalTextColor": "${isDark ? '#cbd5e1' : '#475569'}",
      "labelBoxBkgColor": "${isDark ? '#1e293b' : '#f1f5f9'}",
      "labelBoxBorderColor": "${primaryColor}",
      "labelTextColor": "${isDark ? '#f8fafc' : '#0f172a'}",
      "loopLimitColor": "${primaryColor}",
      "loopLimitTextColor": "${isDark ? '#cbd5e1' : '#475569'}",
      "noteBkgColor": "${isDark ? '#1e293b' : '#fef08a'}",
      "noteTextColor": "${isDark ? '#f8fafc' : '#0f172a'}",
      "noteBorderColor": "${primaryColor}"
    },
    "sequence": {
      "actorMargin": 85,
      "messageMargin": 45,
      "boxMargin": 15,
      "noteMargin": 15,
      "messageFontSize": 11,
      "actorFontSize": 11,
      "noteFontSize": 11,
      "actorFontFamily": "Outfit, Inter, system-ui, sans-serif",
      "noteFontFamily": "Outfit, Inter, system-ui, sans-serif",
      "messageFontFamily": "Outfit, Inter, system-ui, sans-serif"
    }
  }}%%`

  const formattedCode = `${initConfig}\n${cleanCode}`

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setHasError(false)

    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(formattedCode)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const url = `https://mermaid.ink/svg/${base64url}`
      
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('mermaid.ink returned ' + res.status)
          return res.text()
        })
        .then(svgText => {
          if (active) {
            setSvgHtml(svgText)
            setIsLoading(false)
          }
        })
        .catch(err => {
          console.warn('[Mermaid] fetch failed:', err)
          if (active) {
            setHasError(true)
            setIsLoading(false)
          }
        })
    } catch (e) {
      console.warn('[Mermaid] encoding error:', e)
      setHasError(true)
      setIsLoading(false)
    }

    return () => {
      active = false
    }
  }, [formattedCode])

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

  if (isLoading) {
    return (
      <div className="my-8 flex justify-center items-center py-10 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (hasError || !svgHtml) {
    return (
      <pre 
        className="border rounded-xl p-4 overflow-x-auto my-4 text-xs font-mono select-text" 
        style={{ 
          background: '#0d1117', 
          color: '#c9d1d9', 
          borderColor: 'rgba(255, 255, 255, 0.15)' 
        }}
      >
        <code>{cleanCode}</code>
      </pre>
    )
  }

  return (
    <div className="my-8 flex flex-col space-y-3 w-full">
      <style>{`
        .mermaid-svg-container svg {
          width: 100% !important;
          max-width: 900px !important;
          height: auto !important;
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
          className="w-full h-[360px] md:h-[420px] overflow-hidden flex items-center justify-center p-6 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div 
            className="w-full flex justify-center mermaid-svg-container"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
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

export function parseMarkdown(md: string, theme?: 'dark' | 'light', _accent?: AccentKey): React.ReactNode[] {
  if (!md) return []

  const result: React.ReactNode[] = []
  const lines = md.split('\n')
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeLang = ''
  let currentBlock: string[] = []
  let keyIndex = 0

  const flushCurrentBlock = () => {
    if (currentBlock.length > 0) {
      const blockText = currentBlock.join('\n').trim()
      if (blockText) {
        const subBlocks = blockText.split(/\n\s*\n/)
        subBlocks.forEach(subBlock => {
          const trimmed = subBlock.trim()
          if (!trimmed) return
          result.push(parseBlock(trimmed, keyIndex++))
        })
      }
      currentBlock = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    if (inCodeBlock) {
      if (trimmedLine.startsWith('```')) {
        // End of code block
        const codeText = codeLines.join('\n')
        if (codeLang.toLowerCase() === 'mermaid') {
          result.push(<MermaidRenderer key={keyIndex++} code={codeText} theme={theme} />)
        } else {
          const highlightedHtml = highlightCode(codeText, codeLang)
          result.push(
            <pre 
              key={keyIndex++} 
              className="border rounded-xl p-4 overflow-x-auto my-4 text-xs font-mono select-text" 
              style={{ 
                background: '#0d1117', 
                color: '#c9d1d9', 
                borderColor: 'rgba(255, 255, 255, 0.15)' 
              }}
            >
              <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </pre>
          )
        }
        inCodeBlock = false
        codeLines = []
      } else {
        codeLines.push(line)
      }
    } else {
      if (trimmedLine.startsWith('```')) {
        // Start of code block
        flushCurrentBlock()
        inCodeBlock = true
        codeLang = trimmedLine.slice(3).trim()
      } else if (trimmedLine.startsWith('#')) {
        // Header line
        flushCurrentBlock()
        result.push(parseBlock(trimmedLine, keyIndex++))
      } else if (/^[-*_]{3,}$/.test(trimmedLine)) {
        // Horizontal Rule
        flushCurrentBlock()
        result.push(<hr key={keyIndex++} className="my-8 border-t" style={{ borderColor: 'var(--border)' }} />)
      } else {
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
