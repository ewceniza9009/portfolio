import { Router } from 'express'
import turso from '../db.js'

const router = Router()

function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

router.get(['/rss.xml', '/feed.xml'], async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM blogs WHERE published = 1 ORDER BY created_at DESC')
    
    // Fallback domain if host header is missing
    const host = req.headers.host || 'localhost:3000'
    const protocol = req.protocol || 'https'
    const baseUrl = `${protocol}://${host}`

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>\n`
    rss += `<rss version="2.0">\n`
    rss += `<channel>\n`
    rss += `  <title>Developer Blog</title>\n`
    rss += `  <link>${baseUrl}</link>\n`
    rss += `  <description>Latest blog posts and updates.</description>\n`

    result.rows.forEach((blog: any) => {
      const pubDate = new Date(blog.created_at).toUTCString()
      const itemLink = `${baseUrl}/blogs/${blog.slug}`
      
      rss += `  <item>\n`
      rss += `    <title>${escapeXml(blog.title)}</title>\n`
      rss += `    <link>${itemLink}</link>\n`
      rss += `    <description>${escapeXml(blog.summary || '')}</description>\n`
      rss += `    <pubDate>${pubDate}</pubDate>\n`
      rss += `    <guid>${itemLink}</guid>\n`
      rss += `  </item>\n`
    })

    rss += `</channel>\n`
    rss += `</rss>\n`

    res.set('Content-Type', 'application/rss+xml')
    res.send(rss)
  } catch (err) {
    console.error('RSS generation error:', err)
    res.status(500).send('Error generating RSS feed')
  }
})

export default router
