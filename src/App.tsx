import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Github, Linkedin, Mail, MapPin, Phone, ExternalLink, ChevronDown, Sun, Moon } from 'lucide-react'
import Background3D from './components/Background3D'
import projects from './data/projects'
import experience from './data/experience'
import skills from './data/skills'

function App() {
  const [activeSection, setActiveSection] = useState('hero')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'experience', 'projects', 'skills', 'contact']
      const scrollY = window.scrollY + window.innerHeight / 3

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="relative min-h-screen">
      <Background3D />
      
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a 
            href="#hero" 
            onClick={(e) => { e.preventDefault(); scrollTo('hero') }}
            className="font-mono text-sm tracking-wider text-accent hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            EWCENIZA
          </motion.a>

          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'hero', label: 'Home' },
              { id: 'experience', label: 'Experience' },
              { id: 'projects', label: 'Projects' },
              { id: 'skills', label: 'Skills' },
              { id: 'contact', label: 'Contact' }
            ].map((item) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => { e.preventDefault(); scrollTo(item.id) }}
                className={`text-sm tracking-wide transition-colors ${
                  activeSection === item.id ? 'text-accent' : 'text-text-secondary hover:text-white'
                }`}
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.a>
            ))}
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-white/5"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                {['hero', 'experience', 'projects', 'skills', 'contact'].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(item) }}
                    className={`text-sm tracking-wide capitalize ${
                      activeSection === item ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10">
        <section id="hero" className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="mb-8 relative">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-accent to-accent-dim p-1 animate-glow">
                  <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center">
                    <span className="font-display text-4xl font-bold gradient-text">E</span>
                  </div>
                </div>
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
                <span className="text-white">Erwin Wilson </span>
                <span className="gradient-text">Ceniza</span>
              </h1>

              <div className="font-mono text-accent text-lg md:text-xl mb-6">
                {'>'} Full Stack Developer | 10+ years
              </div>

              <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Building secure, scalable, intelligent solutions that deliver impact. 
                Specializing in ERP, LOB applications, and AI integration.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <a 
                  href="https://github.com/ewceniza9009" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                >
                  <Github size={18} /> GitHub
                </a>
                <a 
                  href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-accent text-accent rounded-lg hover:bg-accent hover:text-bg-primary transition-all flex items-center gap-2"
                >
                  <Linkedin size={18} /> LinkedIn
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
              <motion.button
                onClick={() => scrollTo('experience')}
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="text-accent hover:text-white transition-colors"
              >
                <ChevronDown size={32} />
              </motion.button>
            </motion.div>
          </div>
        </section>

        <section id="experience" className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold mb-4"
            >
              <span className="text-accent">/</span> Experience
            </motion.h2>
            <p className="text-text-secondary mb-16">Professional journey through the software industry</p>

            <div className="relative">
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-accent/20 transform md:-translate-x-px" />
              
              {experience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative mb-12 md:mb-16 ${
                    index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left md:ml-auto'
                  }`}
                  style={{ maxWidth: index % 2 === 0 ? 'calc(50% - 2rem)' : 'calc(50% - 2rem)' }}
                >
                  <div className={`absolute top-0 w-4 h-4 rounded-full bg-accent shadow-lg shadow-accent/30 ${
                    index % 2 === 0 ? 'left-0 md:left-1/2 md:-translate-x-1/2' : 'left-0 md:left-1/2 md:-translate-x-1/2'
                  }`} />
                  
                  <div className={`ml-8 md:ml-0 glass rounded-xl p-6 hover-lift ${
                    index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                  }`}>
                    <span className="font-mono text-xs text-accent">{exp.year}</span>
                    <h3 className="font-display text-xl font-semibold mt-2">{exp.company}</h3>
                    <p className="text-accent text-sm mb-2">{exp.position}</p>
                    <p className="text-text-secondary text-sm mb-2 flex items-center gap-2 justify-start md:justify-end">
                      <MapPin size={14} /> {exp.location}
                    </p>
                    <p className="text-text-secondary text-sm leading-relaxed">{exp.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="py-32 px-6 bg-bg-secondary">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold mb-4"
            >
              <span className="text-accent">/</span> Projects
            </motion.h2>
            <p className="text-text-secondary mb-16">Commercialized products and emerging initiatives</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group glass rounded-2xl overflow-hidden hover-lift cursor-pointer"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="relative h-48 overflow-hidden bg-bg-card">
                    {project.video ? (
                      <video 
                        src={project.video} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget as HTMLVideoElement
                          video.pause()
                          video.currentTime = 0
                        }}
                      />
                    ) : (
                      <img 
                        src={project.image} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                    <span 
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-mono"
                      style={{ backgroundColor: project.color + '22', color: project.color }}
                    >
                      {project.year}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold mb-1 group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-accent text-sm mb-3">{project.subtitle}</p>
                    <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.slice(0, 3).map((tech) => (
                        <span key={tech} className="px-2 py-1 bg-bg-card rounded text-xs text-text-secondary">
                          {tech}
                        </span>
                      ))}
                      {project.tech.length > 3 && (
                        <span className="px-2 py-1 text-xs text-accent">+{project.tech.length - 3}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <AnimatePresence>
          {selectedProject && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedProject(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const project = projects.find(p => p.id === selectedProject)
                    if (!project) return null
                    return (
                      <>
                        <div className="relative h-64 md:h-80 bg-bg-card">
                          {project.video ? (
                            <video 
                              src={project.video} 
                              controls
                              autoPlay
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img 
                              src={project.image} 
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="p-8">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-display text-2xl font-bold">{project.title}</h3>
                              <p className="text-accent">{project.subtitle}</p>
                            </div>
                            <span className="font-mono text-sm text-accent">{project.year}</span>
                          </div>
                          <p className="text-text-secondary mb-6 leading-relaxed">{project.description}</p>
                          
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-3 text-accent">TECH STACK</h4>
                            <div className="flex flex-wrap gap-2">
                              {project.tech.map((tech) => (
                                <span key={tech} className="px-3 py-1 bg-bg-card rounded-full text-sm">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            {project.repo && (
                              <a
                                href={project.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                              >
                                <Github size={16} /> Repository
                              </a>
                            )}
                            {project.demo && (
                              <a
                                href={project.demo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 border border-accent text-accent rounded-lg hover:bg-accent hover:text-bg-primary transition-all flex items-center gap-2"
                              >
                                <ExternalLink size={16} /> Demo
                              </a>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <section id="skills" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold mb-4"
            >
              <span className="text-accent">/</span> Skills
            </motion.h2>
            <p className="text-text-secondary mb-16">Technologies and practices I work with</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(skills).map(([category, items], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 hover-lift"
                >
                  <h3 className="font-display text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-bg-card rounded-lg text-sm text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-32 px-6 bg-bg-secondary">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold mb-4"
            >
              <span className="text-accent">/</span> Get In Touch
            </motion.h2>
            <p className="text-text-secondary mb-12">
              Open to opportunities and collaborations
            </p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 md:p-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <a 
                  href="mailto:erwinwilsonceniza@gmail.com"
                  className="flex items-center gap-4 p-4 bg-bg-card rounded-xl hover:bg-accent/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                    <Mail size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-text-secondary">Email</p>
                    <p className="text-sm">erwinwilsonceniza@gmail.com</p>
                  </div>
                </a>
                <a 
                  href="tel:+639351228470"
                  className="flex items-center gap-4 p-4 bg-bg-card rounded-xl hover:bg-accent/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                    <Phone size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-text-secondary">Phone</p>
                    <p className="text-sm">+63 935-122-8470</p>
                  </div>
                </a>
                <a 
                  href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-bg-card rounded-xl hover:bg-accent/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                    <Linkedin size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-text-secondary">LinkedIn</p>
                    <p className="text-sm">erwin-wilson-ceniza</p>
                  </div>
                </a>
                <a 
                  href="https://github.com/ewceniza9009"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-bg-card rounded-xl hover:bg-accent/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                    <Github size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-text-secondary">GitHub</p>
                    <p className="text-sm">ewceniza9009</p>
                  </div>
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <MapPin size={16} />
                <span>Canduman, Mandaue City, Cebu 6014, Philippines</span>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="py-8 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-secondary text-sm">
              © 2026 Erwin Wilson Ceniza. Built with React & Three.js
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/ewceniza9009" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">
                <Github size={20} />
              </a>
              <a href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App