import { writeFileSync } from 'fs'

const SITE_URL = 'https://erwinwilsonceniza.qzz.io'
const API_URL = `${SITE_URL}/api/blogs`

const staticUrls = [
  { loc: `${SITE_URL}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/blogs`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/#hero`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/#about`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/#experience`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/#projects`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/#skills`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/#contact`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' }
]

const escapeXml = (str) => str.replace(/[<>&'"]/g, (c) => ({
  '<': '<', '>': '>', '&': '&', "'": '&apos;', '"': '"'
})[c])

const buildSitemap = (urls) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
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
}

async function main() {
  const allUrls = [...staticUrls]

  try {
    const res = await fetch(API_URL)
    if (res.ok) {
      const blogs = await res.json()
      for (const blog of blogs) {
        if (blog.published === 1 && blog.slug) {
          allUrls.push({
            loc: `${SITE_URL}/blogs/${blog.slug}`,
            lastmod: (blog.updated_at || blog.created_at || new Date().toISOString()).split(' ')[0],
            changefreq: 'monthly',
            priority: '0.8'
          })
        }
      }
      console.log(`Fetched ${blogs.length} blogs from API`)
    } else {
      console.warn(`API returned ${res.status}; using static URLs only`)
    }
  } catch (err) {
    console.warn(`Could not fetch blogs API: ${err.message}; using static URLs only`)
  }

  const xml = buildSitemap(allUrls)
  writeFileSync('public/sitemap.xml', xml)
  console.log(`Wrote sitemap.xml with ${allUrls.length} URLs`)
}

main()
