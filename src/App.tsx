import { useState, useEffect, useMemo, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import projects from './data/projects'
import experience from './data/experience'
import skills from './data/skills'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import AboutSection from './components/AboutSection'
import ExperienceSection from './components/ExperienceSection'
import ProjectsSection from './components/ProjectsSection'
import ProjectModal from './components/ProjectModal'
import SkillsSection from './components/SkillsSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import AwardsSection from './components/AwardsSection'
import BackToTop from './components/BackToTop'
import TechLoader from './components/TechLoader'
import GitHubSection from './components/GitHubSection'
import awards from './data/awards'
import FloatingControl from './components/FloatingControl'
import AdminPanel from './components/AdminPanel'
import { ACCENT_THEMES } from './data/accents'
import type { AccentKey } from './data/accents'
import CursorFollower from './components/CursorFollower'
import ResumeModal from './components/ResumeModal'
import BlogsPage from './components/BlogsPage'
import BlogPostPage from './components/BlogPostPage'
import GallerySection from './components/GallerySection'
import HeadTags from './components/HeadTags'
import { getSafeItem, setSafeItem } from './utils/storage'

interface PortfolioProps {
  theme: 'dark' | 'light'
  toggleTheme: (event?: React.MouseEvent) => void
  accent: AccentKey
  setAccent: React.Dispatch<React.SetStateAction<AccentKey>>
}

function Portfolio({ theme, toggleTheme, accent, setAccent }: PortfolioProps) {
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    return () => { history.scrollRestoration = 'auto' }
  }, [])

  useEffect(() => {
    if (!isLoading) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [isLoading])

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const sectionIds = ['hero', 'about', 'experience', 'awards', 'projects', 'gallery', 'github', 'skills', 'contact']

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    })

    sectionIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const id = hash.replace('#', '')
      const timer = setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const selectedProjectData = useMemo(
    () => selectedProject
      ? projects.find(p => p.id === selectedProject) || null
      : null,
    [selectedProject]
  )

  const handleViewResume = useCallback(() => setIsResumeOpen(true), [])
  const handleCloseResume = useCallback(() => setIsResumeOpen(false), [])
  const handleCloseProject = useCallback(() => setSelectedProject(null), [])
  
  const staticSections = useMemo(() => (
    <>
      <HeroSection onScrollTo={scrollTo} onViewResume={handleViewResume} />
      <AboutSection />
      <ExperienceSection experience={experience} />
      <AwardsSection awards={awards} />
      <ProjectsSection projects={projects} onSelectProject={setSelectedProject} />
      <ProjectModal project={selectedProjectData} onClose={handleCloseProject} />
      <GallerySection />
      <SkillsSection skills={skills} />
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [selectedProjectData])

  return (
    <>
      <HeadTags
        description="Full Stack Software Developer with 10+ years building ERP, LOB & AI applications. Hire me for .NET, React, Angular, Node.js projects."
        url="/"
      />
      <CursorFollower />
      <AnimatePresence>
        {isLoading && (
          <TechLoader key="tech-loader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      {!selectedProject && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1.5 bg-[var(--accent)] origin-left z-[100]"
          style={{ scaleX, boxShadow: "0 0 15px var(--accent)" }}
        />
      )}
      <div className={`min-h-screen relative z-10 overflow-x-hidden ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`} style={{ color: 'var(--text-primary)' }}>
        <Navbar
          activeSection={activeSection}
          theme={theme}
          onToggleTheme={toggleTheme}
          onScrollTo={scrollTo}
          accent={accent}
          onChangeAccent={setAccent}
        />
        <main>
          {staticSections}
          <GitHubSection theme={theme} accent={accent} />
          <ContactSection theme={theme} />
        </main>
        <FloatingControl />
        <Footer onScrollTo={scrollTo} />
        <BackToTop />
        <ResumeModal isOpen={isResumeOpen} onClose={handleCloseResume} />
      </div>
    </>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = getSafeItem('theme') as 'dark' | 'light'
      if (savedTheme) return savedTheme
    }
    const isThemeRotEnabled = getSafeItem('rotation_theme_enabled') !== 'false'
    if (isThemeRotEnabled) {
      const intervalHours = Number(getSafeItem('rotation_interval_hours') || '2')
      const hour = new Date().getHours()
      return Math.floor(hour / intervalHours) % 2 === 0 ? 'dark' : 'light'
    }
    const defaultTheme = getSafeItem('default_theme') as 'dark' | 'light' | null
    if (defaultTheme === 'light' || defaultTheme === 'dark') return defaultTheme
    return 'dark'
  })

  const [accent, setAccent] = useState<AccentKey>(() => {
    if (typeof window !== 'undefined') {
      const savedAccent = getSafeItem('accent') as AccentKey
      if (savedAccent) return savedAccent
    }
    const isAccentRotEnabled = getSafeItem('rotation_accent_enabled') === 'true'
    if (isAccentRotEnabled) {
      const intervalHours = Number(getSafeItem('rotation_interval_hours') || '2')
      const hour = new Date().getHours()
      const accentKeys = Object.keys(ACCENT_THEMES) as AccentKey[]
      const accentIndex = Math.floor(hour / intervalHours) % accentKeys.length
      return accentKeys[accentIndex]
    }
    const defaultAccent = getSafeItem('default_accent') as AccentKey | null
    if (defaultAccent && defaultAccent in ACCENT_THEMES) return defaultAccent
    return 'gold'
  })

  const location = useLocation()

  // Record page visit on mount and route changes
  useEffect(() => {
    const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3000'
      : ''
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref') || ''
    fetch(`${baseUrl}/api/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, ref }),
    }).catch(() => {})
  }, [location.pathname])

  // Load settings from backend Turso database on mount
  useEffect(() => {
    async function loadGlobalSettings() {
      try {
        const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
          ? 'http://localhost:3000'
          : ''
        const res = await fetch(`${baseUrl}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          
          if (data.default_theme !== undefined) {
            setSafeItem('default_theme', data.default_theme)
          }
          if (data.default_accent !== undefined) {
            setSafeItem('default_accent', data.default_accent)
          }
          if (data.rotation_theme_enabled !== undefined) {
            setSafeItem('rotation_theme_enabled', data.rotation_theme_enabled)
          }
          if (data.rotation_accent_enabled !== undefined) {
            setSafeItem('rotation_accent_enabled', data.rotation_accent_enabled)
          }
          if (data.rotation_interval_hours !== undefined) {
            setSafeItem('rotation_interval_hours', data.rotation_interval_hours)
          }

          const isThemeRot = data.rotation_theme_enabled !== 'false'
          const isAccentRot = data.rotation_accent_enabled === 'true'
          const interval = Number(data.rotation_interval_hours || '2')
          
          const savedTheme = getSafeItem('theme')
          const savedAccent = getSafeItem('accent')
          const defaultTheme = getSafeItem('default_theme') as 'dark' | 'light' | null
          const defaultAccent = getSafeItem('default_accent') as AccentKey | null
          const hour = new Date().getHours()

          if (isThemeRot && !savedTheme) {
            setTheme(Math.floor(hour / interval) % 2 === 0 ? 'dark' : 'light')
          } else if (!savedTheme && !isThemeRot && (defaultTheme === 'dark' || defaultTheme === 'light')) {
            setTheme(defaultTheme)
          }
          if (isAccentRot && !savedAccent) {
            const accentKeys = Object.keys(ACCENT_THEMES) as AccentKey[]
            const accentIndex = Math.floor(hour / interval) % accentKeys.length
            setAccent(accentKeys[accentIndex])
          } else if (!savedAccent && !isAccentRot && defaultAccent && defaultAccent in ACCENT_THEMES) {
            setAccent(defaultAccent)
          }
        }
      } catch (err) {
        console.error('Failed to load global settings:', err)
      }
    }
    
    loadGlobalSettings()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Checker to dynamically rotate the theme and/or accent color if enabled and no manual override is set
  useEffect(() => {
    let lastHourBucket: number | null = null
    const rotateBranding = () => {
      const isThemeRotEnabled = getSafeItem('rotation_theme_enabled') !== 'false'
      const isAccentRotEnabled = getSafeItem('rotation_accent_enabled') === 'true'
      const intervalHours = Number(getSafeItem('rotation_interval_hours') || '2')

      const savedTheme = getSafeItem('theme')
      const savedAccent = getSafeItem('accent')
      const hour = new Date().getHours()
      const hourBucket = Math.floor(hour / Math.max(intervalHours, 1))

      // Skip all work when nothing actually changed in the relevant window
      if (hourBucket === lastHourBucket && (!isThemeRotEnabled || savedTheme) && (!isAccentRotEnabled || savedAccent)) {
        return
      }
      lastHourBucket = hourBucket

      // Rotate Theme
      if (isThemeRotEnabled && !savedTheme) {
        const targetTheme = hourBucket % 2 === 0 ? 'dark' : 'light'
        // No-op guard: skip setState when target already matches current state
        if (targetTheme !== theme) setTheme(targetTheme)
      }

      // Rotate Accent Color
      if (isAccentRotEnabled && !savedAccent) {
        const accentKeys = Object.keys(ACCENT_THEMES) as AccentKey[]
        const targetAccent = accentKeys[hourBucket % accentKeys.length]
        // No-op guard: skip setState when target already matches current state
        if (targetAccent !== accent) setAccent(targetAccent)
      }
    }

    rotateBranding()
    const interval = setInterval(rotateBranding, 60000) // check every minute
    return () => clearInterval(interval)
  }, [theme, accent])

  const cursorCursors = useMemo(() => {
    try {
      const fillColor = theme === 'dark' ? '#000000' : '#ffffff';
      const strokeColor = theme === 'dark' ? '#ffffff' : '#0d1117';

      const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/></svg>`;
      const pointerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="${strokeColor}" stroke-width="2"/><circle cx="10" cy="10" r="2.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/></svg>`;

      const base64Arrow = btoa(arrowSvg);
      const base64Pointer = btoa(pointerSvg);

      return {
        cursor: `url('data:image/svg+xml;base64,${base64Arrow}') 8 8, auto`,
        pointer: `url('data:image/svg+xml;base64,${base64Pointer}') 10 10, pointer`,
      }
    } catch (e) {
      console.warn("Custom hardware cursor generation failed:", e);
      return null
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const themeSet = ACCENT_THEMES[accent][theme]
    
    root.style.setProperty('--accent', themeSet.accent)
    root.style.setProperty('--accent-hover', themeSet.accentHover)
    root.style.setProperty('--accent-dim', themeSet.accentDim)
    root.style.setProperty('--accent-secondary', themeSet.accentSecondary)
    root.style.setProperty('--accent-secondary-hover', themeSet.accentSecondaryHover)
    root.style.setProperty('--accent-secondary-dim', themeSet.accentSecondaryDim)
    
    root.setAttribute('data-accent', accent)
    setSafeItem('accent', accent)

    // Dynamic Hardware Cursors matching active accent theme
    if (cursorCursors) {
      root.style.setProperty('--custom-cursor', cursorCursors.cursor);
      root.style.setProperty('--custom-pointer', cursorCursors.pointer);
    }
  }, [accent, theme, cursorCursors])

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const isAppearanceTransition = (document as any).startViewTransition && 
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setTheme(prev => {
        const next = prev === 'dark' ? 'light' : 'dark';
        setSafeItem('theme', next);
        return next;
      });
      return;
    }

    const x = event && typeof event.clientX === 'number' ? event.clientX : window.innerWidth / 2;
    const y = event && typeof event.clientY === 'number' ? event.clientY : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Delay the heavy View Transition by 50ms so the button's click animation
    // has time to render, providing immediate visual feedback to the user.
    setTimeout(() => {
      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            setSafeItem('theme', next);
            return next;
          });
        });
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 350,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    }, 50);
  }, [])

  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel theme={theme} accent={accent} />} />
      <Route path="/blogs" element={<BlogsPage theme={theme} toggleTheme={toggleTheme} accent={accent} setAccent={setAccent} />} />
      <Route path="/blogs/:slug" element={<BlogPostPage theme={theme} toggleTheme={toggleTheme} accent={accent} setAccent={setAccent} />} />
      <Route path="*" element={
        <Portfolio 
          theme={theme}
          toggleTheme={toggleTheme}
          accent={accent}
          setAccent={setAccent}
        />
      } />
    </Routes>
  )
}
