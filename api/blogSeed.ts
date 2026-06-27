import fs from 'fs'
import path from 'path'

export async function seedFirstBlog(turso: any) {
  const slug = 'engineering-realtime-telemetry-signalr'
  
  try {
    const check = await turso.execute({
      sql: 'SELECT id, likes FROM blogs WHERE slug = ?',
      args: [slug]
    })
    
    const blogId = '550e8400-e29b-41d4-a716-446655440000'
    const title = 'Engineering Real-Time Telemetry and Secure Clinical Messaging with SignalR'
    const summary = 'A technical deep-dive into the real-time websocket pipelines of Halkyone Clinical OS (EMR), covering SignalR telemetry loops, geospatial privacy masking, and HIPAA-compliant secure messaging.'
    const tags = 'SignalR, WebSockets, Real-Time, IoT, HealthTech, .NET, React'
    const readTime = '8 min read'
    
    // Read the markdown content dynamically from the static file on disk.
    // This bypasses Node's ES module compilation cache so changes are read instantly.
    const markdownPath = path.join(process.cwd(), 'api', 'engineering-realtime-telemetry-signalr.md')
    const content = fs.readFileSync(markdownPath, 'utf8')

    // If the post already exists, update its content, title, tags, and summary.
    // We implement self-healing likes: if likes is the old seed value (12), reset it to 0.
    // Otherwise, preserve the current organic likes count across restarts.
    if (check.rows.length > 0) {
      const dbLikes = Number(check.rows[0].likes || 0)
      const targetLikes = dbLikes === 12 ? 0 : dbLikes

      await turso.execute({
        sql: 'UPDATE blogs SET title = ?, content = ?, summary = ?, tags = ?, read_time = ?, likes = ? WHERE slug = ?',
        args: [title, content, summary, tags, readTime, targetLikes, slug]
      })
      console.log(`Successfully synced EMR blog post content (Likes: ${targetLikes}).`)
      return
    }

    await turso.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, published, likes, read_time) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)',
      args: [blogId, slug, title, content, summary, tags, readTime]
    })
    
    console.log('Successfully seeded EMR blog post from disk!')
  } catch (err) {
    console.error('Failed to seed blog post:', err)
  }
}
