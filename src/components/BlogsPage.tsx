import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Heart, Search, ArrowRight, BookOpen, Tag, Sparkles, Folder, Layers, Code, Shield, Server, GraduationCap, Activity, Zap, Palette, Coffee, Lightbulb, Gamepad2, Briefcase, Filter, X } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from './BackToTop'
import CursorFollower from './CursorFollower'
import HeadTags from './HeadTags'
import type { AccentKey } from '../data/accents'
import { useProfilePic } from '../utils/profilePic'

interface Blog {
  id: string
  slug: string
  title: string
  content: string
  summary: string | null
  tags: string | null
  category: string | null
  published: number
  likes: number
  read_time: string | null
  cover_image: string | null
  created_at: string
}

interface BlogsPageProps {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  accent: AccentKey
  setAccent: React.Dispatch<React.SetStateAction<AccentKey>>
}

const getApiUrl = (path: string) => {
  const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:3000'
    : ''
  return `${baseUrl}${path}`
}

const getGradient = (slug: string) => {
  const gradients = [
    'from-rose-500/80 to-orange-500/80',
    'from-emerald-500/80 to-teal-500/80',
    'from-cyan-500/80 to-blue-500/80',
    'from-purple-500/80 to-pink-500/80',
    'from-amber-500/80 to-red-500/80',
    'from-indigo-500/80 to-purple-500/80'
  ]
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const relativeDate = (dateStr: string) => {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

const codePatternSvg = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const categoryMeta: Record<string, { icon: React.ReactNode; gradient: string; chipGradient: string }> = {
  Engineering: {
    icon: <Code size={13} />,
    gradient: 'from-cyan-500/80 to-blue-500/80',
    chipGradient: 'from-cyan-500/20 to-blue-500/20'
  },
  Tutorial: {
    icon: <GraduationCap size={13} />,
    gradient: 'from-emerald-500/80 to-teal-500/80',
    chipGradient: 'from-emerald-500/20 to-teal-500/20'
  },
  Architecture: {
    icon: <Layers size={13} />,
    gradient: 'from-purple-500/80 to-pink-500/80',
    chipGradient: 'from-purple-500/20 to-pink-500/20'
  },
  DevOps: {
    icon: <Server size={13} />,
    gradient: 'from-amber-500/80 to-orange-500/80',
    chipGradient: 'from-amber-500/20 to-orange-500/20'
  },
  Security: {
    icon: <Shield size={13} />,
    gradient: 'from-rose-500/80 to-red-500/80',
    chipGradient: 'from-rose-500/20 to-red-500/20'
  },
  Career: {
    icon: <Briefcase size={13} />,
    gradient: 'from-blue-500/80 to-indigo-500/80',
    chipGradient: 'from-blue-500/20 to-indigo-500/20'
  },
  Workflow: {
    icon: <Activity size={13} />,
    gradient: 'from-teal-500/80 to-emerald-500/80',
    chipGradient: 'from-teal-500/20 to-emerald-500/20'
  },
  Productivity: {
    icon: <Zap size={13} />,
    gradient: 'from-yellow-500/80 to-amber-500/80',
    chipGradient: 'from-yellow-500/20 to-amber-500/20'
  },
  Design: {
    icon: <Palette size={13} />,
    gradient: 'from-pink-500/80 to-rose-500/80',
    chipGradient: 'from-pink-500/20 to-rose-500/20'
  },
  Life: {
    icon: <Coffee size={13} />,
    gradient: 'from-orange-500/80 to-amber-500/80',
    chipGradient: 'from-orange-500/20 to-amber-500/20'
  },
  Thoughts: {
    icon: <Lightbulb size={13} />,
    gradient: 'from-violet-500/80 to-purple-500/80',
    chipGradient: 'from-violet-500/20 to-purple-500/20'
  },
  Hobbies: {
    icon: <Gamepad2 size={13} />,
    gradient: 'from-fuchsia-500/80 to-pink-500/80',
    chipGradient: 'from-fuchsia-500/20 to-pink-500/20'
  },
  General: {
    icon: <Folder size={13} />,
    gradient: 'from-indigo-500/80 to-purple-500/80',
    chipGradient: 'from-indigo-500/20 to-purple-500/20'
  }
}

const BLOG_PAGE_STYLES = `
  @keyframes blob-float-1 {
    0% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(80px, -60px) scale(1.15); }
    100% { transform: translate(-30px, 30px) scale(0.9); }
  }
  @keyframes blob-float-2 {
    0% { transform: translate(0px, 0px) scale(1.1); }
    50% { transform: translate(-70px, 80px) scale(0.85); }
    100% { transform: translate(40px, -30px) scale(1.05); }
  }
  @keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .bg-shimmer {
    background: linear-gradient(
      90deg, 
      var(--bg-secondary) 25%, 
      var(--border) 37%, 
      var(--bg-secondary) 63%
    );
    background-size: 400% 100%;
    animation: skeleton-shimmer 1.8s ease-in-out infinite;
  }
  .aurora-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(140px);
    pointer-events: none;
    z-index: 0;
    mix-blend-mode: screen;
  }
  .aurora-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
`

export default function BlogsPage({ theme, toggleTheme, accent, setAccent }: BlogsPageProps) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { url: profilePicUrl } = useProfilePic()

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch(getApiUrl('/api/blogs'))
        if (res.ok) {
          const data = await res.json()
          setBlogs(data)
        }
      } catch (err) {
        console.error('Failed to fetch blogs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  const allTags = useMemo(() => Array.from(
    new Set(
      blogs
        .flatMap(b => b.tags ? b.tags.split(',').map(t => t.trim()) : [])
        .filter(Boolean)
    )
  ), [blogs])

  const allCategories = useMemo(() => Array.from(
    new Set(
      blogs
        .map(b => b.category || 'General')
        .filter(Boolean)
    )
  ).sort(), [blogs])

  const filteredBlogs = useMemo(() => blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.summary && blog.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.tags && blog.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const blogTags = blog.tags ? blog.tags.split(',').map(t => t.trim()) : []
    const matchesTag = !selectedTag || blogTags.includes(selectedTag)

    const blogCategory = blog.category || 'General'
    const matchesCategory = !selectedCategory || blogCategory === selectedCategory

    return matchesSearch && matchesTag && matchesCategory
  }), [blogs, searchQuery, selectedTag, selectedCategory])

  // Separate the latest article as Featured (if no filters are active)
  const isFiltering = searchQuery !== '' || selectedTag !== null || selectedCategory !== null
  const featuredBlog = !isFiltering && filteredBlogs.length > 0 ? filteredBlogs[0] : null
  const gridBlogs = featuredBlog ? filteredBlogs.slice(1) : filteredBlogs

  return (
    <>
      <HeadTags
        title="Blog"
        description="Engineering deep-dives, architecture patterns, and real-world lessons from building ERP and AI applications."
        url="/blogs"
      />
      <style>{BLOG_PAGE_STYLES}</style>
      
      <CursorFollower />
      
      <div className="min-h-screen transition-colors duration-300 relative overflow-x-hidden flex flex-col justify-between" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
        
        {/* Dynamic Aurora Backdrop */}
        <div className="aurora-container">
          <div 
            className="aurora-blob w-[600px] h-[600px] -top-20 -left-20 blob-1" 
            style={{ 
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
              opacity: theme === 'dark' ? 0.08 : 0.02,
              animation: 'blob-float-1 20s infinite alternate ease-in-out'
            }} 
          />
          <div 
            className="aurora-blob w-[700px] h-[700px] top-[30vh] -right-20 blob-2" 
            style={{ 
              background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 60%)',
              opacity: theme === 'dark' ? 0.05 : 0.01,
              animation: 'blob-float-2 25s infinite alternate ease-in-out'
            }} 
          />
        </div>

        <Navbar
          activeSection="blog"
          theme={theme}
          onToggleTheme={toggleTheme}
          onScrollTo={() => {}}
          accent={accent}
          onChangeAccent={setAccent}
        />

        <main className="flex-grow max-w-6xl w-full mx-auto px-6 pt-32 pb-24 relative z-10">
          
          {/* Header — Compact */}
          <div className="text-center mb-10 relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg" style={{ borderColor: 'var(--accent)', boxShadow: '0 0 24px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
                  <img
                    src={profilePicUrl}
                    alt="Erwin Wilson Ceniza"
                    className="w-full h-full object-cover"
                    key={profilePicUrl}
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-mono tracking-wider backdrop-blur-md"
                style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 5%, transparent)', color: 'var(--accent)' }}
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>THE DEVELOPER LOGS</span>
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mb-3"
            >
              Stories & <span style={{ color: 'var(--accent)' }}>Insights</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xs sm:text-sm max-w-lg mx-auto leading-relaxed mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              Technical deep-dives, architecture patterns, and real-world lessons.
            </motion.p>
            {/* Inline Stats */}
            {!loading && blogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-center gap-3 text-[11px] font-mono tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1">
                  <BookOpen size={11} style={{ color: 'var(--accent)' }} className="opacity-60" />
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{blogs.length}</span> Articles
                </span>
                <span className="opacity-20">·</span>
                <span className="flex items-center gap-1">
                  <Layers size={11} style={{ color: 'var(--accent)' }} className="opacity-60" />
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{allCategories.length}</span> Categories
                </span>
                <span className="opacity-20">·</span>
                <span className="flex items-center gap-1">
                  <Heart size={11} style={{ color: 'var(--accent)' }} className="opacity-60" />
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{blogs.reduce((s, b) => s + b.likes, 0)}</span> Likes
                </span>
              </motion.div>
            )}
          </div>

          {/* Controls: Search + Filter Toggle */}
          <div className="mb-10 space-y-3">
            <div className="max-w-xl mx-auto flex gap-2">
              <div className="flex-1 relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] opacity-[0.05] group-focus-within:opacity-[0.1] blur-md transition-all duration-500 pointer-events-none" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-[var(--accent)]" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 relative z-10 border bg-white/5 backdrop-blur-xl"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="relative px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 flex items-center gap-2 shrink-0"
                style={{
                  background: filtersOpen || selectedCategory || selectedTag
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : 'transparent',
                  borderColor: filtersOpen || selectedCategory || selectedTag
                    ? 'var(--accent)'
                    : 'var(--border)',
                  color: filtersOpen || selectedCategory || selectedTag
                    ? 'var(--accent)'
                    : 'var(--text-secondary)'
                }}
              >
                {filtersOpen ? <X size={14} /> : <Filter size={14} />}
                <span className="hidden sm:inline">
                  {(() => {
                    const count = (selectedCategory ? 1 : 0) + (selectedTag ? 1 : 0)
                    return count > 0 ? `${count} Active` : 'Filters'
                  })()}
                </span>
              </button>
            </div>

            {/* Collapsible Filters */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2">
                    {/* Category Pills */}
                    {allCategories.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto select-none">
                        <button
                          onClick={() => { setSelectedCategory(null); setSelectedTag(null) }}
                          className="relative px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border active:scale-95"
                          style={{
                            background: selectedCategory === null && selectedTag === null ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                            borderColor: selectedCategory === null && selectedTag === null ? 'var(--accent)' : 'var(--border)',
                            color: selectedCategory === null && selectedTag === null ? 'var(--accent)' : 'var(--text-secondary)'
                          }}
                        >
                          <Sparkles size={11} className="inline-block mr-1 -mt-0.5" />
                          All
                        </button>
                        {allCategories.map(cat => {
                          const meta = categoryMeta[cat] || categoryMeta.General
                          const active = selectedCategory === cat
                          return (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(active ? null : cat)}
                              className="relative px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border active:scale-95"
                              style={{
                                background: active ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                                borderColor: active ? 'var(--accent)' : 'var(--border)',
                                color: active ? 'var(--accent)' : 'var(--text-secondary)'
                              }}
                            >
                              <span className="flex items-center gap-1.5">
                                {meta.icon}
                                {cat}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Tag Badges */}
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto select-none">
                        {allTags.map(tag => {
                          const active = selectedTag === tag
                          return (
                            <button
                              key={tag}
                              onClick={() => setSelectedTag(active ? null : tag)}
                              className="px-3 py-1 rounded-full text-[10px] font-semibold transition-all border flex items-center gap-1 active:scale-95"
                              style={{
                                background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                                borderColor: active ? 'var(--accent)' : 'var(--border)',
                                color: active ? 'var(--accent)' : 'var(--text-secondary)'
                              }}
                            >
                              <Tag size={9} className={active ? '' : 'opacity-40'} />
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Blogs Content Grid */}
          {loading ? (
            /* Premium Shimmer Skeleton Loaders */
            <div className="space-y-12">
              <div className="rounded-3xl border glass p-6 grid grid-cols-1 md:grid-cols-12 gap-8 h-80">
                <div className="md:col-span-6 bg-shimmer rounded-2xl w-full h-full" />
                <div className="md:col-span-6 flex flex-col justify-between py-2">
                  <div className="space-y-3">
                    <div className="h-4 bg-shimmer w-1/4 rounded-full" />
                    <div className="h-8 bg-shimmer w-3/4 rounded-xl" />
                    <div className="h-4 bg-shimmer w-full rounded-md" />
                    <div className="h-4 bg-shimmer w-5/6 rounded-md" />
                  </div>
                  <div className="h-8 bg-shimmer w-1/3 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-3xl border glass overflow-hidden h-96 flex flex-col">
                    <div className="h-48 bg-shimmer w-full" />
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="h-3 bg-shimmer w-1/3 rounded-full" />
                        <div className="h-6 bg-shimmer w-4/5 rounded-md" />
                        <div className="h-3 bg-shimmer w-full rounded-md" />
                      </div>
                      <div className="h-6 bg-shimmer w-1/4 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="space-y-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 rounded-3xl border relative overflow-hidden flex flex-col items-center justify-center" 
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)] rounded-full blur-[100px] opacity-[0.05] pointer-events-none" />
                
                <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <BookOpen size={32} />
                </div>
                
                <h3 className="relative z-10 text-2xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  No Articles Published
                </h3>
                <p className="relative z-10 text-sm max-w-md mx-auto mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  There are currently no blog posts available in the database. Check back soon for new technical deep-dives and architectural writeups!
                </p>
              </motion.div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-lg font-bold tracking-tight">Coming Soon</h2>
                  <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 3 }).map((_, placeholderIdx) => (
                    <motion.div
                      key={`empty-placeholder-${placeholderIdx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 0.85, scale: 1 }}
                      transition={{ duration: 0.5, delay: placeholderIdx * 0.05 }}
                      className="flex flex-col justify-between rounded-3xl border border-dashed p-6 min-h-[360px] select-none relative group overflow-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center opacity-40 border" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                          <BookOpen size={16} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {placeholderIdx === 0 ? 'Writing in Progress...' : placeholderIdx === 1 ? 'Next Case Study Drafting...' : 'Researching New Topics...'}
                          </h3>
                          <p className="text-xs leading-relaxed font-medium opacity-70" style={{ color: 'var(--text-secondary)' }}>
                            {placeholderIdx === 0 
                              ? 'Drafting the next deep-dive on telemetry loops, scalable architectures, and advanced full-stack systems.' 
                              : placeholderIdx === 1
                              ? 'Fleshing out database schema autopsies, microservices migration reports, and cloud platform integrations.'
                              : 'Exploring the latest trends in software engineering, AI integration, and high-performance computing.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-6 border-t relative z-10 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <span>Article</span>
                        <span>Coming Soon</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 rounded-3xl border relative overflow-hidden flex flex-col items-center justify-center" 
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)] rounded-full blur-[100px] opacity-[0.05] pointer-events-none" />
              
              <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Search size={32} />
              </div>
              
              <h3 className="relative z-10 text-2xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                No Archives Found
              </h3>
              <p className="relative z-10 text-sm max-w-md mx-auto mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We couldn't find any articles matching "{searchQuery}" or your selected filters. Try adjusting your search parameters to explore the database.
              </p>
              
              <button 
                onClick={() => { setSearchQuery(''); setSelectedTag(null); setSelectedCategory(null) }}
                className="relative z-10 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all hover:scale-105 border flex items-center gap-2"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                <Sparkles size={14} />
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              
              {/* FEATURED POST (Splits layout, 12-column Grid) */}
              {featuredBlog && (
                <motion.article
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="group rounded-3xl overflow-hidden border transition-all hover:shadow-xl relative"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                >
                  <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-[0.02] transition-opacity z-0" />
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:h-[400px] relative z-10">
                    {/* Left: Featured Image Cover */}
                    <div className="md:col-span-7 h-64 md:h-full overflow-hidden relative border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--border)' }}>
                      <Link to={`/blogs/${featuredBlog.slug}`} className="w-full h-full block">
                        {featuredBlog.cover_image ? (
                          <img 
                            src={featuredBlog.cover_image} 
                            alt={featuredBlog.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getGradient(featuredBlog.slug)} flex items-center justify-center p-6 transition-transform duration-700 group-hover:scale-[1.03] opacity-90 relative`}>
                            <div className="absolute inset-0" style={{ backgroundImage: codePatternSvg, backgroundSize: '60px 60px' }} />
                            <div className="absolute inset-0 bg-black/20" />
                          </div>
                        )}
                      </Link>
                      {/* Reading Time Badge */}
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-md z-10" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {featuredBlog.read_time || '5 min read'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Featured Text Metadata */}
                    <div className="md:col-span-5 p-8 flex flex-col justify-between h-full">
                      <div>
                        {/* Featured Badge */}
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-4">
                          <span style={{ color: 'var(--accent)' }} className="flex items-center gap-1.5">
                            <Sparkles size={12} />
                            Featured
                          </span>
                          {featuredBlog.category && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }} className="opacity-30">·</span>
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold tracking-wider"
                                style={{ background: `color-mix(in srgb, var(--accent) 12%, transparent)`, color: 'var(--accent)' }}>
                                {categoryMeta[featuredBlog.category]?.icon || <Folder size={11} />}
                                {featuredBlog.category}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <Link to={`/blogs/${featuredBlog.slug}`}>
                          <h2 className="text-xl sm:text-2xl font-bold mb-3 transition-colors group-hover:text-[var(--accent)] line-clamp-3 leading-snug tracking-tight">
                            {featuredBlog.title}
                          </h2>
                        </Link>

                        {/* Excerpt */}
                        <p className="text-xs sm:text-sm leading-relaxed line-clamp-4 mb-4" style={{ color: 'var(--text-secondary)' }}>
                          {featuredBlog.summary || 'Click to read the full architectural overview, database design schema, and code implementations for this post.'}
                        </p>
                      </div>

                      {/* Featured Footer */}
                      <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {relativeDate(featuredBlog.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {featuredBlog.read_time || '5 min read'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                              <img src={profilePicUrl} alt="Author" className="w-full h-full object-cover" key={profilePicUrl} />
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              <Heart size={12} />
                              {featuredBlog.likes}
                            </span>
                          </div>
                          <Link 
                            to={`/blogs/${featuredBlog.slug}`} 
                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all group-hover:gap-2.5 px-4 py-2 rounded-xl border border-transparent hover:border-[var(--accent)]/30"
                            style={{ color: '#ffffff', background: 'var(--accent)' }}
                          >
                            Read Article
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )}

              {/* RECENT POSTS GRID */}
              {(gridBlogs.length > 0 || featuredBlog) && (
                <div className="space-y-6">
                  {featuredBlog && (
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-lg font-bold tracking-tight">Recent Posts</h2>
                      <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                    </div>
                  )}

                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    <AnimatePresence mode="popLayout">
                      {gridBlogs.map((blog, idx) => {
                        const tagsArray = blog.tags ? blog.tags.split(',').map(t => t.trim()) : []
                        return (
                          <motion.article
                            key={blog.id}
                            layoutId={`blog-card-${blog.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="group flex flex-col rounded-3xl overflow-hidden border transition-all hover:-translate-y-1.5 hover:shadow-xl hover:border-[var(--accent)] relative bg-transparent"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-[0.02] transition-opacity z-0" />
                            {/* Card Image Banner */}
                            <Link to={`/blogs/${blog.slug}`} className="relative h-44 w-full overflow-hidden block border-b" style={{ borderColor: 'var(--border)' }}>
                              {blog.cover_image ? (
                                <img 
                                  src={blog.cover_image} 
                                  alt={blog.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${blog.category ? categoryMeta[blog.category]?.gradient || getGradient(blog.slug) : getGradient(blog.slug)} flex items-center justify-center relative transition-transform duration-500 group-hover:scale-105 opacity-90`}>
                                  <div className="absolute inset-0" style={{ backgroundImage: codePatternSvg, backgroundSize: '60px 60px' }} />
                                  <div className="absolute inset-0 bg-black/10" />
                                </div>
                              )}
                              {/* Reading Time Badge */}
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur-md z-10" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {blog.read_time || '3 min'}
                                </span>
                              </div>
                              {/* Category Icon Chip */}
                              {blog.category && (
                                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md z-10 flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                  {categoryMeta[blog.category]?.icon || <Folder size={11} />}
                                  {blog.category}
                                </div>
                              )}
                            </Link>

                            {/* Card Text Content */}
                            <div className="p-6 flex flex-col flex-1 justify-between">
                              <div>
                                {/* Metadata */}
                                <div className="flex items-center justify-between text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                                  <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {relativeDate(blog.created_at)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    {blog.category && (
                                      <span className="flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                                        {categoryMeta[blog.category]?.icon}
                                        {blog.category}
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* Title */}
                                <Link to={`/blogs/${blog.slug}`} className="relative z-10">
                                  <h3 className="text-base font-bold mb-2.5 transition-colors group-hover:text-[var(--accent)] line-clamp-2 leading-snug tracking-tight">
                                    {blog.title}
                                  </h3>
                                </Link>

                                {/* Excerpt */}
                                <p className="text-xs mb-4 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                  {blog.summary || 'Click to view the post summary, tags, outline details, and comment threads.'}
                                </p>
                              </div>

                              {/* Card Footer tags and button */}
                              <div className="relative z-10 flex-1 flex flex-col justify-end">
                                {tagsArray.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                                    {tagsArray.slice(0, 3).map((t, tagIdx) => (
                                      <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border" style={{
                                        borderColor: tagIdx === 0 ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)',
                                        background: tagIdx === 0 ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-secondary)',
                                        color: tagIdx === 0 ? 'var(--accent)' : 'var(--text-secondary)'
                                      }}>
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                  <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                    <div className="w-6 h-6 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                                      <img src={profilePicUrl} alt="Author" className="w-full h-full object-cover" loading="lazy" key={profilePicUrl} />
                                    </div>
                                    <span className="flex items-center gap-1"><Heart size={12} /> {blog.likes}</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {blog.read_time || '3 min'}</span>
                                  </div>
                                  <Link 
                                    to={`/blogs/${blog.slug}`} 
                                    className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all group-hover:gap-2.5 px-3 py-1.5 rounded-lg border border-transparent hover:border-[var(--accent)]/30"
                                    style={{ color: '#ffffff', background: 'var(--accent)' }}
                                  >
                                    Read
                                    <ArrowRight size={13} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        )
                      })}

                      {/* Render Coming Soon Placeholders to fill the 3-column grid */}
                      {Array.from({ length: 3 - (gridBlogs.length % 3) }).map((_, placeholderIdx) => (
                        <motion.div
                          key={`placeholder-${placeholderIdx}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 0.85, scale: 1 }}
                          transition={{ duration: 0.5, delay: (gridBlogs.length + placeholderIdx) * 0.05 }}
                          className="flex flex-col justify-between rounded-3xl border border-dashed p-6 min-h-[360px] select-none relative group overflow-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="space-y-4 relative z-10">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center opacity-40 border" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                              <BookOpen size={16} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {placeholderIdx === 0 ? 'Writing in Progress...' : 'Next Case Study Drafting...'}
                              </h3>
                              <p className="text-xs leading-relaxed font-medium opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                {placeholderIdx === 0 
                                  ? 'Drafting the next deep-dive on telemetry loops, scalable architectures, and advanced full-stack systems.' 
                                  : 'Fleshing out database schema autopsies, microservices migration reports, and cloud platform integrations.'}
                              </p>
                            </div>
                          </div>
                          <div className="pt-6 border-t relative z-10 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                            <span>Article</span>
                            <span>Coming Soon</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer onScrollTo={() => {}} />
        <BackToTop />
      </div>
    </>
  )
}
