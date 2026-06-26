import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Github, ExternalLink, Activity, Star } from 'lucide-react'

const GITHUB_USERNAME = 'ewceniza9009'

interface GitHubSectionProps {
  theme?: 'dark' | 'light'
}

export default function GitHubSection({ theme = 'dark' }: GitHubSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const isLight = theme === 'light'
  
  // Theme-aware GitHub stats parameters
  const bgColor = isLight ? 'ffffff' : '181818'
  const textColor = isLight ? '475569' : 'a3a3a3'
  const titleColor = isLight ? '10b981' : '22c55e'
  const iconColor = isLight ? '0ea5e9' : '14b8a6'
  const borderHidden = 'true'

  return (
    <section id="github" className="py-32 px-6 relative" style={{ background: 'var(--bg-secondary)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" style={{ background: 'var(--accent)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl" style={{ background: 'var(--accent-dim)' }}>
            <Github size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-display">
            GitHub Activity
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Active open source development and contributions
          </p>
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <Github size={18} /> @{GITHUB_USERNAME} <ExternalLink size={14} className="ml-1 opacity-50" />
          </a>
        </motion.div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Languages (Spans 2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
            className="rounded-2xl border overflow-hidden md:col-span-2 flex flex-col transition-shadow"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="p-6 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <Activity size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Top Languages</h3>
            </div>
            <div className="p-8 flex-1 flex items-center justify-center">
              <img
                src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&theme=transparent&hide_border=${borderHidden}&title_color=${titleColor}&text_color=${textColor}&bg_color=${bgColor}&layout=compact&langs_count=8`}
                alt="Top languages used across repositories"
                className="w-full max-w-3xl h-full max-h-56 object-contain drop-shadow-sm"
              />
            </div>
          </motion.div>

          {/* Overall Stats (Spans 1 column on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
            className="rounded-2xl border overflow-hidden flex flex-col transition-shadow"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="p-6 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <Star size={18} style={{ color: 'var(--accent-secondary)' }} />
              <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Overall Stats</h3>
            </div>
            <div className="p-4 sm:p-6 flex-1 flex items-center justify-center">
              <img
                src={`https://github-readme-stats.vercel.app/api?username=${GITHUB_USERNAME}&theme=transparent&hide_border=${borderHidden}&title_color=${titleColor}&text_color=${textColor}&bg_color=${bgColor}&icon_color=${iconColor}&show_icons=true&count_private=true&hide_rank=true`}
                alt="Overall GitHub Stats"
                className="w-full h-full max-h-56 object-contain drop-shadow-sm scale-110 sm:scale-[1.2]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}