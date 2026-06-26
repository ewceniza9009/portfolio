import { createClient } from '@libsql/client'

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
}

export default turso
