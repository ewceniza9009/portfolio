import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import HeadTags from './HeadTags'
import type { AccentKey } from '../data/accents'
import { ACCENT_THEMES } from '../data/accents'

interface NotFoundProps {
  theme: 'dark' | 'light'
  accent: AccentKey
}

export default function NotFound({ theme, accent }: NotFoundProps) {
  const isDark = theme === 'dark'
  const accentColor = ACCENT_THEMES[accent][isDark ? 'dark' : 'light'].accent

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ background: 'var(--bg-primary)' }}>
      <HeadTags 
        title="404 - Page Not Found"
        description="The page you are looking for does not exist."
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold mb-4 font-display" style={{ color: accentColor }}>404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center px-6 py-3 rounded-full text-white font-medium transition-transform hover:scale-105"
          style={{ background: accentColor }}
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  )
}
