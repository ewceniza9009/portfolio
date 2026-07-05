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
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[101] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] border border-white/10"
            style={{ 
              background: 'rgba(20, 20, 20, 0.7)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center px-6 py-4 border-b border-white/10">
              <Search className="mr-4 opacity-50 text-white" size={24} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, blogs, skills..."
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xl font-light text-white placeholder-white/30"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 bg-black/20">
              {loading && <div className="p-8 text-center opacity-50 text-sm">Searching...</div>}
              {!loading && query.length > 1 && results.length === 0 && (
                <div className="p-8 text-center opacity-50 text-sm">No results found for "{query}"</div>
              )}
              {!loading && results.length > 0 && (
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center p-4 rounded-2xl transition-all group text-left relative overflow-hidden"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                      
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 shadow-sm border border-white/5 transition-transform group-hover:scale-110" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--accent)' }}>
                        {result.type === 'project' && <Folder size={18} />}
                        {result.type === 'blog' && <FileText size={18} />}
                        {result.type === 'skill' && <Star size={18} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-6 relative z-10 text-white">
                        <div className="font-medium text-lg truncate tracking-tight">{result.title}</div>
                        {result.description && (
                          <div className="text-sm opacity-50 truncate mt-1">{result.description}</div>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {query.length === 0 && (
                <div className="p-6 text-center opacity-40 text-xs flex flex-col items-center gap-2">
                  <Search size={24} />
                  <span>Start typing to search</span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 border-t border-white/10 text-[11px] uppercase tracking-widest text-white/40 flex items-center justify-between bg-black/40">
              <span className="font-bold flex items-center gap-2">
                <Search size={12} /> Global Search
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded-md bg-white/10 font-sans font-semibold text-white/70">ESC</kbd> to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
