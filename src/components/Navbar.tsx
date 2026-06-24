import { useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'

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
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="#hero"
            onClick={(e) => { e.preventDefault(); onScrollTo('hero') }}
            className="text-2xl md:text-3xl font-signature text-accent"
          >
            Erwin Wilson Ceniza
          </motion.a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                className={`nav-link text-sm font-medium transition-colors ${activeSection === item.toLowerCase() ? 'active' : ''}`}
                style={{ color: activeSection === item.toLowerCase() ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                {item}
              </a>
            ))}
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent)' }} /> : <Moon size={18} style={{ color: 'var(--accent)' }} />}
            </button>
          </div>

          {/* Mobile Nav */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent)' }} /> : <Moon size={18} style={{ color: 'var(--accent)' }} />}
            </button>
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
              <div className="px-6 py-4 flex flex-col gap-4">
                {['hero', ...NAV_ITEMS.map(i => i.toLowerCase())].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                    className="text-sm font-medium capitalize"
                    style={{ color: activeSection === item ? 'var(--accent)' : 'var(--text-secondary)' }}
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
