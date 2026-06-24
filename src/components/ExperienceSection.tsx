import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface Experience {
  year: string
  company: string
  location: string
  position: string
  description: string
}

interface ExperienceSectionProps {
  experience: Experience[]
}

export default function ExperienceSection({ experience }: ExperienceSectionProps) {
  return (
    <section id="experience" className="py-32 px-6" style={{ background: 'var(--bg-section-alt)' }}>
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-2 font-display"
        >
          Experience
        </motion.h2>
        <p className="mb-16" style={{ color: 'var(--text-secondary)' }}>Professional journey</p>

        <div className="relative max-w-3xl mx-auto">
          {/* Timeline line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, var(--accent), var(--accent-secondary), transparent)' }}
          />

          {experience.map((exp, index) => {
            const isCurrent = index === 0

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.12 }}
                className="relative pl-12 pb-8 md:pb-12 last:pb-0"
              >
                {/* Year label instead of number */}
                <div
                  className="absolute left-0 top-1 flex items-center justify-center -translate-x-1/2 z-10"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: isCurrent ? 'var(--accent)' : 'var(--bg-card)',
                      border: `2px solid ${isCurrent ? 'var(--accent)' : 'var(--accent-secondary)'}`,
                      boxShadow: isCurrent ? '0 0 12px var(--accent-dim)' : 'none'
                    }}
                  />
                </div>

                <div>
                  {/* Year badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest font-mono"
                      style={{ color: isCurrent ? 'var(--accent)' : 'var(--accent-secondary)' }}
                    >
                      {exp.year}
                    </span>
                    {isCurrent && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        Current
                      </span>
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`p-5 rounded-xl border transition-all ${isCurrent ? 'timeline-current' : ''}`}
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <h3 className="font-bold text-base">{exp.company}</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--accent)' }}>{exp.position}</p>
                    <p className="text-xs flex items-center gap-1 mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={11} /> {exp.location}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {exp.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
