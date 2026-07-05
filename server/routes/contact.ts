import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

// Submit contact form
router.post('/api/contact', async (req, res) => {
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

// Get all messages
router.get('/api/messages', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM messages ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch messages error:', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get single message
router.get('/api/messages/:id', authMiddleware, async (req, res) => {
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

// Send email reply
router.post('/api/reply', authMiddleware, async (req, res) => {
  try {
    const { messageId, subject, body } = req.body
    if (!messageId || !subject || !body) {
      return res.status(400).json({ error: 'messageId, subject, and body are required' })
    }

    const msgResult = await turso.execute({
      sql: 'SELECT * FROM messages WHERE id = ?',
      args: [messageId],
    })
    if (!msgResult.rows.length) return res.status(404).json({ error: 'Message not found' })

    const msg = msgResult.rows[0] as any
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
      return res.status(400).json({ error: 'Invalid recipient email address' })
    }

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

    const updatedBody = msg.reply_body
      ? `${body}\n\n========================================\n[Previous Reply Sent on ${new Date(msg.replied_at).toLocaleString('en-US')}]:\n${msg.reply_body}`
      : body

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

export default router
