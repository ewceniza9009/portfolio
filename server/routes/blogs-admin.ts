import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'
import { notifyIndexNow, SITE_URL } from '../utils/indexnow.js'
import { getAiProvider, getAiModel } from '../utils/ai.js'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../public/uploads')

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
} catch (e) {
  console.warn('Cannot create uploads directory (expected in Vercel)', e)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

// Upload image endpoint
router.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' })
  }
  // Return the path relative to the public directory
  res.json({ url: `/uploads/${req.file.filename}` })
})

// Get all blogs (drafts + published)
router.get('/api/admin/blogs', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT id, slug, title, content, summary, tags, category, published, likes, read_time, cover_image, devto_summary, social_summary, created_at, updated_at FROM blogs ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch admin blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch blogs' })
  }
})

// Create a new blog post
router.post('/api/admin/blogs', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, summary, tags, category, published, read_time, cover_image, devto_summary, social_summary } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    const id = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, category, published, read_time, cover_image, devto_summary, social_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, slug, title, content, summary || null, tags || null, category || 'General', published ? 1 : 0, read_time || null, cover_image || null, devto_summary || null, social_summary || null] as any,
    })

    res.json({ success: true, id })

    if (published) {
      notifyIndexNow([`${SITE_URL}/blogs/${slug}`])
    }
  } catch (err: any) {
    console.error('Create blog error:', err)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' })
    }
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

// Update an existing blog post
router.put('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, summary, tags, category, published, read_time, cover_image, devto_summary, social_summary } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    await turso.execute({
      sql: "UPDATE blogs SET title = ?, slug = ?, content = ?, summary = ?, tags = ?, category = ?, published = ?, read_time = ?, cover_image = ?, devto_summary = ?, social_summary = ?, updated_at = datetime('now') WHERE id = ?",
      args: [title, slug, content, summary || null, tags || null, category || 'General', published ? 1 : 0, read_time || null, cover_image || null, devto_summary || null, social_summary || null, req.params.id] as any,
    })

    res.json({ success: true })

    if (published) {
      notifyIndexNow([`${SITE_URL}/blogs/${slug}`])
    }
  } catch (err: any) {
    console.error('Update blog error:', err)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' })
    }
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

// Delete a blog post
router.delete('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })

    notifyIndexNow([`${SITE_URL}/`, `${SITE_URL}/sitemap.xml`])

    res.json({ success: true })
  } catch (err) {
    console.error('Delete blog error:', err)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

// Delete a comment (Moderation)
router.delete('/api/admin/comments/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM blog_comments WHERE id = ?',
      args: [req.params.id as string],
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete comment error:', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

// AI Assistant for blog writing
router.post('/api/admin/blogs/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, content, title, mode } = req.body
    const currentProvider = await getAiProvider()

    if (currentProvider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

      const selected = await getAiModel()
      const genAI = new GoogleGenerativeAI(apiKey)
      const genModel = genAI.getGenerativeModel({ model: selected })

      let fullPrompt = ''
      if (mode === 'outline') {
        fullPrompt = `You are a professional tech blogger. Generate a detailed, high-quality blog outline in Markdown for an article titled "${title}". Focus area/idea: ${prompt}. Focus on rendering clean headings, bullet points, and brief section ideas.`
      } else if (mode === 'polish') {
        fullPrompt = `You are a professional editor. Rewrite and polish the following draft in Markdown, improving clarity, grammar, flow, and vocabulary, while preserving the exact technical details and context:\n\n${content}`
      } else if (mode === 'summary') {
        fullPrompt = `Summarize the following technical blog post in 1 or 2 sentences for an excerpt/summary field (max 150 characters):\n\n${content}`
      } else {
        fullPrompt = `Write or assist in writing a section for a tech blog post about: ${prompt}.\nContext/draft so far:\n${content || ''}\n\nReturn output in clean Markdown format.`
      }

      const result = await genModel.generateContent(fullPrompt)
      const text = result.response.text()
      return res.json({ result: text.trim() })
    } else if (currentProvider === 'puter') {
      return res.status(400).json({ error: 'Puter AI provider requires client-side AI. Switch to Gemini or configure client-side Puter integration.' })
    } else {
      return res.status(400).json({ error: 'Invalid AI provider' })
    }
  } catch (err) {
    console.error('AI blog helper error:', err)
    res.status(500).json({ error: 'Failed to run AI blog helper' })
  }
})

export default router
