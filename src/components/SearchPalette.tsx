import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Folder, FileText, Star, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'project' | 'blog' | 'skill'
  link: string
}

export default function SearchPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }
      const target = e.target as HTMLElement | null
      const isEditable = 
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable === true
      if (e.key === '/' && !isEditable) {
        e.preventDefault()
        setIsOpen(true)
        return
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    const handleOpenSearch = () => setIsOpen(true)
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-search', handleOpenSearch)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-search', handleOpenSearch)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!isOpen) {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    if (result.link.startsWith('/#')) {
      const id = result.link.replace('/#', '')
      if (window.location.pathname !== '/') {
        navigate('/')
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }, 500)
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(result.link)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[101] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] border"
            style={{ 
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div className="flex items-center px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <Search className="mr-4 opacity-50" size={24} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, blogs, skills..."
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xl font-light"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto p-4" style={{ background: 'var(--bg-secondary)' }}>
              {loading && <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Searching...</div>}
              {!loading && query.length > 1 && results.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No results found for "{query}"</div>
              )}
              {!loading && results.length > 0 && (() => {
                const groups: Record<'project' | 'blog' | 'skill', SearchResult[]> = {
                  project: [],
                  blog: [],
                  skill: [],
                }
                results.forEach((r) => { groups[r.type].push(r) })
                const groupMeta: Record<'project' | 'blog' | 'skill', { label: string; icon: React.ReactNode }> = {
                  project: { label: 'Projects', icon: <Folder size={12} /> },
                  blog: { label: 'Articles', icon: <FileText size={12} /> },
                  skill: { label: 'Skills', icon: <Star size={12} /> },
                }
                return (
                  <div className="space-y-4">
                    {(Object.keys(groups) as Array<keyof typeof groups>).map((type) => {
                      const list = groups[type]
                      if (!list.length) return null
                      const meta = groupMeta[type]
                      return (
                        <div key={type}>
                          <div
                            className="px-2 mb-1.5 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {meta.icon}
                            <span>{meta.label}</span>
                            <span className="opacity-40">·</span>
                            <span className="opacity-40">{list.length}</span>
                          </div>
                          <div className="space-y-1">
                            {list.map((result) => (
                              <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelect(result)}
                                className="w-full flex items-center p-3 rounded-xl transition-all group text-left relative overflow-hidden"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--glass-bg)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-[0.05] transition-opacity" />
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border transition-transform group-hover:scale-110"
                                  style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                                >
                                  {result.type === 'project' && <Folder size={16} />}
                                  {result.type === 'blog' && <FileText size={16} />}
                                  {result.type === 'skill' && <Star size={16} />}
                                </div>
                                <div className="flex-1 min-w-0 pr-4 relative z-10">
                                  <div className="font-medium text-sm truncate tracking-tight" style={{ color: 'var(--text-primary)' }}>{result.title}</div>
                                  {result.description && (
                                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{result.description}</div>
                                  )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                                  <ArrowRight size={14} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              {query.length === 0 && (
                <div className="p-6 text-center text-xs flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Search size={24} />
                  <span>Start typing to search</span>
                </div>
              )}
            </div>
            
            <div
              className="px-6 py-3 border-t text-[11px] uppercase tracking-widest flex items-center justify-between"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
            >
              <span className="font-bold flex items-center gap-2">
                <Search size={12} /> Global Search
              </span>
              <span className="flex items-center gap-2">
                <kbd
                  className="px-2 py-1 rounded-md font-sans font-semibold text-[10px] border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  ESC
                </kbd>
                to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
