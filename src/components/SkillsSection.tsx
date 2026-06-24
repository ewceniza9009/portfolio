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

interface SkillsSectionProps {
  skills: SkillsData
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <section id="skills" className="py-32 px-6" style={{ background: 'var(--bg-section-alt)' }}>
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
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Gradient banner instead of image */}
              <div className={`relative h-24 ${CATEGORY_GRADIENTS[category] || 'skill-gradient-frontend'} flex items-end`}>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-40" />
                <h3 className="relative z-10 text-lg font-semibold px-6 pb-3 text-white drop-shadow-lg flex items-center gap-2">
                  {CATEGORY_ICONS[category] && React.createElement(CATEGORY_ICONS[category], { size: 20, className: 'text-white' })}
                  {CATEGORY_LABELS[category] || category}
                </h3>
              </div>

              <div className="p-6 pt-4">
                <div className="flex flex-wrap gap-2">
                  {data.items.map((skill) => (
                    <span
                      key={skill.name}
                      className="tag-neutral inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-default hover:opacity-80"
                    >
                      {skill.icon && React.createElement(skill.icon, { size: 14 })}
                      {skill.name}
                    </span>
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
