import { useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import Logo from './Logo'

const NAV_ITEMS = ['Experience', 'Projects', 'Skills', 'Contact']

interface NavbarProps {
  activeSection: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onScrollTo: (id: string) => void
}

export default function Navbar({ activeSection, theme, onToggleTheme, onScrollTo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  const handleNavClick = (item: string) => {
    onScrollTo(item.toLowerCase())
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="scroll-progress"
        style={{ scaleX }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-all duration-300"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="#hero"
            onClick={(e) => { e.preventDefault(); onScrollTo('hero') }}
            className="flex items-center gap-3 text-2xl md:text-3xl font-signature text-accent"
            style={{ lineHeight: 1 }}
          >
            <Logo size={36} className="flex-shrink-0" style={{ display: 'block' }} />
            <span style={{ transform: 'translateY(2px)' }}>Erwin Wilson Ceniza</span>
          </motion.a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.toLowerCase()
              return (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                  className="relative px-4 py-2 text-sm font-medium transition-colors rounded-full"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  {/* Sliding pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 nav-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                </a>
              )
            })}

            <div className="w-px h-6 mx-3" style={{ background: 'var(--border)' }} />

            {/* Theme toggle with rotation */}
            <motion.button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="theme-toggle-btn w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark'
                    ? <Sun size={18} style={{ color: 'var(--accent)' }} />
                    : <Moon size={18} style={{ color: 'var(--accent)' }} />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Mobile Nav */}
          <div className="flex items-center gap-3 md:hidden">
            <motion.button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="theme-toggle-btn w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
              whileTap={{ scale: 0.9, rotate: 180 }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent)' }} /> : <Moon size={18} style={{ color: 'var(--accent)' }} />}
            </motion.button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {['hero', ...NAV_ITEMS.map(i => i.toLowerCase())].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                    className="text-sm font-medium capitalize px-3 py-2 rounded-lg transition-colors"
                    style={{
                      color: activeSection === item ? 'var(--accent)' : 'var(--text-secondary)',
                      background: activeSection === item ? 'var(--accent-dim)' : 'transparent',
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
