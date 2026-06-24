import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, Github } from 'lucide-react'

export default function ContactSection() {
  return (
    <section id="contact" className="py-32 px-6" style={{ background: 'var(--bg-section)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-4 font-display"
        >
          Let's Build Something Together
        </motion.h2>
        <p className="mb-12" style={{ color: 'var(--text-secondary)' }}>
          Available for new projects and opportunities
        </p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 md:p-12 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <a
              href="mailto:erwinwilsonceniza@gmail.com"
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                <Mail size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
                <p className="text-sm font-medium">erwinwilsonceniza@gmail.com</p>
              </div>
            </a>

            <a
              href="tel:+639351228470"
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                <Phone size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Phone</p>
                <p className="text-sm font-medium">+63 935-122-8470</p>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-secondary)', color: '#fff' }}>
                <Linkedin size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>LinkedIn</p>
                <p className="text-sm font-medium">erwin-wilson-ceniza</p>
              </div>
            </a>

            <a
              href="https://github.com/ewceniza9009"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-secondary)', color: '#fff' }}>
                <Github size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>GitHub</p>
                <p className="text-sm font-medium">ewceniza9009</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
