import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import projects from '../src/data/projects.js'
import skills from '../src/data/skills.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function seed() {
  const { initDb } = await import('./db.js')
  await initDb()
  console.log('Seeding projects...')
  
  // Clear existing
  await turso.execute('DELETE FROM projects')
  await turso.execute('DELETE FROM skills')
  await turso.execute('DELETE FROM skill_categories')

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i]
    try {
      await turso.execute({
        sql: `INSERT INTO projects (
          title, subtitle, description, details, tech, year, type, color, repo, demo, video, image, fallback,
          testimonial_quote, testimonial_author, testimonial_role, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.title, p.subtitle, p.description, JSON.stringify(p.details || []), JSON.stringify(p.tech || []), p.year, p.type, p.color,
          p.repo || null, p.demo || null, p.video || null, p.image, p.fallback,
          p.testimonial?.quote || null, p.testimonial?.author || null, p.testimonial?.role || null, i
        ]
      })
      console.log(`Inserted project: ${p.title}`)
    } catch (err) {
      console.error(`Failed to insert project ${p.title}:`, err)
    }
  }

  console.log('Seeding skills...')
  let categoryOrder = 0
  let skillOrder = 0

  const catLabels: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    database: 'Database',
    tools: 'Tools & DevOps',
    practices: 'Practices'
  }

  for (const [catId, catData] of Object.entries(skills)) {
    try {
      await turso.execute({
        sql: 'INSERT INTO skill_categories (id, label, image, display_order) VALUES (?, ?, ?, ?)',
        args: [catId, catLabels[catId] || catId, catData.image, categoryOrder++]
      })
      console.log(`Inserted category: ${catId}`)

      for (const skill of catData.items) {
        await turso.execute({
          sql: 'INSERT INTO skills (category_id, name, icon, level, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [catId, skill.name, skill.name, skill.level || 'familiar', skillOrder++]
        })
      }
    } catch (err) {
      console.error(`Failed to insert category ${catId}:`, err)
    }
  }

  console.log('Done seeding.')
  process.exit(0)
}

seed()
