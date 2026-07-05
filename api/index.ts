import express from 'express'
import cors from 'cors'
import turso, { initDb } from '../server/db.js'

import contactRoutes from '../server/routes/contact.js'
import blogsPublicRoutes from '../server/routes/blogs-public.js'
import blogsAdminRoutes from '../server/routes/blogs-admin.js'
import blogsDevtoRoutes from '../server/routes/blogs-devto.js'
import aiRoutes from '../server/routes/ai.js'
import visitorRoutes from '../server/routes/visitors.js'
import settingsRoutes from '../server/routes/settings.js'
import seoRoutes from '../server/routes/seo.js'
import adminTokenRoutes from '../server/routes/admin-tokens.js'
import adminProfileRoutes from '../server/routes/admin-profile.js'
import adminLogsRoutes from '../server/routes/admin-logs.js'
import cmsRoutes from '../server/routes/cms.js'
import rssRoutes from '../server/routes/rss.js'
import searchRoutes from '../server/routes/search.js'
import experienceRoutes from '../server/routes/experience.js'
import awardsRoutes from '../server/routes/awards.js'
import aboutRoutes from '../server/routes/about.js'

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

let dbInitialized: Promise<void> | null = null

function ensureDb() {
  if (!dbInitialized) {
    dbInitialized = initDb().catch(err => {
      console.error('Database initialization failed:', err)
      dbInitialized = null
      throw err
    })
  }
  return dbInitialized
}

// Ensure DB is initialized before processing any request
app.use(async (_req, res, next) => {
  try {
    await ensureDb()
    next()
  } catch (err) {
    res.status(500).json({ error: 'Database initialization failed' })
  }
})

// Mount route modules
app.use(contactRoutes)
app.use(blogsPublicRoutes)
app.use(blogsAdminRoutes)
app.use(blogsDevtoRoutes)
app.use(aiRoutes)
app.use(visitorRoutes)
app.use(settingsRoutes)
app.use(seoRoutes)
app.use(adminTokenRoutes)
app.use(adminProfileRoutes)
app.use(adminLogsRoutes)
app.use(cmsRoutes)
app.use(rssRoutes)
app.use(searchRoutes)
app.use(experienceRoutes)
app.use(awardsRoutes)
app.use(aboutRoutes)

export default app
