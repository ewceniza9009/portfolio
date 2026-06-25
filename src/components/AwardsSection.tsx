import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Award as AwardIcon, Calendar, Building2 } from 'lucide-react'
import { Award } from '../data/awards'

interface AwardsSectionProps {
  awards: Award[]
}

export default function AwardsSection({ awards }: AwardsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="awards" className="py-32 px-6 relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px]" style={{ background: 'var(--accent)' }} />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[100px]" style={{ background: 'var(--accent-secondary)' }} />
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
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
            Awards & Recognition
          </h2>
          <p className="max-w-2xl text-lg" style={{ color: 'var(--text-secondary)' }}>
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
              className="group relative rounded-3xl overflow-hidden border flex flex-col md:flex-row w-full transition-shadow hover:shadow-2xl"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Image Section on the Left */}
              <div 
                className="w-full md:w-1/3 lg:w-1/4 p-8 flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r relative overflow-hidden" 
                style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
              >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--text-primary)_1px,_transparent_1px)] [background-size:20px_20px]" />
                
                <motion.img
                  whileHover={{ scale: 1.08, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  src={award.image}
                  alt={award.title}
                  className="w-auto h-56 md:h-64 object-contain relative z-10 rounded-2xl drop-shadow-2xl saturate-[1.15] contrast-[1.1] brightness-[1.05]"
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

                <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-300">
                  {award.title}
                </h3>
                
                <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
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
}
