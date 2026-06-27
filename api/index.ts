import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import turso, { initDb } from './db.js'
import { seedFirstBlog } from './blogSeed.js'
import { loginHandler, authMiddleware, rateLimitMiddleware } from './auth.js'

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

let dbInitialized: Promise<void> | null = null

function ensureDb() {
  if (!dbInitialized) {
    dbInitialized = initDb().catch(err => {
      console.error('Database initialization failed:', err)
      dbInitialized = null // Allow retry on next request if it failed
      throw err
    })
  }
  return dbInitialized
}

// Ensure DB is initialized before processing any request
app.use(async (req, res, next) => {
  try {
    await ensureDb()
    next()
  } catch (err) {
    res.status(500).json({ error: 'Database initialization failed' })
  }
})

// ── Public: Submit contact form ──
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, subject } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const id = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO messages (id, name, email, message, subject) VALUES (?, ?, ?, ?, ?)',
      args: [id, name, email, message, subject || null],
    })

    res.json({ success: true, id })
  } catch (err) {
    console.error('Contact error:', err)
    res.status(500).json({ error: 'Failed to save message' })
  }
})

// ── Admin: Get all messages ──
app.get('/api/messages', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM messages ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch messages error:', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// ── Admin: Get single message ──
app.get('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM messages WHERE id = ?',
      args: [req.params.id as string],
    })
    if (!result.rows.length) return res.status(404).json({ error: 'Message not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Fetch message error:', err)
    res.status(500).json({ error: 'Failed to fetch message' })
  }
})

// ── Admin: Send email reply ──
app.post('/api/reply', authMiddleware, async (req, res) => {
  try {
    const { messageId, subject, body } = req.body
    if (!messageId || !subject || !body) {
      return res.status(400).json({ error: 'messageId, subject, and body are required' })
    }

    // Get the original message
    const msgResult = await turso.execute({
      sql: 'SELECT * FROM messages WHERE id = ?',
      args: [messageId],
    })
    if (!msgResult.rows.length) return res.status(404).json({ error: 'Message not found' })

    const msg = msgResult.rows[0] as any
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
      return res.status(400).json({ error: 'Invalid recipient email address' })
    }

    // Send email via Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"${process.env.GMAIL_NAME || 'Erwin Wilson Ceniza'}" <${process.env.GMAIL_USER}>`,
      to: msg.email,
      subject,
      text: body,
      replyTo: process.env.GMAIL_USER,
    })

    // Accumulate the reply body in history if it exists
    const updatedBody = msg.reply_body
      ? `${body}\n\n========================================\n[Previous Reply Sent on ${new Date(msg.replied_at).toLocaleString('en-US')}]:\n${msg.reply_body}`
      : body

    // Mark as replied in DB
    await turso.execute({
      sql: 'UPDATE messages SET replied = 1, reply_subject = ?, reply_body = ?, replied_at = datetime(?) WHERE id = ?',
      args: [subject, updatedBody, new Date().toISOString(), messageId],
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Reply error:', err)
    res.status(500).json({ error: 'Failed to send reply' })
  }
})

const FREE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
]

// ── Admin: List available AI models ──
app.get('/api/ai/models', authMiddleware, (_req, res) => {
  res.json({ models: FREE_MODELS })
})

// ── Admin: AI compose message ──
app.post('/api/ai/compose', authMiddleware, async (req, res) => {
  try {
    const { prompt, context, model: modelName } = req.body
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'AI API key not configured' })

    const selected = modelName && FREE_MODELS.includes(modelName) ? modelName : 'gemini-1.5-flash'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: selected })

    const fullPrompt = context
      ? `You are helping compose a professional email reply. Context:\n${context}\n\nInstructions: ${prompt}\n\nWrite the email reply body only (no subject line).`
      : `You are helping compose a professional email. ${prompt}\n\nWrite the email body only (no subject line).`

    const result = await model.generateContent(fullPrompt)
    const text = result.response.text()

    res.json({ body: text.trim() })
  } catch (err) {
    console.error('AI compose error:', err)
    res.status(500).json({ error: 'Failed to generate AI response' })
  }
})

// ==========================================
// ── Public Blog Endpoints ──
// ==========================================

// Get all published blogs
app.get('/api/blogs', async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM blogs WHERE published = 1 ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch blog posts' })
  }
})

// Get single published blog post by slug
app.get('/api/blogs/:slug', async (req, res) => {
  try {
    // Force seeder execution to apply diagram layout updates
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
app.post('/api/blogs/:id/like', async (req, res) => {
  try {
    const { id } = req.params as { id: string }
    // Check if blog exists
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
app.get('/api/blogs/:id/comments', async (req, res) => {
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
app.post('/api/blogs/:id/comments', async (req, res) => {
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

    // Fetch the inserted comment to return it
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

// ==========================================
// ── Admin Blog Endpoints (Protected) ──
// ==========================================

// Get all blogs (drafts + published)
app.get('/api/admin/blogs', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM blogs ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch admin blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch blogs' })
  }
})

// Create a new blog post
app.post('/api/admin/blogs', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, summary, tags, published, read_time, cover_image } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    const id = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, published, read_time, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, slug, title, content, summary || null, tags || null, published ? 1 : 0, read_time || null, cover_image || null] as any,
    })

    res.json({ success: true, id })
  } catch (err: any) {
    console.error('Create blog error:', err)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' })
    }
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

// Update an existing blog post
app.put('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, summary, tags, published, read_time, cover_image } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    await turso.execute({
      sql: 'UPDATE blogs SET title = ?, slug = ?, content = ?, summary = ?, tags = ?, published = ?, read_time = ?, cover_image = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [title, slug, content, summary || null, tags || null, published ? 1 : 0, read_time || null, cover_image || null, req.params.id] as any,
    })

    res.json({ success: true })
  } catch (err: any) {
    console.error('Update blog error:', err)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' })
    }
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

// Delete a blog post
app.delete('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete blog error:', err)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

// Delete a comment (Moderation)
app.delete('/api/admin/comments/:id', authMiddleware, async (req, res) => {
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
app.post('/api/admin/blogs/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, content, title, mode } = req.body
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'AI API key not configured' })

    const selected = 'gemini-1.5-flash'
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: selected })

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

    const result = await model.generateContent(fullPrompt)
    const text = result.response.text()

    res.json({ result: text.trim() })
  } catch (err) {
    console.error('AI blog helper error:', err)
    res.status(500).json({ error: 'Failed to run AI blog helper' })
  }
})

// GET system settings
app.get('/api/settings', async (_req, res) => {
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
app.post('/api/settings', authMiddleware, async (req, res) => {
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

// ── Admin: Login ──
app.post('/api/auth/login', rateLimitMiddleware, loginHandler)

export default app
