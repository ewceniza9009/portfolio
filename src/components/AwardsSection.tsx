import { motion, useInView } from 'framer-motion'
import React, { useRef } from 'react'
import { Award as AwardIcon, Calendar, Building2 } from 'lucide-react'
import { Award } from '../data/awards'

interface AwardsSectionProps {
  awards: Award[]
}

export default React.memo(function AwardsSection({ awards }: AwardsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="awards" className="py-32 px-6 relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-glow-blob absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'var(--accent)' }} />
        <div className="bg-glow-blob absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'var(--accent-secondary)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl" style={{ background: 'var(--accent-dim)' }}>
            <AwardIcon size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-display">
            Awards & Recognition
          </h2>
          <p className="mb-16" style={{ color: 'var(--text-secondary)' }}>
            Milestones and achievements recognized throughout my career journey.
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {awards.map((award, index) => (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
              className="group relative rounded-3xl overflow-hidden border flex flex-col md:flex-row w-full transition-shadow hover:shadow-lg"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Image Section on the Left */}
              <div 
                className="w-full md:w-1/3 lg:w-1/4 p-8 flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r relative overflow-hidden" 
                style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
              >
                {/* Tech doodles background */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  style={{ opacity: 0.25 }}
                  viewBox="0 0 400 600"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Grid dots */}
                  <pattern id={`awardsDots-${award.id}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="var(--accent)" opacity="0.6" />
                  </pattern>
                  <rect width="100%" height="100%" fill={`url(#awardsDots-${award.id})`} />

                  {/* Angle brackets */}
                  <text x="40" y="80" fontSize="48" fontFamily="monospace" fontWeight="700" fill="var(--accent)" opacity="0.8">&lt;/&gt;</text>
                  <text x="280" y="140" fontSize="36" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.7">{"{"} {"}"}</text>
                  <text x="60" y="320" fontSize="28" fontFamily="monospace" fill="var(--accent)" opacity="0.6">const</text>
                  <text x="300" y="420" fontSize="32" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.65">=&gt;</text>
                  <text x="80" y="520" fontSize="24" fontFamily="monospace" fill="var(--accent)" opacity="0.55">async</text>

                  {/* Horizontal connector lines */}
                  <line x1="120" y1="85" x2="200" y2="85" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
                  <line x1="100" y1="200" x2="150" y2="200" stroke="var(--accent-secondary)" strokeWidth="1" opacity="0.6" />
                  <line x1="250" y1="350" x2="330" y2="350" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />

                  {/* Floating circles */}
                  <circle cx="350" cy="60" r="6" fill="var(--accent)" opacity="0.7" />
                  <circle cx="50" cy="420" r="8" fill="var(--accent-secondary)" opacity="0.6" />
                  <circle cx="320" cy="530" r="5" fill="var(--accent)" opacity="0.8" />

                  {/* Decorative small plus signs */}
                  <text x="200" y="480" fontSize="20" fontFamily="monospace" fill="var(--accent)" opacity="0.6">+</text>
                  <text x="340" y="280" fontSize="18" fontFamily="monospace" fill="var(--accent-secondary)" opacity="0.55">*</text>
                  <text x="100" y="580" fontSize="16" fontFamily="monospace" fill="var(--accent)" opacity="0.5">#</text>
                </svg>
                
                <motion.img
                  whileHover={{ scale: 1.08, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  src={award.image}
                  alt={award.title}
                  loading="lazy"
                  className="w-auto h-56 md:h-64 object-contain relative z-10 rounded-2xl drop-shadow-md saturate-[1.15] contrast-[1.1] brightness-[1.05]"
                />
              </div>

              {/* Content Section on the Right */}
              <div className="p-8 md:p-10 flex-1 flex flex-col justify-center relative z-20">
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm font-semibold tracking-wide">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    <Calendar size={14} />
                    {award.date}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Building2 size={14} />
                    {award.company}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-300">
                  {award.title}
                </h3>
                
                <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  {award.description}
                </p>

                {/* Decorative arrow/line that expands on hover/focus */}
                <div className="mt-8 flex items-center gap-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-300">
                  <div className="h-px w-12" style={{ background: 'var(--accent)' }} />
                  <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Recognized</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})
