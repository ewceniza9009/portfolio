import { motion } from 'framer-motion'
import { Coffee, Heart, ExternalLink } from 'lucide-react'

interface PayPalDonateProps {
  url?: string
  variant?: 'inline' | 'compact'
}

const DEFAULT_URL = 'https://paypal.me/ewceniza'

export function getPayPalDonateUrl(url?: string): string {
  const finalUrl = url || DEFAULT_URL
  if (!finalUrl || finalUrl.trim() === '') return DEFAULT_URL
  return finalUrl.trim()
}

export default function PayPalDonate({ url, variant = 'inline' }: PayPalDonateProps) {
  const finalUrl = getPayPalDonateUrl(url)

  if (variant === 'compact') {
    return (
      <motion.a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-xs font-bold shadow-md transition-all"
        style={{
          background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
          borderColor: '#003087',
          color: '#ffffff'
        }}
        title="Support my work with a donation via PayPal"
      >
        <Coffee size={14} className="group-hover:rotate-12 transition-transform" />
        <span>Buy me a coffee</span>
        <ExternalLink size={11} className="opacity-70 group-hover:opacity-100" />
      </motion.a>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="my-12 p-6 sm:p-8 rounded-3xl border relative overflow-hidden select-none"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-card)'
      }}
    >
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0070ba 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffc439 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col sm:flex-row items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
            boxShadow: '0 6px 20px rgba(0, 48, 135, 0.35)'
          }}
        >
          <Coffee size={26} className="text-white" strokeWidth={2.2} />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h4 className="text-base sm:text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
            <Heart size={15} className="text-red-500 fill-current" />
            Enjoyed this read?
          </h4>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            If this article helped you, consider fueling the next one with a small donation via PayPal.
            Every contribution keeps me writing.
          </p>
        </div>

        <motion.a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-5 py-3 rounded-full border text-xs sm:text-sm font-bold shadow-lg transition-all flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
            borderColor: '#003087',
            color: '#ffffff'
          }}
        >
          <Coffee size={15} />
          <span>Buy me a coffee</span>
          <ExternalLink size={12} className="opacity-70" />
        </motion.a>
      </div>
    </motion.section>
  )
}
