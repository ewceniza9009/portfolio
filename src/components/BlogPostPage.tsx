import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Heart, Share2, ArrowLeft, MessageSquare, Send, Check, Copy, Twitter, Linkedin, BookOpen, Sparkles, Tag, Folder } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from './BackToTop'
import CursorFollower from './CursorFollower'
import { parseMarkdown } from '../utils/markdown'
import PayPalDonate from './PayPalDonate'
import HeadTags from './HeadTags'
import type { AccentKey } from '../data/accents'
import { useProfilePic } from '../utils/profilePic'

function getApiUrl(path: string): string {
  const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:3000'
    : ''
  return `${baseUrl}${path}`
}

function getGradient(slug: string): string {
  const gradients = [
    'from-rose-500/80 to-orange-500/80',
    'from-emerald-500/80 to-teal-500/80',
    'from-cyan-500/80 to-blue-500/80',
    'from-purple-500/80 to-pink-500/80',
    'from-amber-500/80 to-red-500/80',
    'from-indigo-500/80 to-purple-500/80'
  ]
  let hash = 0
  for (let i = 0; i < (slug || '').length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500/20 text-red-500 border-red-500/30',
    'bg-orange-500/20 text-orange-500 border-orange-500/30',
    'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    'bg-green-500/20 text-green-500 border-green-500/30',
    'bg-blue-500/20 text-blue-500 border-blue-500/30',
    'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
    'bg-purple-500/20 text-purple-500 border-purple-500/30',
    'bg-pink-500/20 text-pink-500 border-pink-500/30'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const BLOG_POST_STYLES = `
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
  .article-content h1, 
  .article-content h2, 
  .article-content h3 {
    scroll-margin-top: 100px;
  }
`

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

interface Comment {
  id: string
  blog_id: string
  author_name: string
  author_email: string | null
  content: string
  created_at: string
}

interface BlogPostPageProps {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  accent: AccentKey
  setAccent: React.Dispatch<React.SetStateAction<AccentKey>>
}

export default function BlogPostPage({ theme, toggleTheme, accent, setAccent }: BlogPostPageProps) {
  const { slug } = useParams<{ slug: string }>()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const { url: profilePicUrl } = useProfilePic()

  // Likes state
  const [likes, setLikes] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)

  // PayPal donate URL fetched from /api/settings
  const [paypalUrl, setPaypalUrl] = useState<string>('')

  // Share menu state
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Comment form state
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    async function fetchBlogAndComments() {
      try {
        const blogRes = await fetch(getApiUrl(`/api/blogs/${slug}`))
        if (!blogRes.ok) throw new Error('Blog not found')
        const blogData = (await blogRes.json()) as Blog
        setBlog(blogData)
        setLikes(blogData.likes)

        // Check if user has already liked this post from localStorage
        try {
          const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]') as string[]
          if (likedPosts.includes(blogData.id)) {
            setHasLiked(true)
          }
        } catch {}

        // Fetch comments
        const commentsRes = await fetch(getApiUrl(`/api/blogs/${blogData.id}/comments`))
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setComments(commentsData)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchBlogAndComments()
    }
  }, [slug])

  // Fetch PayPal donate URL once at mount (cached, not per blog)
  useEffect(() => {
    let aborted = false
    const cached = sessionStorage.getItem('paypal_donate_url')
    if (cached !== null) {
      setPaypalUrl(cached)
      return
    }
    fetch(getApiUrl('/api/settings'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (aborted) return
        const url = data?.paypal_donate_url || ''
        setPaypalUrl(url)
        try { sessionStorage.setItem('paypal_donate_url', url) } catch {}
      })
      .catch(() => {})
    return () => { aborted = true }
  }, [])

  const handleLike = async () => {
    if (!blog || hasLiked) return

    try {
      const res = await fetch(getApiUrl(`/api/blogs/${blog.id}/like`), {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setLikes(data.likes)
        setHasLiked(true)

        // Save liked status to localStorage
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]') as string[]
        likedPosts.push(blog.id)
        localStorage.setItem('liked_posts', JSON.stringify(likedPosts))
      }
    } catch (err) {
      console.error('Failed to like post:', err)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blog || !authorName.trim() || !commentContent.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(getApiUrl(`/api/blogs/${blog.id}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName,
          author_email: authorEmail || null,
          content: commentContent
        })
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => [newComment, ...prev])
        setAuthorName('')
        setAuthorEmail('')
        setCommentContent('')
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const parsedContent = useMemo(() => blog ? parseMarkdown(blog.content, theme, accent) : '', [blog, theme, accent])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)' }}>
        <Navbar activeSection="blog" theme={theme} onToggleTheme={toggleTheme} onScrollTo={() => {}} accent={accent} onChangeAccent={setAccent} />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm text-secondary" style={{ color: 'var(--text-secondary)' }}>Loading article content...</span>
        </div>
        <Footer onScrollTo={() => {}} />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)' }}>
        <Navbar activeSection="blog" theme={theme} onToggleTheme={toggleTheme} onScrollTo={() => {}} accent={accent} onChangeAccent={setAccent} />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4 px-6 text-center">
          <h2 className="text-2xl font-bold">Article Not Found</h2>
          <p className="text-sm text-secondary max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            The blog post you are looking for may have been removed, drafted or renamed.
          </p>
          <Link to="/blogs" className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-accent border border-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all">
            Return to Articles
          </Link>
        </div>
        <Footer onScrollTo={() => {}} />
      </div>
    )
  }

  const tagsArray = blog.tags ? blog.tags.split(',').map(t => t.trim()) : []
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this writeup: "${blog.title}"`)}&url=${encodeURIComponent(window.location.href)}`
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`

  return (
    <>
      <HeadTags
        title={blog.title}
        description={blog.summary || undefined}
        url={`/blogs/${blog.slug}`}
        image={blog.cover_image || undefined}
        type="article"
        imageAlt={blog.title}
      />
      <style>{BLOG_POST_STYLES}</style>
      
      <CursorFollower />
      
      {/* Article Read Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[var(--accent)] origin-left z-[100]"
        style={{ scaleX, boxShadow: "0 0 10px var(--accent)" }}
      />
      
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

        <main className="flex-grow max-w-4xl w-full mx-auto px-6 pt-28 pb-20 relative z-10 select-text">
          {/* Back button */}
          <Link 
            to="/blogs" 
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-10 transition-colors hover:text-[var(--accent)] group select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Back to Articles
          </Link>

          {/* Article Header */}
          <header className="mb-8 relative">
            {/* Author byline with badge */}
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={profilePicUrl} 
                alt="Erwin Wilson Ceniza" 
                className="w-12 h-12 rounded-full border-2"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                <Sparkles size={12} className="animate-pulse" />
                <span>THE DEVELOPER LOGS</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs border-b pb-6" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDate(blog.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {blog.read_time || '5 min read'}
              </span>
              {blog.category && (
                <Link 
                  to={`/blogs?category=${encodeURIComponent(blog.category)}`}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all hover:brightness-110"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                >
                  <Folder size={11} />
                  {blog.category}
                </Link>
              )}
              <span className="flex items-center gap-1.5">
                <Heart size={13} className="text-red-500 fill-current" />
                {likes} likes
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={13} />
                {comments.length} comments
              </span>
            </div>
          </header>

          {/* Banner cover image */}
          <div className="rounded-3xl overflow-hidden mb-10 h-56 sm:h-72 md:h-80 w-full border relative" style={{ borderColor: 'var(--border)' }}>
            {blog.cover_image ? (
              <img 
                src={blog.cover_image} 
                alt={blog.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getGradient(blog.slug)} flex items-center justify-center relative p-6`}>
                <div className="absolute inset-0 bg-black/10" />
                <BookOpen size={64} className="text-white/30 backdrop-blur-md p-3.5 rounded-3xl border border-white/10 shadow-2xl" />
              </div>
            )}
          </div>

          {/* Tags */}
          {tagsArray.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 select-none">
              {tagsArray.map(t => (
                <span 
                  key={t} 
                  className="px-3.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-sm" 
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  <Tag size={10} />
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Article Render Content */}
          <article className="prose max-w-none mb-12 leading-relaxed select-text text-sm sm:text-base article-content">
            {parsedContent}
          </article>

          <div className="mb-8">
            <PayPalDonate url={paypalUrl} variant="inline" />
          </div>

          {/* Written By Author Card */}
          <section className="p-6 rounded-3xl border glass mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6 select-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <img src={profilePicUrl} alt="Erwin Wilson Ceniza" className="w-full h-full object-cover rounded-2xl" key={profilePicUrl} />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold flex items-center justify-center sm:justify-start gap-1.5">
                Written by Erwin Wilson Ceniza
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Available for work" />
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Full Stack Developer with 10+ years building ERP, Line of Business & AI integrated web applications.
              </p>
            </div>
          </section>

          {/* Reader Actions (Likes + Sharing) */}
          <div className="flex items-center justify-between border-t border-b py-5 mb-12 select-none gap-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleLike}
                disabled={hasLiked}
                whileTap={{ scale: 0.93 }}
                className="flex items-center gap-2 px-5 py-3 rounded-full border text-xs font-bold transition-all relative overflow-hidden shadow-sm"
                style={{
                  background: hasLiked ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                  borderColor: hasLiked ? 'var(--accent)' : 'var(--border)',
                  color: hasLiked ? 'var(--accent)' : 'var(--text-primary)'
                }}
              >
                <Heart size={14} className={hasLiked ? 'text-red-500 fill-current' : 'text-text-secondary'} />
                <span>{hasLiked ? 'Liked!' : 'Like Article'}</span>
                <span className="opacity-80 border-l pl-2.5" style={{ borderColor: 'var(--border)' }}>{likes}</span>
              </motion.button>
              <PayPalDonate url={paypalUrl} variant="compact" />
            </div>

            {/* Share Popover */}
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="flex items-center gap-2 px-5 py-3 rounded-full border text-xs font-bold bg-[var(--bg-secondary)] border-[var(--border)] transition-all hover:brightness-110 shadow-sm"
              >
                <Share2 size={14} />
                Share
              </button>

              <AnimatePresence>
                {shareOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 bottom-full mb-3 w-48 rounded-2xl p-2 glass border shadow-2xl z-40"
                      style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}
                    >
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors hover:bg-[var(--accent-dim)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {copied ? (
                          <>
                            <Check size={14} className="text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={twitterShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors hover:bg-[var(--accent-dim)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Twitter size={14} />
                        <span>Share on X</span>
                      </a>
                      <a
                        href={linkedinShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors hover:bg-[var(--accent-dim)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Linkedin size={14} />
                        <span>Share on LinkedIn</span>
                      </a>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Comments Section */}
          <section className="space-y-6 select-text">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
              Comments ({comments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="p-6 rounded-3xl border glass space-y-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Sparkles size={12} className="text-accent" style={{ color: 'var(--accent)' }} />
                Leave a comment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Name *</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)] border"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email (optional, not public)</label>
                  <input
                    type="email"
                    value={authorEmail}
                    onChange={e => setAuthorEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)] border"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Comment *</label>
                <textarea
                  required
                  rows={4}
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Share your thoughts or ask a question about this writeup..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)] border resize-y"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                />
              </div>
              <button
                type="submit"
                disabled={submittingComment}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--bg-primary)] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 transition-all select-none"
              >
                {submittingComment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--bg-primary)', borderTopColor: 'transparent' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Post Comment
                  </>
                )}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-3xl" style={{ borderColor: 'var(--border)' }}>
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment, index) => (
                    <div key={comment.id} className={`flex gap-4 ${index !== 0 ? 'pt-5 border-t' : ''}`} style={{ borderColor: 'var(--border)' }}>
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${getAvatarColor(comment.author_name)}`}>
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Content Column */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold">{comment.author_name}</h4>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {new Date(comment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed select-text whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer onScrollTo={() => {}} />
        <BackToTop />
      </div>
    </>
  )
}
