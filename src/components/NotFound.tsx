import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import HeadTags from './HeadTags'
import type { AccentKey } from '../data/accents'
import { ACCENT_THEMES } from '../data/accents'
import { useBlogs } from '../hooks/usePortfolioData'
import { formatDate } from '../utils/format'
import type { Blog } from '../types/blog'

interface NotFoundProps {
  theme: 'dark' | 'light'
  accent: AccentKey
}

export default function NotFound({ theme, accent }: NotFoundProps) {
  const isDark = theme === 'dark'
  const accentColor = ACCENT_THEMES[accent][isDark ? 'dark' : 'light'].accent
  const { data: blogs = [] } = useBlogs()
  const recent = blogs.slice(0, 3)

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ background: 'var(--bg-primary)' }}>
      <HeadTags
        title="404 - Page Not Found"
        description="The page you are looking for does not exist."
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-9xl font-bold mb-4 font-display" style={{ color: accentColor }}>404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex items-center justify-center gap-3 mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-transform hover:scale-105"
            style={{ background: accentColor, color: 'var(--bg-primary)' }}
          >
            <ArrowLeft size={16} />
            Return Home
          </Link>
          <Link
            to="/blogs"
            className="inline-flex items-center px-6 py-3 rounded-full font-medium border transition-transform hover:scale-105"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Read Articles
          </Link>
        </div>

        {recent.length > 0 && (
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
              Recent Articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recent.map((b: Blog) => (
                <Link
                  key={b.id ?? b.slug}
                  to={`/blogs/${b.slug}`}
                  className="p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] block"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: 'var(--accent)' }}>
                    <FileText size={11} />
                    Article
                  </div>
                  <h3 className="text-sm font-semibold leading-snug mb-1 line-clamp-2">{b.title}</h3>
                  {b.created_at && (
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(b.created_at, { month: 'short' })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
