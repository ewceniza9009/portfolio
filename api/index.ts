import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import turso, { initDb } from './db.js'
import { loginHandler, authMiddleware } from './auth.js'

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// Initialize DB on cold start
initDb().catch(console.error)

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

    // Mark as replied in DB
    await turso.execute({
      sql: 'UPDATE messages SET replied = 1, reply_subject = ?, reply_body = ?, replied_at = datetime(?) WHERE id = ?',
      args: [subject, body, new Date().toISOString(), messageId],
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

// ── Admin: Login ──
app.post('/api/auth/login', loginHandler)

export default app
