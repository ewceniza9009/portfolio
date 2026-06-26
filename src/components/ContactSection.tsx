import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Linkedin, Github, Copy, Check } from 'lucide-react'

function CopyToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap z-20"
      style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
    >
      {message}
    </motion.div>
  )
}

interface CopyableContactProps {
  href: string
  icon: React.ReactNode
  label: string
  value: string
  copyValue: string
  variant: 'green' | 'blue'
}

function CopyableContact({ href, icon, label, value, copyValue, variant }: CopyableContactProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [copyValue])

  return (
    <a
      href={href}
      onClick={handleCopy}
      className={`contact-card ${variant === 'green' ? 'contact-card-green' : 'contact-card-blue'} flex items-center gap-4 p-4 rounded-xl relative group`}
      style={{ background: 'var(--bg-secondary)' }}
    >
      <AnimatePresence>
        {copied && <CopyToast message="Copied to clipboard!" />}
      </AnimatePresence>

      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: variant === 'green' ? 'var(--accent)' : 'var(--accent-secondary)',
          color: variant === 'green' ? 'var(--bg-primary)' : '#fff'
        }}>
        {icon}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
        {copied ? <Check size={16} style={{ color: 'var(--accent)' }} /> : <Copy size={16} />}
      </div>
    </a>
  )
}

interface SocialLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  value: string
}

function SocialLink({ href, icon, label, value }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="contact-card contact-card-blue flex items-center gap-4 p-4 rounded-xl"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent-secondary)', color: '#fff' }}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </a>
  )
}

export default function ContactSection() {
  return (
    <section id="contact" className="py-32 px-6 relative overflow-hidden" style={{ background: 'var(--bg-section)' }}>
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] -translate-y-1/2 rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ background: 'var(--accent)' }} />
      <div className="absolute top-1/2 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] -translate-y-1/2 rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ background: 'var(--accent-secondary)' }} />
      
      {/* Section divider */}
      <div className="section-divider max-w-3xl mx-auto mb-32 relative z-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-6 font-display"
        >
          Let's Build Something <span className="gradient-text">Together</span>
        </motion.h2>

        {/* Availability indicator */}
        <div className="flex items-center justify-center gap-2 mb-16">
          <span className="availability-dot" />
          <p className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
            Available for new opportunities
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-8 md:p-12 glass shadow-2xl relative overflow-hidden"
        >
          {/* Subtle inner gradient for the glass card */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, transparent 100%)' }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <CopyableContact
              href="mailto:erwinwilsonceniza@gmail.com"
              icon={<Mail size={22} />}
              label="Email"
              value="erwinwilsonceniza@gmail.com"
              copyValue="erwinwilsonceniza@gmail.com"
              variant="green"
            />

            <CopyableContact
              href="tel:+639351228470"
              icon={<Phone size={22} />}
              label="Phone"
              value="+63 935-122-8470"
              copyValue="+639351228470"
              variant="green"
            />

            <SocialLink
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              icon={<Linkedin size={22} />}
              label="LinkedIn"
              value="erwin-wilson-ceniza"
            />

            <SocialLink
              href="https://github.com/ewceniza9009"
              icon={<Github size={22} />}
              label="GitHub"
              value="ewceniza9009"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
