import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Heart, Search, ArrowRight, BookOpen, Tag, Sparkles } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from './BackToTop'
import CursorFollower from './CursorFollower'
import type { AccentKey } from '../data/accents'

interface Blog {
  id: string
  slug: string
  title: string
  content: string
  summary: string | null
  tags: string | null
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

export default function BlogsPage({ theme, toggleTheme, accent, setAccent }: BlogsPageProps) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const getApiUrl = (path: string) => {
    const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3000'
      : ''
    return `${baseUrl}${path}`
  }

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

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      blogs
        .flatMap(b => b.tags ? b.tags.split(',').map(t => t.trim()) : [])
        .filter(Boolean)
    )
  )

  // Filter blogs based on search query and selected tag
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.summary && blog.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.tags && blog.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const blogTags = blog.tags ? blog.tags.split(',').map(t => t.trim()) : []
    const matchesTag = !selectedTag || blogTags.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  // Separate the latest article as Featured (if no filters are active)
  const isFiltering = searchQuery !== '' || selectedTag !== null
  const featuredBlog = !isFiltering && filteredBlogs.length > 0 ? filteredBlogs[0] : null
  const gridBlogs = featuredBlog ? filteredBlogs.slice(1) : filteredBlogs

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

  return (
    <>
      <style>{`
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
      `}</style>
      
      <CursorFollower />
      
      <div className="min-h-screen transition-colors duration-300 relative overflow-x-hidden flex flex-col justify-between" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
        
        {/* Dynamic Aurora Backdrop */}
        <div className="aurora-container">
          <div 
            className="aurora-blob w-[500px] h-[500px] -top-40 -left-40 blob-1" 
            style={{ 
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
              opacity: theme === 'dark' ? 0.12 : 0.06,
              animation: 'blob-float-1 25s infinite alternate ease-in-out'
            }} 
          />
          <div 
            className="aurora-blob w-[600px] h-[600px] top-[40vh] -right-40 blob-2" 
            style={{ 
              background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
              opacity: theme === 'dark' ? 0.1 : 0.05,
              animation: 'blob-float-2 30s infinite alternate ease-in-out'
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
          
          {/* Header */}
          <div className="text-center mb-16 relative">
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-mono tracking-wider mb-5 shadow-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--accent)' }}
            >
              <Sparkles size={12} className="animate-pulse" />
              <span>THE DEVELOPER LOGS</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5"
            >
              Stories & <span className="gradient-text">Insights</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xs sm:text-sm max-w-lg mx-auto leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              A sandbox of technical deep-dives, architectural writeups, and software guides. Fully modular, open for commenting, and interactive.
            </motion.p>
          </div>

          {/* Controls: Search and Filters */}
          <div className="mb-16 space-y-6">
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] opacity-10 group-focus-within:opacity-20 blur transition-all duration-300 pointer-events-none" />
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors group-focus-within:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search articles by title, summary or tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none focus:border-[var(--accent)] glass relative z-10 border"
                style={{ 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border)'
                }}
              />
            </div>

            {/* Tag Badges */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto select-none">
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all border active:scale-95 hover:brightness-110"
                  style={{
                    background: selectedTag === null ? 'var(--accent)' : 'var(--bg-secondary)',
                    borderColor: selectedTag === null ? 'var(--accent)' : 'var(--border)',
                    color: selectedTag === null ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    boxShadow: selectedTag === null ? '0 4px 12px var(--accent-dim)' : 'none'
                  }}
                >
                  All Posts
                </button>
                {allTags.map(tag => {
                  const active = selectedTag === tag
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(active ? null : tag)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 active:scale-95 hover:brightness-110"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--bg-secondary)',
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        boxShadow: active ? '0 4px 12px var(--accent-dim)' : 'none'
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </button>
                  )
                })}
              </div>
            )}
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
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border glass" style={{ borderColor: 'var(--border)' }}>
              <BookOpen size={48} className="mx-auto mb-4 opacity-30 text-accent animate-pulse" style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No articles match your filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedTag(null) }}
                className="mt-4 text-xs font-bold uppercase tracking-wider text-accent border border-[var(--accent)] px-4 py-2 rounded-xl transition-all hover:bg-[var(--accent-dim)]"
                style={{ color: 'var(--accent)' }}
              >
                Clear Search & Tags
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* FEATURED POST (Splits layout, 12-column Grid) */}
              {featuredBlog && (
                <motion.article
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="group rounded-3xl overflow-hidden border glass transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:h-[400px]">
                    {/* Left: Featured Image Cover */}
                    <div className="md:col-span-7 h-64 md:h-full overflow-hidden relative">
                      <Link to={`/blogs/${featuredBlog.slug}`} className="w-full h-full block">
                        {featuredBlog.cover_image ? (
                          <img 
                            src={featuredBlog.cover_image} 
                            alt={featuredBlog.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getGradient(featuredBlog.slug)} flex items-center justify-center p-6 transition-transform duration-700 group-hover:scale-[1.03]`}>
                            <div className="absolute inset-0 bg-black/10" />
                            <span className="font-mono text-xs text-white/90 uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md z-10 shadow-lg">
                              ★ Featured Article
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Right: Featured Text Metadata */}
                    <div className="md:col-span-5 p-8 flex flex-col justify-between h-full border-t md:border-t-0 md:border-l" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        {/* Featured Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent mb-4" style={{ color: 'var(--accent)' }}>
                          <Sparkles size={12} className="animate-pulse" />
                          <span>Latest Post</span>
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
                            {formatDate(featuredBlog.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {featuredBlog.read_time || '5 min read'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            <Heart size={12} className="text-red-500 fill-current" />
                            {featuredBlog.likes} likes
                          </span>
                          <Link 
                            to={`/blogs/${featuredBlog.slug}`} 
                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all group-hover:gap-2.5 text-accent"
                            style={{ color: 'var(--accent)' }}
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
              {gridBlogs.length > 0 && (
                <div className="space-y-6">
                  {featuredBlog && (
                    <h2 className="text-xs uppercase font-mono tracking-widest border-b pb-3 mb-6" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Recent Articles
                    </h2>
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
                            className="group flex flex-col rounded-3xl overflow-hidden border glass transition-all hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.12)] hover:border-[var(--accent)] shadow-md"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                          >
                            {/* Card Image Banner */}
                            <Link to={`/blogs/${blog.slug}`} className="relative h-44 w-full overflow-hidden block">
                              {blog.cover_image ? (
                                <img 
                                  src={blog.cover_image} 
                                  alt={blog.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getGradient(blog.slug)} flex items-center justify-center relative p-6 transition-transform duration-500 group-hover:scale-105`}>
                                  <div className="absolute inset-0 bg-black/10" />
                                  <span className="font-mono text-[10px] text-white/80 uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md z-10">
                                    Technical writeup
                                  </span>
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
                                    {formatDate(blog.created_at)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={11} />
                                    {blog.read_time || '3 min read'}
                                  </span>
                                </div>

                                {/* Title */}
                                <Link to={`/blogs/${blog.slug}`}>
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
                              <div>
                                {tagsArray.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                                    {tagsArray.slice(0, 3).map(t => (
                                      <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                  <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    <Heart size={11} className="text-red-500 fill-current" />
                                    {blog.likes}
                                  </span>
                                  <Link 
                                    to={`/blogs/${blog.slug}`} 
                                    className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all group-hover:gap-2 text-accent"
                                    style={{ color: 'var(--accent)' }}
                                  >
                                    Read More
                                    <ArrowRight size={13} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        )
                      })}
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
