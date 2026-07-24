import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react'

import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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
import FloatingControl from './components/FloatingControl'
import { ACCENT_THEMES, type AccentKey } from './data/accents'
import { useGlobalTheme } from './hooks/useGlobalTheme'
import CursorFollower from './components/CursorFollower'
import ResumeModal from './components/ResumeModal'
import GallerySection from './components/GallerySection'
import HeadTags from './components/HeadTags'
import { getSafeItem, setSafeItem } from './utils/storage'
import { apiFetch, setVisitorOptOut } from './utils/api'
import { useProjects, useSkills, useAbout, useExperience, useAwards } from './hooks/usePortfolioData'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './components/NotFound'
import SearchPalette from './components/SearchPalette'
import CheatsheetModal from './components/CheatsheetModal'
import SectionCounter from './components/SectionCounter'
import ScrollProgress from './components/ScrollProgress'

import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { queryClient } from './lib/queryClient'

const AdminPanel = lazy(() => import('./components/AdminPanel'))
const BlogsPage = lazy(() => import('./components/BlogsPage'))
const BlogPostPage = lazy(() => import('./components/BlogPostPage'))

function Portfolio() {
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('hasSeenLoader') !== 'true'
  })
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  const { data: projectsData = [] } = useProjects()
  const { data: skillsData = [] } = useSkills()
  const { data: aboutData = { title: 'About Me', paragraphs: [] } } = useAbout()
  const { data: experienceData = [] } = useExperience()
  const { data: awardsData = [] } = useAwards()

  useEffect(() => {
    history.scrollRestoration = 'manual'
    return () => { history.scrollRestoration = 'auto' }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem('hasSeenLoader', 'true')
      const hash = window.location.hash
      if (hash) {
        const id = hash.replace('#', '')
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      }
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isLoading])

  const isScrollingRef = useRef(false)

  useEffect(() => {
    const sectionIds = ['hero', 'about', 'experience', 'awards', 'projects', 'gallery', 'github', 'skills', 'contact']

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isScrollingRef.current) {
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

  const scrollTo = useCallback((id: string) => {
    setActiveSection(id)
    isScrollingRef.current = true

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // Free the observer slightly after the scroll finishes 
    setTimeout(() => {
      isScrollingRef.current = false
    }, 1000)
  }, [])

  const selectedProjectData = useMemo(
    () => selectedProject
      ? projectsData.find(p => p.id === selectedProject) || null
      : null,
    [selectedProject, projectsData]
  )

  const handleViewResume = useCallback(() => setIsResumeOpen(true), [])
  const handleCloseResume = useCallback(() => setIsResumeOpen(false), [])
  const handleCloseProject = useCallback(() => setSelectedProject(null), [])
  
  const staticSections = useMemo(() => (
    <>
      <HeroSection onScrollTo={scrollTo} onViewResume={handleViewResume} />
      <AboutSection title={aboutData.title} paragraphs={aboutData.paragraphs} />
      <ExperienceSection experience={experienceData} />
      <AwardsSection awards={awardsData} />
      <ProjectsSection projects={projectsData} onSelectProject={setSelectedProject} />
      <GallerySection />
      <SkillsSection skills={skillsData} />
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [selectedProjectData, projectsData, skillsData, aboutData, experienceData, awardsData])

  const memoizedProjectModal = useMemo(() => (
    <ProjectModal project={selectedProjectData} onClose={handleCloseProject} />
  ), [selectedProjectData, handleCloseProject])

  const memoizedGitHubSection = useMemo(() => <GitHubSection />, [])
  const memoizedContactSection = useMemo(() => <ContactSection />, [])
  const memoizedFooter = useMemo(() => <Footer onScrollTo={scrollTo} />, [scrollTo])
  const memoizedBackToTop = useMemo(() => <BackToTop />, [])
  const memoizedResumeModal = useMemo(() => <ResumeModal isOpen={isResumeOpen} onClose={handleCloseResume} />, [isResumeOpen, handleCloseResume])
  const memoizedCursorFollower = useMemo(() => <CursorFollower />, [])
  const memoizedHeadTags = useMemo(() => (
    <HeadTags
      description="Full Stack Software Developer with 10+ years building ERP, LOB & AI applications. Hire me for .NET, React, Angular, Node.js projects."
      url="/"
    />
  ), [])

  return (
    <>
      {memoizedHeadTags}
      {memoizedCursorFollower}
      <AnimatePresence>
        {isLoading && (
          <TechLoader key="tech-loader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      <div className="min-h-screen relative z-10 overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
        <ScrollProgress visible={!selectedProject} />
        {!selectedProject && <SectionCounter active={activeSection} total={9} />}
        <Navbar
          activeSection={activeSection}
          onScrollTo={scrollTo}
        />
        <main>
          {staticSections}
          {memoizedGitHubSection}
          {memoizedContactSection}
        </main>
        {memoizedProjectModal}
        {memoizedFooter}
        {memoizedBackToTop}
        {memoizedResumeModal}
      </div>
    </>
  )
}
function GlobalCursorStyles() {
  const { theme, accent } = useGlobalTheme()

  useEffect(() => {
    const root = document.documentElement
    
    // Set accent colors
    const themeSet = ACCENT_THEMES[accent]?.[theme]
    if (themeSet) {
      root.style.setProperty('--accent', themeSet.accent)
      root.style.setProperty('--accent-hover', themeSet.accentHover)
      root.style.setProperty('--accent-dim', themeSet.accentDim)
      root.style.setProperty('--accent-secondary', themeSet.accentSecondary)
      root.style.setProperty('--accent-secondary-hover', themeSet.accentSecondaryHover)
      root.style.setProperty('--accent-secondary-dim', themeSet.accentSecondaryDim)
    }

    try {
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const isDark = theme === 'dark'
      
      const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="${isDark ? '#ffffff' : '#000000'}" stroke="${isDark ? '#000000' : '#ffffff'}" stroke-width="1.5" d="M10.15 8.11L24 16 10.15 23.89V8.11z" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" /></svg>`
      const pointerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="${accentColor}" stroke="${isDark ? '#ffffff' : '#000000'}" stroke-width="2" d="M14 6h4v8h8v4h-8v8h-4v-8H6v-4h8V6z" style="filter: drop-shadow(0 2px 6px ${accentColor}88);" /></svg>`

      const base64Arrow = btoa(arrowSvg)
      const base64Pointer = btoa(pointerSvg)

      const applyCursors = () => {
        if (getSafeItem('cursor_enabled') !== 'false') {
          root.style.setProperty('--custom-cursor', `url('data:image/svg+xml;base64,${base64Arrow}') 8 8, auto`);
          root.style.setProperty('--custom-pointer', `url('data:image/svg+xml;base64,${base64Pointer}') 10 10, pointer`);
        } else {
          root.style.setProperty('--custom-cursor', 'auto');
          root.style.setProperty('--custom-pointer', 'pointer');
        }
      }
      applyCursors()
      window.addEventListener('cursor-state-changed', applyCursors)
      return () => window.removeEventListener('cursor-state-changed', applyCursors)
    } catch (e) {
      console.warn("Custom hardware cursor generation failed:", e);
    }
  }, [theme, accent])

  return null
}

export default function App() {
  const { theme, accent, setTheme, setAccent, toggleTheme } = useGlobalTheme()
  const [isOffline, setIsOffline] = useState(false)
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)
    const handleApiError = () => setIsOffline(true)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener('api-fetch-error', handleApiError)

    if (!navigator.onLine) setIsOffline(true)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('api-fetch-error', handleApiError)
    }
  }, [])
  useEffect(() => {
    // Initialize theme
    if (typeof window !== 'undefined') {
      let initialTheme: 'dark' | 'light' = 'dark';
      const savedTheme = getSafeItem('theme') as 'dark' | 'light';
      if (savedTheme) {
        initialTheme = savedTheme;
      } else {
        const isThemeRotEnabled = getSafeItem('rotation_theme_enabled') !== 'false';
        if (isThemeRotEnabled) {
          const intervalHours = Number(getSafeItem('rotation_interval_hours') || '2');
          const hour = new Date().getHours();
          initialTheme = Math.floor(hour / intervalHours) % 2 === 0 ? 'dark' : 'light';
        } else {
          const defaultTheme = getSafeItem('default_theme') as 'dark' | 'light' | null;
          if (defaultTheme === 'light' || defaultTheme === 'dark') initialTheme = defaultTheme;
        }
      }
      document.documentElement.setAttribute('data-theme', initialTheme);

      // Initialize accent
      let initialAccent: AccentKey = 'gold';
      const savedAccent = getSafeItem('accent') as AccentKey;
      if (savedAccent) {
        initialAccent = savedAccent;
      } else {
        const isAccentRotEnabled = getSafeItem('rotation_accent_enabled') === 'true';
        if (isAccentRotEnabled) {
          const intervalHours = Number(getSafeItem('rotation_interval_hours') || '2');
          const hour = new Date().getHours();
          const accentKeys = Object.keys(ACCENT_THEMES) as AccentKey[];
          const accentIndex = Math.floor(hour / intervalHours) % accentKeys.length;
          initialAccent = accentKeys[accentIndex];
        } else {
          const defaultAccent = getSafeItem('default_accent') as AccentKey | null;
          if (defaultAccent && defaultAccent in ACCENT_THEMES) initialAccent = defaultAccent;
        }
      }
      document.documentElement.setAttribute('data-accent', initialAccent);
    }
  }, []);

  const location = useLocation()

  // Record page visit on mount and route changes (and handle ?optout=1 / ?optout=0 URL query)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const optoutParam = params.get('optout')
    if (optoutParam === '1') {
      setVisitorOptOut(true)
      console.log('[Analytics] Visitor tracking disabled for this browser.')
    } else if (optoutParam === '0') {
      setVisitorOptOut(false)
      console.log('[Analytics] Visitor tracking re-enabled for this browser.')
    }

    const ref = params.get('ref') || ''
    apiFetch('/api/visit', {
      method: 'POST',
      body: JSON.stringify({ path: location.pathname, ref }),
    }).catch(() => {})
  }, [location.pathname])

  // Load settings from backend Turso database on mount
  useEffect(() => {
    async function loadGlobalSettings() {
      try {
        const data = await queryClient.fetchQuery({
          queryKey: ['settings'],
          queryFn: () => apiFetch('/api/settings').then(r => r.json()),
          staleTime: 10 * 60 * 1000,
        })

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
      if (data.cursor_enabled !== undefined) {
        const isEnabledStr = String(data.cursor_enabled);
        setSafeItem('cursor_enabled', isEnabledStr);
        const isEnabled = isEnabledStr !== 'false';
        document.documentElement.dataset.cursorEnabled = isEnabled ? 'true' : 'false';
        window.dispatchEvent(new CustomEvent('cursor-state-changed', { detail: { enabled: isEnabled } }));
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
    } catch (err) {
        console.error('Failed to load global settings:', err)
      }
    }
    
    // Skip if already cached by useSettings
    if (queryClient.getQueryData(['settings'])) return
    
    loadGlobalSettings()
  }, [])

  // Sync cursor_enabled from localStorage to <html> data attr on mount
  useEffect(() => {
    document.documentElement.dataset.cursorEnabled = getSafeItem('cursor_enabled') ?? 'true'
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


  const shortcutGroups = useMemo(() => [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: 'g+h', description: 'Go to home', action: () => navigate('/') },
        { keys: 'g+b', description: 'Go to blog', action: () => navigate('/blogs') },
        { keys: 'g+p', description: 'Go to projects', action: () => navigate('/#projects') },
      ],
    },
    {
      title: 'Search',
      shortcuts: [
        { keys: '/', description: 'Open search', action: () => window.dispatchEvent(new Event('open-search')) },
        { keys: '?', description: 'Show shortcuts', action: () => setIsCheatsheetOpen(true) },
      ],
    },
    {
      title: 'Appearance',
      shortcuts: [
        { keys: 'g+t', description: 'Toggle theme', action: () => toggleTheme() },
      ],
    },
  ], [navigate, toggleTheme])

  useKeyboardShortcuts(shortcutGroups, () => setIsCheatsheetOpen(true))

  return (
    <>
    <GlobalCursorStyles />
    <SearchPalette />
    <CheatsheetModal
      open={isCheatsheetOpen}
      onClose={() => setIsCheatsheetOpen(false)}
      groups={shortcutGroups}
    />
    <>
      <Suspense fallback={null}>
        <Routes location={location}>
        <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
        <Route path="/blogs" element={<ErrorBoundary><BlogsPage /></ErrorBoundary>} />
        <Route path="/blogs/:slug" element={<ErrorBoundary><BlogPostPage /></ErrorBoundary>} />
        <Route path="/" element={
          <ErrorBoundary>
            <Portfolio />
          </ErrorBoundary>
        } />
        <Route path="*" element={
          <ErrorBoundary>
            <NotFound />
          </ErrorBoundary>
        } />
      </Routes>
      </Suspense>
    </>
    <FloatingControl />
    {isOffline && (
      <div className="fixed bottom-4 right-4 z-[9999] bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="font-medium text-sm">Offline or connection issues</span>
      </div>
    )}
    </>
  )
}
