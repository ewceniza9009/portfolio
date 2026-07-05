import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import turso from '../db.js'
import { authMiddleware, loginHandler, rateLimitMiddleware } from '../auth.js'
import { SITE_URL } from '../utils/indexnow.js'

const router = Router()

// Login
router.post('/api/auth/login', rateLimitMiddleware, loginHandler)

// Generate long-lived API token
router.post('/api/admin/generate-token', authMiddleware, async (_req, res) => {
  try {
    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '')
    await turso.execute({
      sql: "INSERT INTO settings (key, value) VALUES ('api_token', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [token],
    })
    res.json({ token })
  } catch (err) {
    console.error('Generate token error:', err)
    res.status(500).json({ error: 'Failed to generate token' })
  }
})

// Revoke API token
router.post('/api/admin/revoke-token', authMiddleware, async (_req, res) => {
  try {
    await turso.execute({ sql: "DELETE FROM settings WHERE key = 'api_token'", args: [] })
    res.json({ success: true })
  } catch (err) {
    console.error('Revoke token error:', err)
    res.status(500).json({ error: 'Failed to revoke token' })
  }
})

// Check if a token exists
router.get('/api/admin/token-exists', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'api_token'", args: [] })
    res.json({ exists: result.rows.length > 0 && !!(result.rows[0] as any).value })
  } catch (err) {
    res.status(500).json({ error: 'Failed to check token' })
  }
})

// Download n8n workflow JSON
router.get('/api/admin/n8n-workflow-download', authMiddleware, async (_req, res) => {
  try {
    const settingKeys = ['api_token', 'devto_api_key', 'devto_username', 'n8n_portfolio_api_key', 'n8n_devto_api_key', 'n8n_webhook_url']
    const placeholders: Record<string, string> = {}
    const missing: string[] = []

    for (const key of settingKeys) {
      const result = await turso.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] })
      const val = (result.rows[0] as any)?.value || ''
      placeholders[key] = val
      if (['api_token', 'devto_api_key', 'devto_username'].includes(key) && !val) {
        missing.push(key)
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required settings',
        missing,
        message: `Please fill in the following before downloading the workflow: ${missing.join(', ')}`,
      })
    }

    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const templatePath = path.join(__dirname, '..', '..', 'n8n-devto-workflow.json')

    let template = fs.readFileSync(templatePath, 'utf-8')

    template = template.replace(/\{\{BASE_URL\}\}/g, SITE_URL)
    template = template.replace(/\{\{API_TOKEN\}\}/g, placeholders.api_token)
    template = template.replace(/\{\{DEVTO_API_KEY\}\}/g, placeholders.devto_api_key)
    template = template.replace(/\{\{DEVTO_USERNAME\}\}/g, placeholders.devto_username)
    template = template.replace(/\{\{N8N_PORTFOLIO_KEY\}\}/g, placeholders.n8n_portfolio_api_key || placeholders.api_token)
    template = template.replace(/\{\{N8N_DEVTO_KEY\}\}/g, placeholders.n8n_devto_api_key || placeholders.devto_api_key)

    try {
      JSON.parse(template)
    } catch (e) {
      return res.status(500).json({ error: 'Generated workflow JSON is invalid' })
    }

    res.set('Content-Type', 'application/json')
    res.set('Content-Disposition', `attachment; filename="portfolio-devto-workflow.json"`)
    res.send(template)
  } catch (err) {
    console.error('n8n workflow download error:', err)
    res.status(500).json({ error: 'Failed to generate workflow' })
  }
})

export default router
