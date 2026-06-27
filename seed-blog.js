import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const turso = createClient({
  url: 'libsql://ewcportfolio-ewceniza9009.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI0OTA4MzcsImlkIjoiMDE5ZjA0YmItMWEwMS03NWY4LTk3OWEtMzkzYmVlMjg2YjQxIiwicmlkIjoiOWI5ODgzM2QtNDI2OC00ZjhhLWI0MDgtMDcwMTU5OGZmY2VhIn0.4LbGvRCLhN7Cx8o5pzcPVHOx-MjXjmmH0F7LVbm3eNgav47PKx_4wVkBdf4MEO4BilJZ6BkgyY3LJAv8eUhWCQ'
})

const slug = 'monolith-vs-microservices-real-world-autopsy'
const title = 'Monolith vs Microservices: A Real-World Architectural Autopsy'
const summary = 'A forensic comparison of SmashElite (monolithic architecture) and Drobble (microservices architecture) — two real production codebases that reveal when each architectural style truly shines.'
const tags = 'Architecture, Monolith, Microservices, Engineering, CQRS, Event-Driven, .NET, Node.js'
const readTime = '12 min read'

const markdownPath = path.join(__dirname, '..', 'smashelite', 'server', 'seed-blog-content.md')
const content = fs.readFileSync(markdownPath, 'utf8')

async function run() {
  try {
    const check = await turso.execute({
      sql: 'SELECT id FROM blogs WHERE slug = ?',
      args: [slug]
    })

    if (check.rows.length > 0) {
      console.log('Blog post already exists, updating content...')
      await turso.execute({
        sql: 'UPDATE blogs SET title = ?, content = ?, summary = ?, tags = ?, read_time = ?, updated_at = datetime(\'now\') WHERE slug = ?',
        args: [title, content, summary, tags, readTime, slug]
      })
      console.log('Blog post updated successfully!')
    } else {
      await turso.execute({
        sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, published, likes, read_time, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 15, ?, datetime(\'now\'))',
        args: ['660e8400-e29b-41d4-a716-446655440001', slug, title, content, summary, tags, readTime]
      })
      console.log('Blog post inserted successfully!')
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

run()
