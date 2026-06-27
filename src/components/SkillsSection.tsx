import React from 'react'
import { motion } from 'framer-motion'
import { Monitor, Server, Database, Wrench, Lightbulb } from 'lucide-react'

type SkillItem = { name: string; icon?: React.ComponentType<{ size?: number }> }

interface SkillsData {
  [category: string]: {
    image: string
    items: SkillItem[]
  }
}


const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  frontend: Monitor,
  backend: Server,
  database: Database,
  tools: Wrench,
  practices: Lightbulb,
}

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  tools: 'Tools & DevOps',
  practices: 'Practices',
}

const CATEGORY_HOVER_COLORS: Record<string, { bg: string; color: string }> = {
  frontend: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' },
  backend: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' },
  database: { bg: 'rgba(20, 184, 166, 0.12)', color: '#14b8a6' },
  tools: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  practices: { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' },
}

const BACKGROUND_DECORATIONS: Record<string, React.ReactNode> = {
  frontend: (
    <svg className="absolute -bottom-6 -right-6 w-48 h-48 opacity-[0.05] pointer-events-none transform group-hover:scale-105 group-hover:opacity-[0.08] transition-all duration-700" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="20" y="20" width="160" height="130" rx="8" />
      <line x1="20" y1="50" x2="180" y2="50" />
      <rect x="35" y="65" width="40" height="70" rx="4" />
      <rect x="85" y="65" width="80" height="30" rx="4" />
      <rect x="85" y="105" width="80" height="30" rx="4" />
      <circle cx="35" cy="35" r="3" fill="currentColor" />
      <circle cx="47" cy="35" r="3" fill="currentColor" />
      <circle cx="59" cy="35" r="3" fill="currentColor" />
    </svg>
  ),
  backend: (
    <svg className="absolute -bottom-6 -right-6 w-48 h-48 opacity-[0.05] pointer-events-none transform group-hover:scale-105 group-hover:opacity-[0.08] transition-all duration-700" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="20" y="25" width="160" height="32" rx="4" />
      <rect x="20" y="72" width="160" height="32" rx="4" />
      <rect x="20" y="119" width="160" height="32" rx="4" />
      <circle cx="40" cy="41" r="3" fill="currentColor" />
      <circle cx="40" cy="88" r="3" fill="currentColor" />
      <circle cx="40" cy="135" r="3" fill="currentColor" />
      <path d="M120 41 V 135" strokeDasharray="4 4" />
      <circle cx="120" cy="41" r="4" fill="currentColor" />
      <circle cx="120" cy="88" r="4" fill="currentColor" />
      <circle cx="120" cy="135" r="4" fill="currentColor" />
    </svg>
  ),
  database: (
    <svg className="absolute -bottom-6 -right-6 w-48 h-48 opacity-[0.05] pointer-events-none transform group-hover:scale-105 group-hover:opacity-[0.08] transition-all duration-700" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M 40 40 C 40 30, 100 30, 100 40 C 100 50, 40 50, 40 40 Z" />
      <path d="M 40 40 V 80 C 40 90, 100 90, 100 80 V 40" />
      <path d="M 40 60 C 40 70, 100 70, 100 60" />
      <path d="M 100 110 C 100 100, 160 100, 160 110 C 160 120, 100 120, 100 110 Z" />
      <path d="M 100 110 V 150 C 100 160, 160 160, 160 150 V 110" />
      <path d="M 100 130 C 100 140, 160 140, 160 130" />
      <path d="M 70 85 C 70 120, 130 90, 130 105" strokeDasharray="4 4" />
      <circle cx="70" cy="85" r="4" fill="currentColor" />
      <circle cx="130" cy="105" r="4" fill="currentColor" />
    </svg>
  ),
  tools: (
    <svg className="absolute -bottom-6 -right-6 w-48 h-48 opacity-[0.05] pointer-events-none transform group-hover:scale-105 group-hover:opacity-[0.08] transition-all duration-700" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M 30 150 H 170" />
      <circle cx="50" cy="150" r="5" fill="currentColor" />
      <circle cx="100" cy="150" r="5" fill="currentColor" />
      <circle cx="150" cy="150" r="5" fill="currentColor" />
      <path d="M 50 150 Q 75 90, 110 90 H 160" />
      <circle cx="110" cy="90" r="5" fill="currentColor" />
      <circle cx="150" cy="90" r="5" fill="currentColor" />
      <path d="M 100 150 Q 120 40, 140 40 H 160" />
      <circle cx="145" cy="40" r="5" fill="currentColor" />
    </svg>
  ),
  practices: (
    <svg className="absolute -bottom-6 -right-6 w-48 h-48 opacity-[0.05] pointer-events-none transform group-hover:scale-105 group-hover:opacity-[0.08] transition-all duration-700" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="35" />
      <rect x="85" y="85" width="30" height="30" rx="3" />
      <circle cx="100" cy="100" r="5" fill="currentColor" />
      <line x1="100" y1="30" x2="100" y2="65" />
      <line x1="40" y1="100" x2="65" y2="100" />
      <line x1="160" y1="100" x2="135" y2="100" />
    </svg>
  )
}

interface SkillsSectionProps {
  skills: SkillsData
}

function SkillTag({ skill, category, index }: { skill: SkillItem; category: string; index: number }) {
  const hoverColors = CATEGORY_HOVER_COLORS[category]
  const [isHovered, setIsHovered] = React.useState(false)
  const defaultBg = hoverColors ? hoverColors.bg.replace('0.12', '0.04') : 'var(--bg-secondary)'

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-default border transition-all duration-300"
      style={{
        background: isHovered && hoverColors ? hoverColors.bg : defaultBg,
        color: isHovered && hoverColors ? hoverColors.color : 'var(--text-secondary)',
        borderColor: isHovered ? 'var(--accent)' : 'var(--border)',
        boxShadow: isHovered ? '0 2px 8px var(--accent-dim)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2, scale: 1.05 }}
    >
      {skill.icon && React.createElement(skill.icon, { size: 14 })}
      {skill.name}
    </motion.span>
  )
}

const getBentoClasses = (index: number) => {
  switch (index) {
    case 0: return 'md:col-span-2 md:row-span-1' // Frontend
    case 1: return 'md:col-span-1 md:row-span-1' // Backend
    case 2: return 'md:col-span-1 md:row-span-1' // Database
    case 3: return 'md:col-span-1 md:row-span-1' // Tools
    case 4: return 'md:col-span-1 md:row-span-1' // Practices
    default: return 'md:col-span-1 md:row-span-1'
  }
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <section id="skills" className="py-32 px-6" style={{ background: 'var(--bg-section-alt)' }}>
      {/* Section divider */}
      <div className="section-divider max-w-6xl mx-auto mb-32" />

      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-2 font-display"
        >
          Skills
        </motion.h2>
        <p className="mb-16" style={{ color: 'var(--text-secondary)' }}>Technologies I work with</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(skills).map(([category, data], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
              className={`rounded-2xl border overflow-hidden group flex flex-col ${getBentoClasses(index)}`}
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            >
              {/* Subtle tinted header */}
              <div 
                className="relative h-16 flex items-center justify-between px-6 shrink-0 border-b"
                style={{ 
                  background: CATEGORY_HOVER_COLORS[category]?.bg || 'var(--bg-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_currentColor_1px,_transparent_1px)] [background-size:20px_20px]" style={{ color: CATEGORY_HOVER_COLORS[category]?.color }} />
                
                <h3 
                  className="font-bold flex items-center gap-3 text-lg relative z-10"
                  style={{ color: CATEGORY_HOVER_COLORS[category]?.color || 'var(--text-primary)' }}
                >
                  {CATEGORY_ICONS[category] && React.createElement(CATEGORY_ICONS[category], { size: 20 })}
                  {CATEGORY_LABELS[category] || category}
                </h3>
                
                {/* Skill count badge */}
                <span 
                  className="text-xs font-semibold px-3 py-1 rounded-full relative z-10"
                  style={{ 
                    background: 'var(--bg-card)', 
                    color: CATEGORY_HOVER_COLORS[category]?.color || 'var(--text-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {data.items.length} skills
                </span>
              </div>

              <div className="relative p-6 flex-grow flex flex-col justify-start bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-card-hover)]/30 overflow-hidden">
                {/* Subtle Background blueprint decoration */}
                {BACKGROUND_DECORATIONS[category] || null}

                <div className="relative z-10 flex flex-wrap gap-2.5">
                  {data.items.map((skill, skillIndex) => (
                    <SkillTag key={skill.name} skill={skill} category={category} index={skillIndex} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
