import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.get('/api/awards', async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM awards ORDER BY display_order ASC')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch awards' })
  }
})

router.post('/api/awards', authMiddleware, async (req, res) => {
  const { title, date, company, description, image, display_order } = req.body
  try {
    const result = await turso.execute({
      sql: `INSERT INTO awards (title, date, company, description, image, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        title, date, company, description, image || '', display_order || 0
      ]
    })
    res.json({ id: result.lastInsertRowid })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create award' })
  }
})

router.put('/api/awards/reorder', authMiddleware, async (req, res) => {
  const { items } = req.body
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  try {
    const queries = items.map((item: any) => ({
      sql: 'UPDATE awards SET display_order = ? WHERE id = ?',
      args: [item.display_order, item.id]
    }))

    if (queries.length > 0) {
      const transaction = await turso.transaction('write')
      try {
        for (const query of queries) {
          await transaction.execute(query)
        }
        await transaction.commit()
      } catch (e) {
        await transaction.rollback()
        throw e
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Failed to reorder awards:', err)
    res.status(500).json({ error: 'Failed to reorder awards' })
  }
})

router.put('/api/awards/:id', authMiddleware, async (req, res) => {
  const id = req.params.id as string
  const { title, date, company, description, image } = req.body
  try {
    await turso.execute({
      sql: `UPDATE awards SET title = ?, date = ?, company = ?, description = ?, image = ?
             WHERE id = ?`,
      args: [
        title, date, company, description, image || '', id
      ]
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update award' })
  }
})

router.delete('/api/awards/:id', authMiddleware, async (req, res) => {
  const id = req.params.id as string
  try {
    await turso.execute({
      sql: 'DELETE FROM awards WHERE id = ?',
      args: [id]
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete award' })
  }
})

export default router
