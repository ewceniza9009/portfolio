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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([category, data], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border overflow-hidden group"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              whileHover={{ y: -4 }}
            >
              {/* Animated gradient banner */}
              <div className={`relative h-24 ${CATEGORY_GRADIENTS[category] || 'skill-gradient-frontend'} flex items-end`}>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-40" />
                <div className="relative z-10 w-full px-6 pb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white drop-shadow-lg flex items-center gap-2">
                    {CATEGORY_ICONS[category] && React.createElement(CATEGORY_ICONS[category], { size: 20, className: 'text-white' })}
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  {/* Skill count badge */}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {data.items.length} skills
                  </span>
                </div>
              </div>

              <div className="p-6 pt-4">
                <div className="flex flex-wrap gap-2">
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
