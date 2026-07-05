import { createClient } from '@libsql/client'
import { seedAll } from './seed.js'

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

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      ip TEXT PRIMARY KEY,
      visit_count INTEGER DEFAULT 1,
      first_visit TEXT DEFAULT (datetime('now')),
      last_visit TEXT DEFAULT (datetime('now')),
      user_agent TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      loc TEXT,
      referrer TEXT,
      ref TEXT
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS page_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      path TEXT,
      referrer TEXT,
      ref TEXT,
      visited_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS daily_visits (
      date TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS hourly_visits (
      hour TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      details TEXT,
      tech TEXT,
      year TEXT,
      type TEXT,
      color TEXT,
      repo TEXT,
      demo TEXT,
      video TEXT,
      image TEXT,
      fallback TEXT,
      testimonial_quote TEXT,
      testimonial_author TEXT,
      testimonial_role TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS skill_categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      image TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      level TEXT,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS experience (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      position TEXT NOT NULL,
      descriptions TEXT,
      technologies TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY DEFAULT 1,
      title TEXT DEFAULT 'About Me',
      paragraphs TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Migration: add columns that may not exist yet
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN country TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN region TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN city TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN loc TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN referrer TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN ref TEXT') } catch {}
  try { await turso.execute('ALTER TABLE visitors ADD COLUMN is_bot INTEGER DEFAULT 0') } catch {}
  try { await turso.execute('ALTER TABLE blogs ADD COLUMN category TEXT DEFAULT \'General\'') } catch {}
  try { await turso.execute("UPDATE blogs SET category = 'Engineering' WHERE slug LIKE '%engineering%' AND category IS NULL") } catch {}
  try { await turso.execute("UPDATE blogs SET category = 'Engineering' WHERE slug LIKE '%face-recognition%' AND category IS NULL") } catch {}
  try { await turso.execute("UPDATE blogs SET category = 'General' WHERE category IS NULL") } catch {}
  try { await turso.execute('ALTER TABLE blogs ADD COLUMN devto_posted INTEGER DEFAULT 0') } catch {}
  try { await turso.execute('ALTER TABLE blogs ADD COLUMN devto_id TEXT') } catch {}
  try { await turso.execute('ALTER TABLE blogs ADD COLUMN devto_summary TEXT') } catch {}
  try { await turso.execute('ALTER TABLE blogs ADD COLUMN social_summary TEXT') } catch {}


  // Seed default settings if they don't exist
  await turso.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
    ('rotation_theme_enabled', 'true'),
    ('rotation_accent_enabled', 'false'),
    ('rotation_interval_hours', '2'),
    ('paypal_donate_url', 'https://paypal.me/ewceniza'),
    ('default_ai_model', 'gemini-2.5-flash'),
    ('ai_provider', 'gemini'),
    ('cursor_enabled', 'true'),
    ('profile_pic_url', '/img/profile-pic.png?v=1'),
    ('featured_blog_slug', ''),
    ('devto_api_key', ''),
    ('devto_username', ''),
    ('n8n_portfolio_api_key', ''),
    ('n8n_devto_api_key', ''),
    ('n8n_webhook_url', '')
  `)

  // Seed all data
  await seedAll(turso)
}

export default turso
