import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import projects from './data/projects'
import experience from './data/experience'
import skills from './data/skills'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
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
import TerminalFooter from './components/TerminalFooter'
import AdminPanel from './components/AdminPanel'
import { ACCENT_THEMES } from './data/accents'
import type { AccentKey } from './data/accents'
import CursorFollower from './components/CursorFollower'
import ResumeModal from './components/ResumeModal'



const getSafeItem = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
}
const setSafeItem = (key: string, value: string): void => {
  try { localStorage.setItem(key, value) } catch {}
}

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

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const sectionIds = ['hero', 'experience', 'awards', 'projects', 'github', 'skills', 'contact']

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectedProjectData = selectedProject
    ? projects.find(p => p.id === selectedProject) || null
    : null

  return (
    <>
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
      <div className="min-h-screen transition-colors duration-300 relative z-10 overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
        <Navbar
          activeSection={activeSection}
          theme={theme}
          onToggleTheme={toggleTheme}
          onScrollTo={scrollTo}
          accent={accent}
          onChangeAccent={setAccent}
        />
        <main>
          <HeroSection onScrollTo={scrollTo} onViewResume={() => setIsResumeOpen(true)} />
          <ExperienceSection experience={experience} />
          <AwardsSection awards={awards} />
          <ProjectsSection projects={projects} onSelectProject={setSelectedProject} />
          <ProjectModal project={selectedProjectData} onClose={() => setSelectedProject(null)} />
          <GitHubSection theme={theme} accent={accent} />
          <SkillsSection skills={skills} />
          <ContactSection theme={theme} />
        </main>
        <TerminalFooter />
        <Footer onScrollTo={scrollTo} />
        <BackToTop />
        <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />
      </div>
    </>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (getSafeItem('theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  const [accent, setAccent] = useState<AccentKey>(() => {
    if (typeof window !== 'undefined') {
      return (getSafeItem('accent') as AccentKey) || 'gold'
    }
    return 'gold'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setSafeItem('theme', theme)
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
    try {
      const fillColor = theme === 'dark' ? '#000000' : '#ffffff';
      const strokeColor = theme === 'dark' ? '#ffffff' : '#0d1117';
      
      const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/></svg>`;
      const pointerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="${strokeColor}" stroke-width="2"/><circle cx="10" cy="10" r="2.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/></svg>`;
      
      const base64Arrow = btoa(arrowSvg);
      const base64Pointer = btoa(pointerSvg);
      
      root.style.setProperty('--custom-cursor', `url('data:image/svg+xml;base64,${base64Arrow}') 8 8, auto`);
      root.style.setProperty('--custom-pointer', `url('data:image/svg+xml;base64,${base64Pointer}') 10 10, pointer`);
    } catch (e) {
      console.warn("Custom hardware cursor generation failed:", e);
    }
  }, [accent, theme])

  const toggleTheme = (event?: React.MouseEvent) => {
    const isAppearanceTransition = (document as any).startViewTransition && 
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      return;
    }

    const x = event && typeof event.clientX === 'number' ? event.clientX : window.innerWidth / 2;
    const y = event && typeof event.clientY === 'number' ? event.clientY : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
  };

  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
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
