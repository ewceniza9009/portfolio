import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.get('/api/about', async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM about WHERE id = 1')
    if (result.rows.length === 0) {
      return res.json({ title: 'About Me', paragraphs: [] })
    }
    const row = result.rows[0]
    res.json({
      title: row.title,
      paragraphs: JSON.parse(row.paragraphs as string || '[]')
    })
  } catch (err) {
    console.error('Fetch about error:', err)
    res.status(500).json({ error: 'Failed to fetch about' })
  }
})

router.post('/api/about', authMiddleware, async (req, res) => {
  const { title, paragraphs } = req.body
  try {
    await turso.execute({
      sql: `INSERT INTO about (id, title, paragraphs, updated_at) VALUES (1, ?, ?, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET title = excluded.title, paragraphs = excluded.paragraphs, updated_at = excluded.updated_at`,
      args: [title || 'About Me', JSON.stringify(paragraphs || [])]
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Save about error:', err)
    res.status(500).json({ error: 'Failed to save about' })
  }
})

export default router
