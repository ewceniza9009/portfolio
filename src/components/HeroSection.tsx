import { motion, useScroll, useTransform } from 'framer-motion'
import { Github, Linkedin, ChevronDown } from 'lucide-react'

interface HeroSectionProps {
  onScrollTo: (id: string) => void
}

export default function HeroSection({ onScrollTo }: HeroSectionProps) {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center px-6 pt-20 bg-[var(--bg-section)]">
      <motion.div style={{ opacity, scale }} className="text-center max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {/* Profile Photo — larger with animated ring */}
          <div className="mb-10">
            <img
              src="/img/profile-pic.png"
              alt="Erwin Wilson Ceniza"
              className="w-40 h-40 mx-auto rounded-full object-cover profile-ring"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          {/* Name — Elegant script font */}
          <h1 className="text-7xl md:text-8xl font-normal mb-4 font-signature">
            Erwin Wilson <span className="text-accent">Ceniza</span>
          </h1>

          {/* Role — subtle, secondary accent */}
          <p className="text-xl md:text-2xl font-medium mb-2 font-display text-text-secondary">
            Full Stack Developer
          </p>
          <p className="text-sm font-mono tracking-wider uppercase mb-8 text-accent-secondary">
            10+ Years · ERP · AI · SaaS
          </p>

          {/* Value proposition */}
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-text-secondary">
            Architecting secure, scalable enterprise systems — from financial platforms 
            and warehouse management to AI-powered HR solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/ewceniza9009"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 bg-accent text-bg-primary"
            >
              <Github size={18} /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold border transition-all flex items-center gap-2 hover:scale-105 border-accent text-accent"
            >
              <Linkedin size={18} /> LinkedIn
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16">
          <button onClick={() => onScrollTo('experience')} className="animate-bounce" aria-label="Scroll to experience">
            <ChevronDown size={32} className="text-accent" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  )
}
