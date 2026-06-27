import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ExternalLink } from 'lucide-react'

interface ResumeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold">Resume</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Erwin Wilson Ceniza — Full Stack Developer</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/Resume2026.4.pdf"
                  download="Erwin_Wilson_Ceniza_Resume.pdf"
                  className="p-2.5 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-xs font-semibold"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href="/Resume2026.4.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-xs font-semibold"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open Fullscreen</span>
                </a>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl transition-all hover:scale-105 flex items-center justify-center"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document body / iframe */}
            <div className="flex-grow bg-[#525659] relative flex items-center justify-center">
              <iframe
                src="/Resume2026.4.pdf#toolbar=0"
                title="Erwin Wilson Ceniza Resume"
                className="w-full h-full border-none relative z-10"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-0 bg-slate-900 text-white">
                <p className="text-lg font-medium mb-4">PDF Preview is not supported by your browser.</p>
                <a
                  href="/Resume2026.4.pdf"
                  download="Erwin_Wilson_Ceniza_Resume.pdf"
                  className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  <Download size={18} /> Download PDF Instead
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
