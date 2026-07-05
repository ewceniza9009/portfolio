import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'
import { notifyIndexNow, SITE_URL } from '../utils/indexnow.js'

const router = Router()

// Dynamic sitemap.xml
router.get('/api/sitemap.xml', async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const escapeXml = (str: string) =>
      String(str).replace(/[<>&'"]/g, (c) => ({
        '<': '<', '>': '>', '&': '&', "'": '&apos;', '"': '"'
      }[c] as string))

    const staticUrls = [
      { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: `${SITE_URL}/blogs`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: `${SITE_URL}/#about`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#experience`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#projects`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${SITE_URL}/#skills`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#contact`, lastmod: today, changefreq: 'monthly', priority: '0.7' }
    ]

    const blogResult = await turso.execute(
      'SELECT slug, created_at, updated_at FROM blogs WHERE published = 1 ORDER BY created_at DESC'
    )

    const blogUrls = blogResult.rows.map((row: any) => ({
      loc: `${SITE_URL}/blogs/${row.slug}`,
      lastmod: String(row.updated_at || row.created_at || today).split(' ')[0],
      changefreq: 'monthly',
      priority: '0.8'
    }))

    const allUrls = [...staticUrls, ...blogUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

    res.set('Content-Type', 'application/xml')
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.send(xml)
  } catch (err) {
    console.error('Sitemap generation error:', err)
    res.status(500).send('Failed to generate sitemap')
  }
})

// Dynamic robots.txt
router.get('/api/robots.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain')
  res.set('Cache-Control', 'public, max-age=3600')
  res.send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`)
})

// Manual IndexNow trigger
router.post('/api/admin/indexnow', authMiddleware, async (req, res) => {
  try {
    const { urls } = req.body
    if (!Array.isArray(urls) || !urls.length) {
      return res.status(400).json({ error: 'urls array is required' })
    }
    await notifyIndexNow(urls)
    res.json({ success: true, submitted: urls.length })
  } catch (err) {
    console.error('IndexNow error:', err)
    res.status(500).json({ error: 'Failed to notify search engines' })
  }
})

export default router
