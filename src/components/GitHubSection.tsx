import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Github, ExternalLink } from 'lucide-react'

const GITHUB_USERNAME = 'ewceniza9009'

export default function GitHubSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="github" className="py-32 px-6 relative" style={{ background: 'var(--bg-secondary)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" style={{ background: 'var(--accent)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={sectionRef}>
        {/* Section header with icon - matches Awards section pattern */}
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
            GitHub
          </h2>
          <p className="mb-16" style={{ color: 'var(--text-secondary)' }}>
            Active open source development across the .NET ecosystem
          </p>
        </motion.div>

        {/* GitHub Content Card - matches project card style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <Github size={20} style={{ color: 'var(--accent)' }} />
              <span className="font-semibold">@{GITHUB_USERNAME}</span>
            </div>
            <a
              href={`https://github.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              <ExternalLink size={14} />
              View Profile
            </a>
          </div>
          <div className="p-8">
            <img
              src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&theme=transparent&hide_border=true&title_color=22c55e&text_color=a3a3a3&bg_color=181818&layout=compact`}
              alt="Top languages used across repositories"
              className="w-full max-h-40 object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}