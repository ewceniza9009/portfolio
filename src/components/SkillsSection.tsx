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

const CATEGORY_GRADIENTS: Record<string, string> = {
  frontend: 'skill-gradient-frontend',
  backend: 'skill-gradient-backend',
  database: 'skill-gradient-database',
  tools: 'skill-gradient-tools',
  practices: 'skill-gradient-practices',
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

interface SkillsSectionProps {
  skills: SkillsData
}

function SkillTag({ skill, category }: { skill: SkillItem; category: string }) {
  const hoverColors = CATEGORY_HOVER_COLORS[category]
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-default"
      style={{
        background: isHovered && hoverColors ? hoverColors.bg : 'var(--bg-secondary)',
        color: isHovered && hoverColors ? hoverColors.color : 'var(--text-secondary)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
              {/* Animated gradient banner */}
              <div className={`relative h-16 ${CATEGORY_GRADIENTS[category] || 'skill-gradient-frontend'} flex items-end shrink-0`}>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--text-primary)_1px,_transparent_1px)] [background-size:20px_20px]" />
                
                <div className="relative z-10 w-full px-6 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-white drop-shadow-lg flex items-center gap-3 text-lg">
                    {CATEGORY_ICONS[category] && React.createElement(CATEGORY_ICONS[category], { size: 20, className: 'text-white' })}
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  {/* Skill count badge */}
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md shadow-inner border border-white/10">
                    {data.items.length} skills
                  </span>
                </div>
              </div>

              <div className="relative p-6 flex-grow flex flex-col justify-start bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-card-hover)]/30 overflow-hidden">
                {/* Subtle Background Icon */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none transform group-hover:scale-110 group-hover:opacity-[0.05] group-hover:-rotate-6 transition-all duration-700" style={{ color: 'var(--text-primary)' }}>
                  {CATEGORY_ICONS[category] && React.createElement(CATEGORY_ICONS[category], { size: 180 })}
                </div>

                <div className="relative z-10 flex flex-wrap gap-2.5">
                  {data.items.map((skill) => (
                    <SkillTag key={skill.name} skill={skill} category={category} />
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
