import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

// GET system settings
router.get('/api/settings', async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM settings')
    const settingsObj: Record<string, string> = {}
    result.rows.forEach(row => {
      settingsObj[row.key as string] = row.value as string
    })
    res.json(settingsObj)
  } catch (err) {
    console.error('Fetch settings error:', err)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// POST update system settings
router.post('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = req.body
    if (typeof settings !== 'object' || settings === null) {
      return res.status(400).json({ error: 'Invalid settings payload' })
    }

    for (const [key, value] of Object.entries(settings)) {
      await turso.execute({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        args: [key, String(value)]
      })
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Save settings error:', err)
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

export default router
