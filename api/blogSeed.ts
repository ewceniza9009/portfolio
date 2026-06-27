import fs from 'fs'
import path from 'path'

export async function seedFirstBlog(turso: any) {
  const slug = 'engineering-realtime-telemetry-signalr'
  
  try {
    // Ensure updated_at column exists on the blogs table (self-healing migration fallback)
    try {
      await turso.execute({
        sql: "ALTER TABLE blogs ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))"
      })
    } catch (_) {
      // Column already exists, ignore error
    }

    const check = await turso.execute({
      sql: 'SELECT id, likes, updated_at FROM blogs WHERE slug = ?',
      args: [slug]
    })
    
    const blogId = '550e8400-e29b-41d4-a716-446655440000'
    const title = 'Engineering Real-Time Telemetry and Secure Clinical Messaging with SignalR'
    const summary = 'A technical deep-dive into the real-time websocket pipelines of Halkyone Clinical OS (EMR), covering SignalR telemetry loops, geospatial privacy masking, and HIPAA-compliant secure messaging.'
    const tags = 'SignalR, WebSockets, Real-Time, IoT, HealthTech, .NET, React'
    const readTime = '8 min read'
    
    // Read the markdown content dynamically from the static file on disk.
    const markdownPath = path.join(process.cwd(), 'api', 'engineering-realtime-telemetry-signalr.md')
    const content = fs.readFileSync(markdownPath, 'utf8')

    // Get the file's last modified timestamp on disk
    const fileStats = fs.statSync(markdownPath)
    const fileMtime = fileStats.mtime.getTime()

    if (check.rows.length > 0) {
      const row = check.rows[0]
      const dbLikes = Number(row.likes || 0)
      const targetLikes = dbLikes === 12 ? 0 : dbLikes

      // Parse the DB updated_at timestamp. SQLite returns a UTC string like 'YYYY-MM-DD HH:MM:SS'.
      // We convert it to ISO format by replacing the space with 'T' and appending 'Z'.
      const dbUpdatedStr = row.updated_at || '1970-01-01 00:00:00'
      const dbMtime = new Date(dbUpdatedStr.replace(' ', 'T') + 'Z').getTime()

      // Sync from disk ONLY if the markdown file on disk has been edited more recently than the database row
      if (fileMtime > dbMtime + 2000) {
        await turso.execute({
          sql: 'UPDATE blogs SET title = ?, content = ?, summary = ?, tags = ?, read_time = ?, likes = ?, updated_at = datetime(\'now\') WHERE slug = ?',
          args: [title, content, summary, tags, readTime, targetLikes, slug]
        })
        console.log(`Successfully synced EMR blog post content from disk (File was updated).`)
      } else {
        console.log(`Skipped syncing EMR blog post: DB is up to date (or newer than disk file).`)
      }
      return
    }

    await turso.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, published, likes, read_time, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, datetime(\'now\'))',
      args: [blogId, slug, title, content, summary, tags, readTime]
    })
    
    console.log('Successfully seeded EMR blog post from disk!')
  } catch (err) {
    console.error('Failed to seed blog post:', err)
  }
}
