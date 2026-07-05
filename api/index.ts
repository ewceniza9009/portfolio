import express from 'express'
import cors from 'cors'
import turso, { initDb } from './db.js'

import contactRoutes from './routes/contact.js'
import blogsPublicRoutes from './routes/blogs-public.js'
import blogsAdminRoutes from './routes/blogs-admin.js'
import blogsDevtoRoutes from './routes/blogs-devto.js'
import aiRoutes from './routes/ai.js'
import visitorRoutes from './routes/visitors.js'
import settingsRoutes from './routes/settings.js'
import seoRoutes from './routes/seo.js'
import adminTokenRoutes from './routes/admin-tokens.js'
import adminProfileRoutes from './routes/admin-profile.js'

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

export default app
