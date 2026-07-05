import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

// --- PROJECTS ---

router.get('/api/projects', async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC')
    const projects = result.rows.map((row: any) => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : [],
      tech: row.tech ? JSON.parse(row.tech) : [],
      testimonial: row.testimonial_quote ? {
        quote: row.testimonial_quote,
        author: row.testimonial_author,
        role: row.testimonial_role
      } : undefined
    }))
    res.json(projects)
  } catch (err) {
    console.error('Fetch projects error:', err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

router.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, description, details, tech, year, type, color, repo, demo, video, image, fallback, testimonial, display_order } = req.body
    
    const result = await turso.execute({
      sql: `INSERT INTO projects (
        title, subtitle, description, details, tech, year, type, color, repo, demo, video, image, fallback,
        testimonial_quote, testimonial_author, testimonial_role, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        title, subtitle, description, JSON.stringify(details || []), JSON.stringify(tech || []), year, type, color,
        repo || null, demo || null, video || null, image, fallback,
        testimonial?.quote || null, testimonial?.author || null, testimonial?.role || null, display_order || 0
      ]
    })
    res.json({ success: true, id: result.rows[0].id })
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

router.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, description, details, tech, year, type, color, repo, demo, video, image, fallback, testimonial, display_order } = req.body
    await turso.execute({
      sql: `UPDATE projects SET
        title = ?, subtitle = ?, description = ?, details = ?, tech = ?, year = ?, type = ?, color = ?,
        repo = ?, demo = ?, video = ?, image = ?, fallback = ?,
        testimonial_quote = ?, testimonial_author = ?, testimonial_role = ?, display_order = ?
        WHERE id = ?`,
      args: [
        title, subtitle, description, JSON.stringify(details || []), JSON.stringify(tech || []), year, type, color,
        repo || null, demo || null, video || null, image, fallback,
        testimonial?.quote || null, testimonial?.author || null, testimonial?.role || null, display_order || 0,
        req.params.id
      ]
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Update project error:', err)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

router.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [req.params.id as string] })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete project error:', err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})
router.put('/api/projects/reorder', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body // array of { id, display_order }
    
    const queries = items.map((item: any) => ({
      sql: 'UPDATE projects SET display_order = ? WHERE id = ?',
      args: [item.display_order, item.id]
    }))
    
    // Execute all updates in a transaction-like batch
    const results = await turso.batch(queries)
    
    res.json({ success: true })
  } catch (err) {
    console.error('Reorder projects error:', err)
    res.status(500).json({ error: 'Failed to reorder projects' })
  }
})

// --- SKILLS ---

router.get('/api/skills', async (req, res) => {
  try {
    const categoriesResult = await turso.execute('SELECT * FROM skill_categories ORDER BY display_order ASC')
    const skillsResult = await turso.execute('SELECT * FROM skills ORDER BY display_order ASC')
    
    // Group by category
    const skillsData: Record<string, any> = {}
    
    categoriesResult.rows.forEach((cat: any) => {
      skillsData[cat.id] = {
        image: cat.image,
        label: cat.label,
        items: []
      }
    })
    
    skillsResult.rows.forEach((skill: any) => {
      if (skillsData[skill.category_id]) {
        skillsData[skill.category_id].items.push({
          id: skill.id,
          name: skill.name,
          icon: skill.icon,
          level: skill.level
        })
      }
    })
    
    res.json({ categories: categoriesResult.rows, skills: skillsData })
  } catch (err) {
    console.error('Fetch skills error:', err)
    res.status(500).json({ error: 'Failed to fetch skills' })
  }
})

router.post('/api/skill-categories', authMiddleware, async (req, res) => {
  try {
    const { id, label, image, display_order } = req.body
    await turso.execute({
      sql: 'INSERT INTO skill_categories (id, label, image, display_order) VALUES (?, ?, ?, ?)',
      args: [id, label, image, display_order || 0]
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Create skill category error:', err)
    res.status(500).json({ error: 'Failed to create skill category' })
  }
})

router.put('/api/skill-categories/:id', authMiddleware, async (req, res) => {
  try {
    const { label, image, display_order } = req.body
    await turso.execute({
      sql: 'UPDATE skill_categories SET label = ?, image = ?, display_order = ? WHERE id = ?',
      args: [label, image, display_order || 0, req.params.id]
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Update skill category error:', err)
    res.status(500).json({ error: 'Failed to update skill category' })
  }
})

router.delete('/api/skill-categories/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({ sql: 'DELETE FROM skill_categories WHERE id = ?', args: [req.params.id as string] })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete skill category error:', err)
    res.status(500).json({ error: 'Failed to delete skill category' })
  }
})

router.post('/api/skills', authMiddleware, async (req, res) => {
  try {
    const { category_id, name, icon, level, display_order } = req.body
    const result = await turso.execute({
      sql: 'INSERT INTO skills (category_id, name, icon, level, display_order) VALUES (?, ?, ?, ?, ?) RETURNING id',
      args: [category_id, name, icon || null, level || null, display_order || 0]
    })
    res.json({ success: true, id: result.rows[0].id })
  } catch (err) {
    console.error('Create skill error:', err)
    res.status(500).json({ error: 'Failed to create skill' })
  }
})

router.put('/api/skills/:id', authMiddleware, async (req, res) => {
  try {
    const { category_id, name, icon, level, display_order } = req.body
    await turso.execute({
      sql: 'UPDATE skills SET category_id = ?, name = ?, icon = ?, level = ?, display_order = ? WHERE id = ?',
      args: [category_id, name, icon || null, level || null, display_order || 0, req.params.id]
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Update skill error:', err)
    res.status(500).json({ error: 'Failed to update skill' })
  }
})

router.delete('/api/skills/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({ sql: 'DELETE FROM skills WHERE id = ?', args: [req.params.id as string] })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete skill error:', err)
    res.status(500).json({ error: 'Failed to delete skill' })
  }
})

router.put('/api/skill-categories/reorder', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body // array of { id, display_order }
    
    const queries = items.map((item: any) => ({
      sql: 'UPDATE skill_categories SET display_order = ? WHERE id = ?',
      args: [item.display_order, item.id]
    }))
    
    await turso.batch(queries)
    res.json({ success: true })
  } catch (err) {
    console.error('Reorder skill categories error:', err)
    res.status(500).json({ error: 'Failed to reorder skill categories' })
  }
})

router.put('/api/skills/reorder', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body // array of { id, display_order }
    
    const queries = items.map((item: any) => ({
      sql: 'UPDATE skills SET display_order = ? WHERE id = ?',
      args: [item.display_order, item.id]
    }))
    
    await turso.batch(queries)
    res.json({ success: true })
  } catch (err) {
    console.error('Reorder skills error:', err)
    res.status(500).json({ error: 'Failed to reorder skills' })
  }
})

export default router
