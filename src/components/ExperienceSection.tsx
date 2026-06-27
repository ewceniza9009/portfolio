import { motion, useInView } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useRef } from 'react'

interface Experience {
  year: string
  company: string
  location: string
  position: string
  descriptions: string[]
  technologies?: string[]
}

interface ExperienceSectionProps {
  experience: Experience[]
}

export default function ExperienceSection({ experience }: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="experience" className="py-32 px-6 relative overflow-hidden">
      {/* Soft centered fade for text readability without card edges */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-[var(--bg-primary)]"
        style={{
          opacity: 0.85,
          WebkitMaskImage: "radial-gradient(ellipse at center, black 15%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at center, black 15%, transparent 75%)",
        }}
      />
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--text-primary)_1.5px,_transparent_1.5px)] [background-size:32px_32px] pointer-events-none" />
      
      {/* Subtle glowing accents */}
      <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[120px] pointer-events-none" style={{ background: 'var(--accent)' }} />
      <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[120px] pointer-events-none" style={{ background: 'var(--accent-secondary)' }} />

      {/* Tech Doodles / Floating Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: 0.12, color: 'var(--text-secondary)' }}>
        {/* Left side curly at top */}
        <div className="absolute top-[5%] left-[2%] text-5xl font-mono font-black rotate-12 blur-[0.5px] opacity-50">
          {'{'}
        </div>

        {/* Left side code snippet */}
        <div className="absolute top-[18%] left-[3%] font-mono text-xs leading-normal tracking-tight opacity-45 blur-[0.5px]">
          <div><span className="opacity-70">const</span> build = () =&gt; {'{'}</div>
          <div className="pl-3 opacity-50">deploy();</div>
          <div>{'}'}</div>
        </div>

        {/* Left side SQL keywords */}
        <div className="absolute top-[35%] left-[8%] font-mono text-xs tracking-widest opacity-50 blur-[0.5px]">
          SELECT
        </div>
        <div className="absolute top-[38%] left-[12%] font-mono text-[10px] tracking-widest opacity-30 blur-[0.5px]">
          FROM
        </div>

        {/* Left side closing tag */}
        <div className="absolute bottom-[18%] left-[4%] text-5xl font-mono font-bold -rotate-12 blur-[0.5px]">
          {'/>'}
        </div>

        {/* Left side dots pattern */}
        <div className="absolute bottom-[8%] left-[15%] font-mono text-[10px] tracking-widest opacity-20">
          <span>.</span><span>.</span><span>.</span>
        </div>

        {/* Left side small grid */}
        <div className="absolute bottom-[12%] left-[22%] opacity-15">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="0.5">
            <line x1="0" y1="20" x2="40" y2="20" />
            <line x1="20" y1="0" x2="20" y2="40" />
          </svg>
        </div>

        {/* Right side curly at top */}
        <div className="absolute top-[15%] right-[6%] text-7xl font-mono font-black rotate-12 blur-[1px] opacity-60">
          {'{'}
        </div>

        {/* Right side zigzag */}
        <svg className="absolute top-[35%] right-[8%] w-24 h-24 -rotate-12 blur-[0.5px] opacity-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 50 L 30 20 L 50 80 L 70 20 L 90 50" />
        </svg>

        {/* Right side crosshairs */}
        <div className="absolute top-[50%] right-[5%] text-3xl font-mono tracking-[0.2em] opacity-35">
          + + +
        </div>

        {/* Right side binary */}
        <div className="absolute top-[60%] right-[10%] font-mono text-[9px] tracking-tighter opacity-20 leading-none blur-[0.5px]">
          <div>01101001</div>
          <div className="ml-2">00110111</div>
        </div>

        {/* Right side dashed circle */}
        <svg className="absolute bottom-[25%] right-[12%] w-24 h-24 rotate-12 blur-[0.5px] opacity-35" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8">
          <circle cx="50" cy="50" r="38" />
        </svg>

        {/* Right side curly at bottom */}
        <div className="absolute bottom-[12%] right-[8%] text-6xl font-mono font-black rotate-45 blur-[1px] opacity-60">
          {'}'}
        </div>

        {/* Right side brackets cluster */}
        <div className="absolute bottom-[35%] right-[5%] text-4xl font-mono opacity-25 blur-[0.5px]">
          []
        </div>
      </div>

      {/* Section divider */}
      <div className="section-divider max-w-4xl mx-auto mb-32 relative z-10" />

      <div className="max-w-4xl mx-auto" ref={sectionRef}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-2 font-display"
        >
          Experience
        </motion.h2>
        <p className="mb-16" style={{ color: 'var(--text-secondary)' }}>Professional journey</p>

        <div className="relative max-w-3xl mx-auto">
          {/* Animated timeline line */}
          <motion.div
            className="absolute left-0 top-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, var(--accent), var(--accent-secondary), transparent)' }}
            initial={{ height: 0 }}
            animate={isInView ? { height: '100%' } : { height: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
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
                {/* Timeline dot */}
                <div
                  className="absolute left-0 top-1 flex items-center justify-center -translate-x-1/2 z-10"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: isCurrent ? 'var(--accent)' : 'var(--bg-card)',
                      border: `2px solid ${isCurrent ? 'var(--accent)' : 'var(--accent-secondary)'}`,
                      boxShadow: isCurrent ? '0 0 12px var(--accent-dim)' : 'none'
                    }}
                    whileHover={{ scale: 1.5 }}
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
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        <span className="availability-dot" style={{ width: 6, height: 6 }} />
                        Current
                      </span>
                    )}
                  </div>

                  {/* Card with hover expansion */}
                  <motion.div
                    className={`p-5 rounded-xl border transition-colors ${isCurrent ? 'timeline-current' : ''}`}
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: isCurrent
                        ? '0 8px 30px rgba(34, 197, 94, 0.15)'
                        : '0 8px 30px rgba(0, 0, 0, 0.2)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <h3 className="font-bold text-base">{exp.company}</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--accent)' }}>{exp.position}</p>
                    <p className="text-xs flex items-center gap-1 mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={11} /> {exp.location}
                    </p>
                    <ul className="text-sm leading-relaxed mb-4 space-y-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {exp.descriptions.map((desc, i) => {
                        const parts = desc.split(/\*\*(.*?)\*\*/g);
                        return (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                            <span className="flex-1">
                              {parts.map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} style={{ color: 'var(--text-primary)' }}>
                                    {part}
                                  </strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                )
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    
                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        {exp.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white/5 backdrop-blur-sm border transition-colors hover:bg-white/10"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
