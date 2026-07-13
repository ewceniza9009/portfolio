import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'fallback')

async function loadEnv() {
  try {
    const raw = await readFile(resolve(__dirname, '..', '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
}

await loadEnv()

const DB_URL = process.env.TURSO_DATABASE_URL || `file:${process.env.FALLBACK_DB_PATH || resolve(__dirname, '..', 'server', 'database.sqlite')}`
const turso = createClient({ url: DB_URL, authToken: process.env.TURSO_AUTH_TOKEN })

async function getAbout() {
  const r = await turso.execute('SELECT * FROM about WHERE id = 1')
  if (r.rows.length === 0) return { title: 'About Me', paragraphs: [] }
  const row = r.rows[0]
  return { title: row.title, paragraphs: JSON.parse(row.paragraphs || '[]') }
}

async function getExperience() {
  const r = await turso.execute('SELECT * FROM experience ORDER BY display_order ASC')
  return r.rows.map((row) => ({
    ...row,
    descriptions: JSON.parse((row.descriptions) || '[]'),
    technologies: JSON.parse((row.technologies) || '[]'),
  }))
}

async function getAwards() {
  const r = await turso.execute('SELECT * FROM awards ORDER BY display_order ASC')
  return r.rows
}

async function getProjects() {
  const r = await turso.execute('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC')
  return r.rows.map((row) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : [],
    tech: row.tech ? JSON.parse(row.tech) : [],
    testimonial: row.testimonial_quote
      ? { quote: row.testimonial_quote, author: row.testimonial_author, role: row.testimonial_role }
      : undefined,
  }))
}

async function getSkills() {
  const categoriesResult = await turso.execute('SELECT * FROM skill_categories ORDER BY display_order ASC')
  const skillsResult = await turso.execute('SELECT * FROM skills ORDER BY display_order ASC')
  const skillsData = {}
  categoriesResult.rows.forEach((cat) => {
    skillsData[cat.id] = { image: cat.image, label: cat.label, items: [] }
  })
  skillsResult.rows.forEach((skill) => {
    if (skillsData[skill.category_id]) {
      skillsData[skill.category_id].items.push({
        id: skill.id,
        name: skill.name,
        icon: skill.icon,
        level: skill.level,
      })
    }
  })
  return { categories: categoriesResult.rows, skills: skillsData }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const dumps = {
    about: await getAbout(),
    experience: await getExperience(),
    awards: await getAwards(),
    projects: await getProjects(),
    skills: await getSkills(),
  }
  for (const [key, data] of Object.entries(dumps)) {
    const file = resolve(OUT_DIR, `${key}.json`)
    await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
    const count = Array.isArray(data) ? data.length : Object.keys(data).length
    console.log(`✓ dumped ${key}.json (${count} entries)`)
  }
  console.log(`\nDone. Files written to ${OUT_DIR}`)
  await turso.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
