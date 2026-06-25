import { useState, useEffect } from 'react'
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
import awards from './data/awards'

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  // Theme persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Active section tracking
  useEffect(() => {
    const sectionIds = ['hero', 'experience', 'awards', 'projects', 'skills', 'contact']
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY + window.innerHeight / 3
          for (const element of elements) {
            const offsetTop = element.offsetTop
            const offsetHeight = element.offsetHeight
            if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
              setActiveSection(element.id)
              break
            }
          }
          ticking = false;
        })
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectedProjectData = selectedProject
    ? projects.find(p => p.id === selectedProject) || null
    : null

  return (
    <>
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
        <SkillsSection skills={skills} />
        <ContactSection />
        </main>
        <Footer onScrollTo={scrollTo} />
        <BackToTop />
      </div>
    </>
  )
}