import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import turso from '../db.js'
import { seedFirstBlog } from '../blogSeed.js'

const router = Router()

// Get all published blogs
router.get('/api/blogs', async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM blogs WHERE published = 1 ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch blog posts' })
  }
})

// Get single published blog post by slug
router.get('/api/blogs/:slug', async (req, res) => {
  try {
    await seedFirstBlog(turso)

    const result = await turso.execute({
      sql: 'SELECT * FROM blogs WHERE slug = ? AND published = 1',
      args: [req.params.slug as string],
    })
    if (!result.rows.length) return res.status(404).json({ error: 'Blog post not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Fetch blog by slug error:', err)
    res.status(500).json({ error: 'Failed to fetch blog post' })
  }
})

// Increment blog likes
router.post('/api/blogs/:id/like', async (req, res) => {
  try {
    const { id } = req.params as { id: string }
    const check = await turso.execute({
      sql: 'SELECT likes FROM blogs WHERE id = ?',
      args: [id],
    })
    if (!check.rows.length) return res.status(404).json({ error: 'Blog not found' })

    const currentLikes = Number(check.rows[0].likes || 0)
    const newLikes = currentLikes + 1

    await turso.execute({
      sql: 'UPDATE blogs SET likes = ? WHERE id = ?',
      args: [newLikes, id],
    })

    res.json({ success: true, likes: newLikes })
  } catch (err) {
    console.error('Like blog error:', err)
    res.status(500).json({ error: 'Failed to like blog post' })
  }
})

// Get comments for a blog post
router.get('/api/blogs/:id/comments', async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM blog_comments WHERE blog_id = ? ORDER BY created_at DESC',
      args: [req.params.id as string],
    })
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch comments error:', err)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Add comment to a blog post
router.post('/api/blogs/:id/comments', async (req, res) => {
  try {
    const { id } = req.params as { id: string }
    const { author_name, author_email, content } = req.body

    if (!author_name || !content) {
      return res.status(400).json({ error: 'Name and comment text are required' })
    }

    const commentId = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO blog_comments (id, blog_id, author_name, author_email, content) VALUES (?, ?, ?, ?, ?)',
      args: [commentId, id, author_name, author_email || null, content],
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM blog_comments WHERE id = ?',
      args: [commentId],
    })

    res.json(result.rows[0])
  } catch (err) {
    console.error('Add comment error:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

export default router
