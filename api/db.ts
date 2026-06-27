import { createClient } from '@libsql/client'
import { seedFirstBlog } from './blogSeed.js'

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function initDb() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      replied INTEGER DEFAULT 0,
      reply_subject TEXT,
      reply_body TEXT,
      replied_at TEXT,
      subject TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      tags TEXT,
      published INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      read_time TEXT,
      cover_image TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS blog_comments (
      id TEXT PRIMARY KEY,
      blog_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Seed default settings if they don't exist
  await turso.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('rotation_theme_enabled', 'true'),
    ('rotation_accent_enabled', 'false'),
    ('rotation_interval_hours', '2')
  `)

  // Run seed function to add first EMR telemetry blog post
  await seedFirstBlog(turso)
}

export default turso
