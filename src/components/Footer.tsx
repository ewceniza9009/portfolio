import { Github, Linkedin, ArrowUp } from 'lucide-react'

interface FooterProps {
  onScrollTo: (id: string) => void
}

export default function Footer({ onScrollTo }: FooterProps) {
  return (
    <footer className="py-8 px-6 border-t" style={{ background: 'var(--bg-section)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Top row: quick links + back to top */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex flex-wrap justify-center gap-6">
            {['Experience', 'Projects', 'Skills', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => { e.preventDefault(); onScrollTo(item.toLowerCase()) }}
                className="text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item}
              </a>
            ))}
          </div>

          <button
            onClick={() => onScrollTo('hero')}
            className="flex items-center gap-2 text-sm font-medium transition-all hover:scale-105"
            style={{ color: 'var(--accent)' }}
            aria-label="Back to top"
          >
            <ArrowUp size={16} /> Back to top
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-6" style={{ background: 'var(--border)' }} />

        {/* Bottom row: copyright + status + socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              © 2026 Erwin Wilson Ceniza
            </p>
            <span className="hidden md:inline text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Full-stack developer • Building commercial applications • Available for consulting
            </p>
          </div>

          <div className="flex gap-6">
            <a
              href="https://github.com/ewceniza9009"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="transition-all hover:scale-110"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Github size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="transition-all hover:scale-110"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
