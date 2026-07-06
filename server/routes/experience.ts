import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.get('/api/experience', async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM experience ORDER BY display_order ASC')
    const experience = result.rows.map(row => ({
      ...row,
      descriptions: JSON.parse(row.descriptions as string || '[]'),
      technologies: JSON.parse(row.technologies as string || '[]')
    }))
    res.json(experience)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch experience' })
  }
})

router.post('/api/experience', authMiddleware, async (req, res) => {
  const { year, company, location, position, descriptions, technologies, display_order } = req.body
  try {
    const result = await turso.execute({
      sql: `INSERT INTO experience (year, company, location, position, descriptions, technologies, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        year, company, location, position,
        JSON.stringify(descriptions || []),
        JSON.stringify(technologies || []),
        display_order || 0
      ]
    })
    res.json({ id: result.lastInsertRowid })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create experience' })
  }
})

router.put('/api/experience/reorder', authMiddleware, async (req, res) => {
  const { items } = req.body
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  try {
    const queries = items.map((item: any) => ({
      sql: 'UPDATE experience SET display_order = ? WHERE id = ?',
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
    console.error('Failed to reorder experience:', err)
    res.status(500).json({ error: 'Failed to reorder experience' })
  }
})

router.put('/api/experience/:id', authMiddleware, async (req, res) => {
  const id = req.params.id as string
  const { year, company, location, position, descriptions, technologies } = req.body
  try {
    await turso.execute({
      sql: `UPDATE experience SET year = ?, company = ?, location = ?, position = ?, descriptions = ?, technologies = ?
             WHERE id = ?`,
      args: [
        year, company, location, position,
        JSON.stringify(descriptions || []),
        JSON.stringify(technologies || []),
        id
      ]
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update experience' })
  }
})

router.delete('/api/experience/:id', authMiddleware, async (req, res) => {
  const id = req.params.id as string
  try {
    await turso.execute({
      sql: 'DELETE FROM experience WHERE id = ?',
      args: [id]
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete experience' })
  }
})

export default router
