import { Router } from 'express'
import turso from '../db.js'

const router = Router()

router.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q as string
    if (!query || query.trim().length < 2) {
      return res.json([])
    }

    const searchPattern = `%${query.trim()}%`

    // Search Projects
    const projectsResult = await turso.execute({
      sql: `SELECT id, title, description, 'project' as type, '/#projects' as link
            FROM projects 
            WHERE title LIKE ? OR description LIKE ? OR subtitle LIKE ? OR tech LIKE ?`,
      args: [searchPattern, searchPattern, searchPattern, searchPattern],
    })

    // Search Blogs
    const blogsResult = await turso.execute({
      sql: `SELECT id, title, summary as description, 'blog' as type, '/blogs/' || slug as link
            FROM blogs 
            WHERE published = 1 AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)`,
      args: [searchPattern, searchPattern, searchPattern, searchPattern],
    })

    // Search Skills
    const skillsResult = await turso.execute({
      sql: `SELECT id, name as title, '' as description, 'skill' as type, '/#skills' as link
            FROM skills 
            WHERE name LIKE ?`,
      args: [searchPattern],
    })

    const results = [
      ...projectsResult.rows,
      ...blogsResult.rows,
      ...skillsResult.rows,
    ]

    res.json(results)
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

export default router
