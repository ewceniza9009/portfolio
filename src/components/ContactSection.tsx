import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Linkedin, Github, Copy, Check, Send, Loader } from 'lucide-react'
import { getSafeItem, setSafeItem } from '../utils/storage'
import MagneticWrapper from './MagneticWrapper'

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
}

function CopyableContact({ href, icon, label, value, copyValue }: CopyableContactProps) {
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
      className="flex items-center gap-4 p-4 rounded-xl relative group border transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: 'var(--bg-secondary)', 
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <AnimatePresence>
        {copied && <CopyToast message="Copied to clipboard!" />}
      </AnimatePresence>

      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{
          background: 'var(--accent-dim)',
          color: 'var(--accent)'
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
      className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] group"
      style={{ 
        background: 'var(--bg-secondary)', 
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ 
          background: 'var(--accent-dim)', 
          color: 'var(--accent)' 
        }}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </a>
  )
}


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactSectionProps {
  theme?: 'dark' | 'light'
}

export default function ContactSection({ theme = 'dark' }: ContactSectionProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savedEmails, setSavedEmails] = useState<string[]>(() => {
    try { return JSON.parse(getSafeItem('contact_emails') || '[]') }
    catch { return [] }
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    if (!EMAIL_REGEX.test(form.email)) {
      setToast({ type: 'error', text: 'Please enter a valid email address.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setSending(true)
    try {
      const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
        ? 'http://localhost:3000'
        : ''
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setToast({ type: 'success', text: 'Message sent! I\'ll get back to you soon.' })
      const updated = savedEmails.includes(form.email) ? savedEmails : [form.email, ...savedEmails].slice(0, 10)
      setSavedEmails(updated)
      setSafeItem('contact_emails', JSON.stringify(updated))
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setToast({ type: 'error', text: 'Failed to send. Please email me directly.' })
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 4000)
    }
  }, [form, savedEmails])

  return (
    <section id="contact" className="py-32 px-6 relative overflow-hidden" style={{ background: 'var(--bg-section)' }}>
      <div className="bg-glow-blob absolute top-1/2 left-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] -translate-y-1/2 rounded-full blur-[100px] pointer-events-none" style={{ background: 'var(--accent)' }} />
      <div className="bg-glow-blob absolute top-1/2 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] -translate-y-1/2 rounded-full blur-[100px] pointer-events-none" style={{ background: 'var(--accent-secondary)' }} />

      <div className="section-divider max-w-3xl mx-auto mb-32 relative z-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-6 font-display"
        >
          Let's Build Something <span className="gradient-text">Together</span>
        </motion.h2>

        <div className="flex items-center justify-center gap-2 mb-16">
          <span className="availability-dot" />
          <p className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
            Available for new opportunities
          </p>
        </div>

        {/* Contact Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-8 md:p-12 glass shadow-2xl relative overflow-hidden mb-8 text-left"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ 
            background: 'linear-gradient(135deg, var(--accent) 0%, transparent 100%)',
            opacity: theme === 'dark' ? 0.12 : 0.015
          }} />

          <h3 className="text-xl font-semibold mb-6 text-center relative z-10">Send Me a Message</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 contact-input"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                list="saved-emails"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 contact-input"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
              <datalist id="saved-emails">
                {savedEmails.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
          </div>

          <div className="mb-4 relative z-10">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 contact-input"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="mb-6 relative z-10">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 contact-input resize-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <MagneticWrapper>
            <button
              type="submit"
              disabled={sending}
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-md hover:shadow-lg"
              style={{
                background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                color: 'var(--bg-primary)',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </MagneticWrapper>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative z-10 mt-4 px-4 py-2 rounded-xl text-sm"
                style={{
                  background: toast.type === 'success' ? 'var(--accent-dim)' : 'rgba(239,68,68,0.15)',
                  color: toast.type === 'success' ? 'var(--accent)' : '#ef4444',
                }}
              >
                {toast.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-8 md:p-12 glass shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ 
            background: 'linear-gradient(135deg, var(--accent-secondary) 0%, transparent 100%)',
            opacity: theme === 'dark' ? 0.12 : 0.015
          }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <CopyableContact
              href="mailto:erwinwilsonceniza@gmail.com"
              icon={<Mail size={22} />}
              label="Email"
              value="erwinwilsonceniza@gmail.com"
              copyValue="erwinwilsonceniza@gmail.com"
            />

            <CopyableContact
              href="tel:+639351228470"
              icon={<Phone size={22} />}
              label="Phone"
              value="+63 935-122-8470"
              copyValue="+639351228470"
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
