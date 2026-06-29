import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Palette, BookOpen } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { ACCENT_THEMES } from '../data/accents'
import type { AccentKey } from '../data/accents'

const NAV_ITEMS = ['About', 'Experience', 'Awards', 'Projects', 'Gallery', 'GitHub', 'Skills', 'Contact']

interface NavbarProps {
  activeSection: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onScrollTo: (id: string) => void
  accent: AccentKey
  onChangeAccent: (key: AccentKey) => void
}

function AccentDropdown({ accent, onChangeAccent, theme }: { accent: AccentKey, onChangeAccent: (key: AccentKey) => void, theme: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Customize accent color"
        className="no-ripple w-10 h-10 rounded-full flex items-center justify-center border relative transition-transform hover:scale-105"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--accent)' }}
        whileTap={{ scale: 0.95 }}
      >
        <Palette size={18} />
        <span 
          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/40" 
          style={{ background: 'var(--accent)' }} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 rounded-2xl p-2 glass shadow-xl z-50 border"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 mb-1 text-muted" style={{ color: 'var(--text-muted)' }}>
              Branding Color
            </div>
            {Object.entries(ACCENT_THEMES).map(([key, data]) => {
              const active = accent === key
              const colorDot = theme === 'dark' ? data.dark.accent : data.light.accent
              
              return (
                <button
                  key={key}
                  onClick={() => { onChangeAccent(key as AccentKey); setIsOpen(false) }}
                  className="no-ripple w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors hover:bg-[var(--accent-dim)]"
                  style={{ 
                    color: active ? 'var(--accent)' : 'var(--text-secondary)'
                  }}
                >
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: colorDot }} />
                  <span className="truncate">{data.name.split(' (')[0]}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar({ activeSection, theme, onToggleTheme, onScrollTo, accent, onChangeAccent }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/' || location.pathname === ''

  const handleNavClick = (item: string) => {
    onScrollTo(item.toLowerCase())
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {isHomePage ? (
            <motion.a
              href="#hero"
              onClick={(e) => { e.preventDefault(); onScrollTo('hero') }}
              className="flex items-center gap-3 font-signature text-accent"
              style={{ lineHeight: 1 }}
            >
              <Logo size={36} className="flex-shrink-0" style={{ display: 'block' }} />
            </motion.a>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-3 font-signature text-accent transition-transform hover:scale-105"
              style={{ lineHeight: 1 }}
            >
              <Logo size={36} className="flex-shrink-0" style={{ display: 'block' }} />
            </Link>
          )}

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = isHomePage && activeSection === item.toLowerCase()
              
              return isHomePage ? (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                  className="relative px-4 py-2 text-sm font-medium transition-colors rounded-full"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 nav-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                </a>
              ) : (
                <Link
                  key={item}
                  to={`/#${item.toLowerCase()}`}
                  className="relative px-4 py-2 text-sm font-medium transition-colors rounded-full"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="relative z-10">{item}</span>
                </Link>
              )
            })}

            <div className="w-px h-6 mx-3" style={{ background: 'var(--border)' }} />

            {/* Highlighted Blog CTA button */}
            <Link
              to="/blogs"
              className="relative px-4 py-1.5 ml-1 text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 border overflow-hidden group shadow-sm hover:scale-105 active:scale-95 select-none"
              style={{
                borderColor: 'var(--accent)',
                color: location.pathname.startsWith('/blogs') ? 'var(--bg-primary)' : 'var(--accent)',
                background: location.pathname.startsWith('/blogs') ? 'var(--accent)' : 'var(--accent-dim)',
                boxShadow: '0 0 12px var(--accent-dim)'
              }}
            >
              <BookOpen size={14} className="group-hover:rotate-6 transition-transform" />
              <span>Blog</span>
            </Link>

            <div className="w-px h-6 mx-3" style={{ background: 'var(--border)' }} />

            <AccentDropdown accent={accent} onChangeAccent={onChangeAccent} theme={theme} />

            <div className="w-px h-6 mx-3" style={{ background: 'var(--border)' }} />

            {/* Theme toggle with rotation */}
            <motion.button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="no-ripple theme-toggle-btn w-10 h-10 rounded-full flex items-center justify-center border"
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-4 flex flex-col gap-1"
            >
              {['hero', ...NAV_ITEMS.map(i => i.toLowerCase())].map((item) => {
                const isActive = isHomePage && activeSection === item

                return isHomePage ? (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
                    className="text-sm font-medium capitalize px-3 py-2 rounded-lg transition-colors"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                    }}
                  >
                    {item}
                  </a>
                ) : (
                  <Link
                    key={item}
                    to={`/#${item}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium capitalize px-3 py-2 rounded-lg transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item}
                  </Link>
                )
              })}

              {/* Mobile Blog Button */}
              <Link
                to="/blogs"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 mx-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-2 border select-none transition-all"
                style={{
                  borderColor: 'var(--accent)',
                  color: location.pathname.startsWith('/blogs') ? 'var(--bg-primary)' : 'var(--accent)',
                  background: location.pathname.startsWith('/blogs') ? 'var(--accent)' : 'var(--accent-dim)',
                  boxShadow: '0 0 10px var(--accent-dim)'
                }}
              >
                <BookOpen size={14} />
                <span>Blog</span>
              </Link>

              {/* Mobile Accent Selector */}
              <div className="mt-4 pt-4 border-t flex flex-col gap-2.5" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase font-bold tracking-wider px-3 text-muted" style={{ color: 'var(--text-muted)' }}>
                  Branding Color
                </span>
                <div className="flex items-center gap-3 px-3">
                  {Object.entries(ACCENT_THEMES).map(([key, data]) => {
                    const active = accent === key
                    const colorDot = theme === 'dark' ? data.dark.accent : data.light.accent
                    return (
                      <button
                        key={key}
                        onClick={() => onChangeAccent(key as AccentKey)}
                        aria-label={`Select ${data.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                        style={{ 
                          background: colorDot,
                          boxShadow: active ? `0 0 10px ${colorDot}` : 'none',
                          border: active ? '2px solid var(--text-primary)' : '1px solid var(--border)'
                        }}
                      >
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </nav>
    </>
  )
}
