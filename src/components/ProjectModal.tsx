import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, ExternalLink } from 'lucide-react'
import { TechIcon, ImageWithFallback } from './ProjectsSection'

interface Project {
  id: number
  title: string
  subtitle: string
  description: string
  tech: string[]
  year: string
  type: string
  color: string
  repo: string | null
  demo: string | null
  video: string | null
  image: string
  fallback: string
}

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (project) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [project, handleKeyDown])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Project details: ${project.title}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media */}
            <div className="relative h-64 md:h-80" style={{ background: 'var(--bg-card)' }}>
              {project.video ? (
                <video
                  src={project.video}
                  controls
                  className="w-full h-full object-cover"
                  aria-label={`Demo video for ${project.title}`}
                />
              ) : (
                <ImageWithFallback
                  src={project.image}
                  alt={project.title}
                  fallback={project.fallback}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
                aria-label="Close project details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-2xl font-bold font-display">{project.title}</h3>
                  <p style={{ color: 'var(--accent-secondary)' }}>{project.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="font-mono text-sm px-3 py-1 rounded-full"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    {project.year}
                  </span>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background: project.type === 'Emerging' ? 'var(--accent-secondary-dim)' : 'var(--accent-dim)',
                      color: project.type === 'Emerging' ? 'var(--accent-secondary)' : 'var(--accent)'
                    }}
                  >
                    {project.type}
                  </span>
                </div>
              </div>

              <p className="mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {project.description}
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Tech Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="tag-neutral inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                    >
                      <TechIcon name={tech} />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {project.repo && (
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    <Github size={16} /> Repository
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-lg font-semibold border flex items-center gap-2 transition-all hover:scale-105"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    <ExternalLink size={16} /> Demo
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
