import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

import { sendTelegramAlert } from '../utils/telegram.js'

const router = Router()

// In-memory rate limiting for contact form
const contactRateLimit = new Map<string, { count: number; resetTime: number }>()
const CONTACT_RATE_LIMIT = 3 // max 3 messages
const CONTACT_RATE_WINDOW = 60 * 60 * 1000 // per hour

// Submit contact form
router.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, subject, _honeypot } = req.body

    // 1. Honeypot check (bot protection)
    if (_honeypot) {
      // Silently accept but do not process
      return res.json({ success: true, id: uuidv4() })
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // 2. IP Rate Limiting
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim()
    const now = Date.now()
    const entry = contactRateLimit.get(ip)
    if (entry) {
      if (now < entry.resetTime) {
        if (entry.count >= CONTACT_RATE_LIMIT) {
          return res.status(429).json({ error: 'Too many messages sent. Please try again later.' })
        }
        entry.count += 1
      } else {
        contactRateLimit.set(ip, { count: 1, resetTime: now + CONTACT_RATE_WINDOW })
      }
    } else {
      contactRateLimit.set(ip, { count: 1, resetTime: now + CONTACT_RATE_WINDOW })
    }

    const id = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO messages (id, name, email, message, subject) VALUES (?, ?, ?, ?, ?)',
      args: [id, name, email, message, subject || null],
    })

    // 3. Telegram Notification
    const alertMsg = `📨 <b>New Contact Form Message</b>\n\n👤 <b>Name:</b> ${name}\n📧 <b>Email:</b> ${email}\n📝 <b>Subject:</b> ${subject || 'None'}\n\n💬 <b>Message:</b>\n<pre>${message.slice(0, 3000)}</pre>`
    sendTelegramAlert(alertMsg).catch(console.error)

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

// Delete single message
router.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'DELETE FROM messages WHERE id = ?',
      args: [req.params.id as string],
    })
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Message not found' })
    
    // Audit Log for message deletion
    try {
      await turso.execute({
        sql: "INSERT INTO audit_logs (id, admin_email, action, entity, entity_id, details) VALUES (hex(randomblob(16)), ?, 'DELETE', 'message', ?, ?)",
        args: ['admin', req.params.id as string, 'Deleted contact message']
      }).catch(e => console.warn('Failed to audit log message deletion', e));
    } catch (auditErr) {
      console.warn('Audit error', auditErr);
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Delete message error:', err)
    res.status(500).json({ error: 'Failed to delete message' })
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
