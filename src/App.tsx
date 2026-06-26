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

function Portfolio() {
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

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
        />
        <main>
          <HeroSection onScrollTo={scrollTo} />
          <ExperienceSection experience={experience} />
          <AwardsSection awards={awards} />
          <ProjectsSection projects={projects} onSelectProject={setSelectedProject} />
          <ProjectModal project={selectedProjectData} onClose={() => setSelectedProject(null)} />
          <GitHubSection theme={theme} />
          <SkillsSection skills={skills} />
          <ContactSection />
        </main>
        <TerminalFooter />
        <Footer onScrollTo={scrollTo} />
        <BackToTop />
      </div>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Portfolio />} />
    </Routes>
  )
}
