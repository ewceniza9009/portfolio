import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import turso, { initDb } from './db.js'
import { seedFirstBlog } from './blogSeed.js'
import { loginHandler, authMiddleware, flexibleAuth, rateLimitMiddleware } from './auth.js'

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── IndexNow: Instant indexing notification ──
const INDEXNOW_KEY = '89e86d03dd5eaacd56983cc66c300f05'
const SITE_URL = 'https://erwinwilsonceniza.qzz.io'
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
]

async function notifyIndexNow(urls: string[]) {
  if (!urls.length) return
  const payload = {
    host: 'erwinwilsonceniza.qzz.io',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      })
    } catch {}
  }
}

// In-memory rate limiting for visit tracking (per IP, max 30 requests per minute)
const visitRateLimit = new Map<string, { count: number; resetTime: number }>()
const VISIT_RATE_LIMIT = 30
const VISIT_RATE_WINDOW = 60 * 1000

// ── Bot Detection Patterns ──
// Comprehensive list of known bot/user-agents to exclude from analytics
const BOT_PATTERNS = [
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|teoma|ia_archiver/i,
  /crawler|spider|scraper|bot|curl|wget|python-requests|go-http-client/i,
  /MJ12bot|AhrefsBot|SemrushBot|DotBot|PetalBot|BLEXBot|Ezooms/i,
  /screaming|octopus|inspector|neumarks|ahrefs|seochat/i,
  /facebookexternalhit|twitterbot|linkedinbot|pinterest|whatsapp|telegrambot/i,
  /embedly|quora|buffer|skypeuri|slackbot|discordbot/i,
  /sogou|exabot|facebot|applebot|yandex|mail.ru/i,
  /rogerbot|fenixbot|overflowbot|happyfoxbot|mindspider/i,
  /facebookcatalog|pandalytics|bytespider|baiduboxapp|msnbot/i,
  /chatgpt|gptbot|perplexitybot|anthropic-ai|claudebot/i,
  /anthropic|gemini|bard|gemini-bot|bard-bot/i,
  /paperlib|semanticscholar|core|openai-research/i,
  /archive.org_bot|archive.org_bot|archive.org|waybackmachine/i,
  /semrushbot|seotools|seoanalyzer|siteaudit|ahrefsbot/i,
]

/**
 * Check if a user-agent string belongs to a known bot/crawler
 */
function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 5) return true
  const uaLower = userAgent.toLowerCase()
  // Exclude empty, very short, or obviously bot-like user agents
  if (uaLower === 'unknown' || uaLower === '-' || uaLower === 'null') return true
  return BOT_PATTERNS.some((pattern) => pattern.test(uaLower))
}

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
app.use(async (_req, res, next) => {
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

// ── Admin: List available AI providers and models ──
app.get('/api/ai/providers', authMiddleware, async (_req, res) => {
  try {
    const providerSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })
    const currentProvider = (providerSetting.rows[0] as any)?.value || 'gemini'
    
    const providers = {
      gemini: {
        name: 'Google Gemini',
        defaultModel: 'gemini-2.5-flash',
        freeModels: FREE_MODELS,
        requiresApiKey: true,
        apiKeyEnv: 'GEMINI_API_KEY'
      },
      puter: {
        name: 'Puter (Free)',
        defaultModel: 'gemini-3.5-flash',
        freeModels: [
          'gemini-3.5-flash',
          'gemini-3.1-flash-lite',
          'gemini-3.1-pro-preview',
          'gemini-3-flash-preview',
          'gemini-3-pro-preview',
          'gemini-2.5-flash-lite-preview-09-2025',
          'gemini-2.5-flash-preview-09-2025',
          'gemini-2.5-flash-lite',
          'gemini-2.5-pro-preview',
          'gemini-2.5-pro-preview-05-06',
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite'
        ],
        requiresApiKey: false
      }
    }
    
    res.json({ 
      currentProvider,
      providers 
    })
  } catch (err) {
    console.error('Fetch AI providers error:', err)
    res.status(500).json({ error: 'Failed to fetch AI providers' })
  }
})

// ── Admin: AI compose message ──
app.post('/api/ai/compose', authMiddleware, async (req, res) => {
  try {
    const { prompt, context, model: modelName } = req.body
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

    const aiProvider = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })
    const currentProvider = (aiProvider.rows[0] as any)?.value || 'gemini'
    
    let selected = modelName || null
    let providerConfig: any = null
    
    if (currentProvider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

      providerConfig = {
        name: 'Google Gemini',
        defaultModel: 'gemini-2.5-flash',
        freeModels: FREE_MODELS,
        requiresApiKey: true,
        apiKeyEnv: 'GEMINI_API_KEY'
      }
      
      if (!selected) {
        const modelSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
        selected = (modelSetting.rows[0] as any)?.value || 'gemini-2.5-flash'
      }
      
      if (!providerConfig.freeModels.includes(selected)) {
        return res.status(400).json({ error: `Model ${selected} is not available in free tier` })
      }
      
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: selected })

      const fullPrompt = context
        ? `You are helping compose a professional email reply. Context:\n${context}\n\nInstructions: ${prompt}\n\nWrite the email reply body only (no subject line).`
        : `You are helping compose a professional email. ${prompt}\n\nWrite the email body only (no subject line).`

      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      res.json({ body: text.trim() })
    } else if (currentProvider === 'puter') {
      // For Puter, we need to include the Puter.js script in the frontend
      // This endpoint just checks if Puter is available and returns a message
      res.json({ 
        body: 'Puter AI provider is selected. Please ensure you have loaded Puter.js on the client side.',
        puterAvailable: true,
        note: 'Puter uses a user-pays model - no API keys required on client side'
      })
    } else {
      return res.status(400).json({ error: 'Invalid AI provider' })
    }
  } catch (err) {
    console.error('AI compose error:', err)
    res.status(500).json({ error: 'Failed to generate AI response' })
  }
})

// ── Public: AI Chat (no auth required - portfolio visitor assistant) ──
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
const MAX_RETRIES_PER_MODEL = 2

async function tryGenerate(genAI: any, modelName: string, prompt: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: any) {
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('Service Unavailable')
      if (is503 && attempt < MAX_RETRIES_PER_MODEL) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000))
        continue
      }
      throw err
    }
  }
  throw new Error(`All retries exhausted for ${modelName}`)
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, context } = req.body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

    const genAI = new GoogleGenerativeAI(apiKey)

    // Build conversation: system instruction + context + last 10 messages
    const history = messages.slice(-10)
    const parts: string[] = []
    parts.push('You are a helpful portfolio assistant. Answer questions about the portfolio owner. Be concise, friendly, and accurate.')
    if (context) parts.push(`\n\nPORTFOLIO CONTEXT:\n${context}`)
    for (const msg of history) {
      const role = msg.role === 'user' ? 'User' : 'Assistant'
      parts.push(`\n\n${role}: ${msg.content}`)
    }
    parts.push('\n\nAssistant:')
    const fullPrompt = parts.join('')

    let lastError: any = null
    for (const modelName of CHAT_MODELS) {
      try {
        const text = await tryGenerate(genAI, modelName, fullPrompt)
        return res.json({ reply: text.trim() })
      } catch (err) {
        lastError = err
        console.warn(`AI chat model ${modelName} failed, trying next:`, (err as any)?.message)
      }
    }

    console.error('AI chat all models failed:', lastError)
    res.status(503).json({ error: 'All AI models are currently unavailable. Please try again later.' })
  } catch (err) {
    console.error('AI chat error:', err)
    res.status(500).json({ error: 'Failed to generate response' })
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

// Dynamic sitemap.xml - regenerated on every request from live blog data
app.get('/api/sitemap.xml', async (_req, res) => {
  try {
    const SITE_URL = 'https://erwinwilsonceniza.qzz.io'
    const today = new Date().toISOString().split('T')[0]

    const escapeXml = (str: string) =>
      String(str).replace(/[<>&'"]/g, (c) => ({
        '<': '<', '>': '>', '&': '&', "'": '&apos;', '"': '"'
      }[c] as string))

    const staticUrls = [
      { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: `${SITE_URL}/blogs`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: `${SITE_URL}/#about`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#experience`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#projects`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${SITE_URL}/#skills`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/#contact`, lastmod: today, changefreq: 'monthly', priority: '0.7' }
    ]

    const blogResult = await turso.execute(
      'SELECT slug, created_at, updated_at FROM blogs WHERE published = 1 ORDER BY created_at DESC'
    )

    const blogUrls = blogResult.rows.map((row: any) => ({
      loc: `${SITE_URL}/blogs/${row.slug}`,
      lastmod: String(row.updated_at || row.created_at || today).split(' ')[0],
      changefreq: 'monthly',
      priority: '0.8'
    }))

    const allUrls = [...staticUrls, ...blogUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

    res.set('Content-Type', 'application/xml')
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.send(xml)
  } catch (err) {
    console.error('Sitemap generation error:', err)
    res.status(500).send('Failed to generate sitemap')
  }
})

// Dynamic robots.txt
app.get('/api/robots.txt', (_req, res) => {
  const SITE_URL = 'https://erwinwilsonceniza.qzz.io'
  res.set('Content-Type', 'text/plain')
  res.set('Cache-Control', 'public, max-age=3600')
  res.send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`)
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
    const { title, slug, content, summary, tags, category, published, read_time, cover_image } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    const id = uuidv4()
    await turso.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, category, published, read_time, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, slug, title, content, summary || null, tags || null, category || 'General', published ? 1 : 0, read_time || null, cover_image || null] as any,
    })

    res.json({ success: true, id })

    // Notify search engines of new page
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
app.put('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, summary, tags, category, published, read_time, cover_image } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    await turso.execute({
      sql: 'UPDATE blogs SET title = ?, slug = ?, content = ?, summary = ?, tags = ?, category = ?, published = ?, read_time = ?, cover_image = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [title, slug, content, summary || null, tags || null, category || 'General', published ? 1 : 0, read_time || null, cover_image || null, req.params.id] as any,
    })

    res.json({ success: true })

    // Notify search engines of updated page
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
app.delete('/api/admin/blogs/:id', authMiddleware, async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })

    // Notify search engines of removed page (submit homepage to trigger recrawl)
    notifyIndexNow([`${SITE_URL}/`, `${SITE_URL}/sitemap.xml`])

    res.json({ success: true })
  } catch (err) {
    console.error('Delete blog error:', err)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

// ── Admin: Generate long-lived API token for n8n ──
app.post('/api/admin/generate-token', authMiddleware, async (_req, res) => {
  try {
    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '')
    await turso.execute({
      sql: "INSERT INTO settings (key, value) VALUES ('api_token', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [token],
    })
    res.json({ token })
  } catch (err) {
    console.error('Generate token error:', err)
    res.status(500).json({ error: 'Failed to generate token' })
  }
})

// ── Admin: Revoke API token ──
app.post('/api/admin/revoke-token', authMiddleware, async (_req, res) => {
  try {
    await turso.execute({ sql: "DELETE FROM settings WHERE key = 'api_token'", args: [] })
    res.json({ success: true })
  } catch (err) {
    console.error('Revoke token error:', err)
    res.status(500).json({ error: 'Failed to revoke token' })
  }
})

// Check if a token exists (without exposing it)
app.get('/api/admin/token-exists', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'api_token'", args: [] })
    res.json({ exists: result.rows.length > 0 && !!(result.rows[0] as any).value })
  } catch (err) {
    res.status(500).json({ error: 'Failed to check token' })
  }
})

// ── Admin: Download n8n workflow JSON (with all settings pre-filled) ──
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

app.get('/api/admin/n8n-workflow-download', authMiddleware, async (_req, res) => {
  try {
    // Load all required settings
    const settingKeys = ['api_token', 'devto_api_key', 'devto_username', 'n8n_portfolio_api_key', 'n8n_devto_api_key', 'n8n_webhook_url']
    const placeholders: Record<string, string> = {}
    const missing: string[] = []

    for (const key of settingKeys) {
      const result = await turso.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] })
      const val = (result.rows[0] as any)?.value || ''
      placeholders[key] = val
      // Required: api_token, devto_api_key, devto_username
      if (['api_token', 'devto_api_key', 'devto_username'].includes(key) && !val) {
        missing.push(key)
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required settings',
        missing,
        message: `Please fill in the following before downloading the workflow: ${missing.join(', ')}`,
      })
    }

    // Read the template workflow file
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const templatePath = path.join(__dirname, '..', 'n8n-devto-workflow.json')

    let template = fs.readFileSync(templatePath, 'utf-8')

    // Replace placeholders in the template
    template = template.replace(/\{\{BASE_URL\}\}/g, SITE_URL)
    template = template.replace(/\{\{API_TOKEN\}\}/g, placeholders.api_token)
    template = template.replace(/\{\{DEVTO_API_KEY\}\}/g, placeholders.devto_api_key)
    template = template.replace(/\{\{DEVTO_USERNAME\}\}/g, placeholders.devto_username)
    template = template.replace(/\{\{N8N_PORTFOLIO_KEY\}\}/g, placeholders.n8n_portfolio_api_key || placeholders.api_token)
    template = template.replace(/\{\{N8N_DEVTO_KEY\}\}/g, placeholders.n8n_devto_api_key || placeholders.devto_api_key)

    // Validate JSON parses correctly
    try {
      JSON.parse(template)
    } catch (e) {
      return res.status(500).json({ error: 'Generated workflow JSON is invalid' })
    }

    res.set('Content-Type', 'application/json')
    res.set('Content-Disposition', `attachment; filename="portfolio-devto-workflow.json"`)
    res.send(template)
  } catch (err) {
    console.error('n8n workflow download error:', err)
    res.status(500).json({ error: 'Failed to generate workflow' })
  }
})

// ── Admin: Dev.to Sync Endpoints ──

// Get all blogs with Dev.to sync status (for debug console)
app.get('/api/admin/blogs/devto-status', flexibleAuth, async (_req, res) => {
  try {
    const result = await turso.execute(
      "SELECT id, slug, title, devto_posted, devto_id, created_at FROM blogs WHERE published = 1 ORDER BY created_at DESC"
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch devto status error:', err)
    res.status(500).json({ error: 'Failed to fetch Dev.to status' })
  }
})

// Get blogs not yet posted to Dev.to (for n8n polling)
app.get('/api/admin/blogs/unposted-devto', flexibleAuth, async (_req, res) => {
  try {
    const result = await turso.execute(
      "SELECT id, slug, title, content, summary, tags, category, cover_image, created_at FROM blogs WHERE published = 1 AND (devto_posted = 0 OR devto_posted IS NULL) ORDER BY created_at ASC"
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch unposted devto blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch unposted blogs' })
  }
})

// Mark a blog as posted to Dev.to
app.post('/api/admin/blogs/:id/devto-mark', flexibleAuth, async (req, res) => {
  try {
    const { devto_id } = req.body
    await turso.execute({
      sql: "UPDATE blogs SET devto_posted = 1, devto_id = ? WHERE id = ?",
      args: [devto_id || null, req.params.id as string],
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Mark devto error:', err)
    res.status(500).json({ error: 'Failed to mark blog as posted' })
  }
})

// AI: Summarize blog for Dev.to cross-post
// Generate and cache Dev.to summary
async function generateDevtoSummary(blog: any, modelOverride?: string, providerOverride?: string): Promise<{ body_markdown: string; clientSide?: boolean }> {
  const provider = providerOverride || (await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })).rows[0]?.value || 'gemini'

  if (provider === 'puter') {
    return { body_markdown: blog.content?.slice(0, 3000) || blog.summary || '', clientSide: true }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  let selectedModel: string = modelOverride ?? 'gemini-1.5-flash'
  const modelSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
  selectedModel = (modelSetting.rows[0] as any)?.value || selectedModel

  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({ model: selectedModel })
  const fullUrl = `${SITE_URL}/blogs/${blog.slug}`

  const prompt = `Write a short Dev.to blog post summarizing this technical article. Match this EXACT style:

1. Start with a hook — casual, first person, like talking to a fellow dev
2. Say what the article covers in plain language ("It covers..." / "It walks through...")
3. Include 5-8 bullet points of the key technical highlights — be specific, mention real numbers, tools, thresholds, model sizes, etc.
4. End with a one-liner about real-world issues or lessons learned
5. Finish with a clear CTA: "Read the full article here:" followed by the link on its own line

Rules:
- Tone: casual, confident, like a dev talking to peers — NOT formal, NOT salesy
- Max 250 words
- Do NOT include a title (added separately)
- Do NOT include front matter, YAML, or hashtags in the body
- Do NOT use headings — just paragraphs and bullet points
- Use markdown bullet points (- item)

Full article URL: ${fullUrl}

Article title: ${blog.title}

Article content (first 3000 chars):
${blog.content?.slice(0, 3000) || blog.summary || ''}`

  const aiResult = await genModel.generateContent(prompt)
  return { body_markdown: aiResult.response.text() }
}

async function generateSocialSummary(blog: any, modelOverride?: string, providerOverride?: string): Promise<{ body_markdown: string; clientSide?: boolean }> {
  const provider = providerOverride || (await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })).rows[0]?.value || 'gemini'

  if (provider === 'puter') {
    return { body_markdown: blog.content?.slice(0, 3000) || blog.summary || '', clientSide: true }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  let selectedModel: string = modelOverride ?? 'gemini-1.5-flash'
  const modelSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
  selectedModel = (modelSetting.rows[0] as any)?.value || selectedModel

  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({ model: selectedModel })
  const fullUrl = `${SITE_URL}/blogs/${blog.slug}`

  const prompt = `Write a social media summary of this technical article suitable for LinkedIn and Facebook. Match this style:

1. Start with a hook — professional, engaging, first person
2. 2-3 sentences explaining what the article covers and why it matters
3. 3-4 bullet points of key takeaways
4. End with: "Read the full article here: ${fullUrl}"

Rules:
- Tone: professional but approachable, suitable for LinkedIn
- Max 200 words
- No hashtags
- No markdown formatting (plain text only)
- Use "—" dashes for bullet points

Article title: ${blog.title}

Article content (first 3000 chars):
${blog.content?.slice(0, 3000) || blog.summary || ''}`

  const aiResult = await genModel.generateContent(prompt)
  return { body_markdown: aiResult.response.text() }
}

app.post('/api/admin/blogs/:id/devto-summary', flexibleAuth, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT id, slug, title, content, summary, tags, category, devto_posted, devto_summary FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })
    if (!result.rows.length) return res.status(404).json({ error: 'Blog not found' })

    const blog = result.rows[0] as any
    const force = req.query.force === '1'
    const modelOverride = (req.query.model as string) || undefined
    const providerOverride = (req.query.provider as string) || undefined
    const fullUrl = `${SITE_URL}/blogs/${blog.slug}`

    // Return cached summary if available and not forcing regenerate
    if (!force && !modelOverride && !providerOverride && blog.devto_summary) {
      let tags = (blog.tags || 'webdev,engineering').split(',').map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean).slice(0, 4)
      if (!tags.length) tags = ['webdev']
      return res.json({
        original_id: blog.id,
        title: blog.title,
        body_markdown: blog.devto_summary,
        tags,
        canonical_url: fullUrl,
        description: blog.summary?.trim() || `Technical deep-dive: ${blog.title}`,
        devto_posted: blog.devto_posted,
        cached: true,
      })
    }

    const result_ = await generateDevtoSummary(blog, modelOverride, providerOverride)

    if (result_.clientSide) {
      return res.json({
        original_id: blog.id,
        title: blog.title,
        body_markdown: result_.body_markdown,
        client_side: true,
        provider: 'puter',
      })
    }

    // Save to DB
    await turso.execute({
      sql: 'UPDATE blogs SET devto_summary = ? WHERE id = ?',
      args: [result_.body_markdown, req.params.id as string],
    })

    let tags = (blog.tags || 'webdev,engineering').split(',').map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean).slice(0, 4)
    if (!tags.length) tags = ['webdev']

    res.json({
      original_id: blog.id,
      title: blog.title,
      body_markdown: result_.body_markdown,
      tags,
      canonical_url: fullUrl,
      description: blog.summary?.trim() || `Technical deep-dive: ${blog.title}`,
      devto_posted: blog.devto_posted,
      cached: false,
    })
  } catch (err) {
    console.error('Dev.to summary error:', err)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
})

app.post('/api/admin/blogs/:id/social-summary', flexibleAuth, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT id, slug, title, content, summary, tags, category, social_summary FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })
    if (!result.rows.length) return res.status(404).json({ error: 'Blog not found' })

    const blog = result.rows[0] as any
    const force = req.query.force === '1'
    const modelOverride = (req.query.model as string) || undefined
    const providerOverride = (req.query.provider as string) || undefined

    // Return cached summary if available and not forcing regenerate
    if (!force && !modelOverride && !providerOverride && blog.social_summary) {
      return res.json({
        original_id: blog.id,
        title: blog.title,
        body_markdown: blog.social_summary,
        cached: true,
      })
    }

    const result_ = await generateSocialSummary(blog, modelOverride, providerOverride)

    if (result_.clientSide) {
      return res.json({
        original_id: blog.id,
        title: blog.title,
        body_markdown: result_.body_markdown,
        client_side: true,
        provider: 'puter',
      })
    }

    // Save to DB
    await turso.execute({
      sql: 'UPDATE blogs SET social_summary = ? WHERE id = ?',
      args: [result_.body_markdown, req.params.id as string],
    })

    res.json({
      original_id: blog.id,
      title: blog.title,
      body_markdown: result_.body_markdown,
      cached: false,
    })
  } catch (err) {
    console.error('Social summary error:', err)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
})

app.post('/api/admin/blogs/:id/refine-summary', flexibleAuth, async (req, res) => {
  try {
    const { type, instruction, model: modelOverride } = req.body
    if (!type || !['devto', 'social'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "devto" or "social"' })
    }
    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      return res.status(400).json({ error: 'Instruction is required' })
    }

    const result = await turso.execute({
      sql: 'SELECT id, slug, title, content, summary, devto_summary, social_summary FROM blogs WHERE id = ?',
      args: [req.params.id as string],
    })
    if (!result.rows.length) return res.status(404).json({ error: 'Blog not found' })

    const blog = result.rows[0] as any
    const currentSummary = type === 'devto' ? blog.devto_summary : blog.social_summary
    if (!currentSummary) {
      return res.status(400).json({ error: `No ${type} summary exists yet. Generate one first.` })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

  let selectedModel = modelOverride ?? 'gemini-1.5-flash'
  const modelSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
  selectedModel = (modelSetting.rows[0] as any)?.value || selectedModel

    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({ model: selectedModel })

    const prompt = `Here is a summary of a technical article. Based on this instruction, rewrite the summary accordingly.
Return ONLY the rewritten summary, nothing else.

Instruction: ${instruction.trim()}

Current summary:
${currentSummary}`

    const aiResult = await genModel.generateContent(prompt)
    const refined = aiResult.response.text().trim() || currentSummary

    const column = type === 'devto' ? 'devto_summary' : 'social_summary'
    await turso.execute({
      sql: `UPDATE blogs SET ${column} = ? WHERE id = ?`,
      args: [refined, req.params.id as string],
    })

    res.json({
      original_id: blog.id,
      title: blog.title,
      body_markdown: refined,
    })
  } catch (err) {
    console.error('Refine summary error:', err)
    res.status(500).json({ error: 'Failed to refine summary' })
  }
})

// Save a pre-generated summary (for client-side AI like Puter)
app.post('/api/admin/blogs/:id/save-summary', flexibleAuth, async (req, res) => {
  try {
    const { type, body_markdown } = req.body
    if (!type || !['devto', 'social'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "devto" or "social"' })
    }
    if (!body_markdown || typeof body_markdown !== 'string') {
      return res.status(400).json({ error: 'body_markdown is required' })
    }

    const column = type === 'devto' ? 'devto_summary' : 'social_summary'
    await turso.execute({
      sql: `UPDATE blogs SET ${column} = ? WHERE id = ?`,
      args: [body_markdown, req.params.id as string],
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Save summary error:', err)
    res.status(500).json({ error: 'Failed to save summary' })
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
    const aiProvider = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })
    const currentProvider = (aiProvider.rows[0] as any)?.value || 'gemini'

    let fullPrompt = ''
    if (currentProvider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

      const modelSetting = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
      const selected = (modelSetting.rows[0] as any)?.value || 'gemini-1.5-flash'
      const genAI = new GoogleGenerativeAI(apiKey)
      const genModel = genAI.getGenerativeModel({ model: selected })

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

// ── Admin: Manual IndexNow trigger ──
app.post('/api/admin/indexnow', authMiddleware, async (req, res) => {
  try {
    const { urls } = req.body
    if (!Array.isArray(urls) || !urls.length) {
      return res.status(400).json({ error: 'urls array is required' })
    }
    await notifyIndexNow(urls)
    res.json({ success: true, submitted: urls.length })
  } catch (err) {
    console.error('IndexNow error:', err)
    res.status(500).json({ error: 'Failed to notify search engines' })
  }
})

// ── Visitor Tracking ──

// Geolocation lookup helper
async function geoLookup(ip: string): Promise<{ country: string; region: string; city: string; loc: string }> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: '', region: '', city: '', loc: '' }
  }
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,lat,lon`)
    const data = await resp.json() as any
    if (data && data.country) {
      return {
        country: data.country || '',
        region: data.regionName || '',
        city: data.city || '',
        loc: data.lat && data.lon ? `${data.lat},${data.lon}` : '',
      }
    }
  } catch {}
  return { country: '', region: '', city: '', loc: '' }
}

// Telegram alert helper
async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })
  } catch {}
}

// POST record a page visit
app.post('/api/visit', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim()
    const userAgent = req.headers['user-agent'] || ''
    const referrer = (req.headers['referer'] as string) || ''
    const ref = req.body?.ref || ''
    const detectedBot = isBot(userAgent) ? 1 : 0

    // Rate limit check
    const now = Date.now()
    const entry = visitRateLimit.get(ip)
    if (entry) {
      if (now < entry.resetTime) {
        if (entry.count >= VISIT_RATE_LIMIT) {
          return res.status(429).json({ error: 'Rate limit exceeded' })
        }
        entry.count += 1
      } else {
        visitRateLimit.set(ip, { count: 1, resetTime: now + VISIT_RATE_WINDOW })
      }
    } else {
      visitRateLimit.set(ip, { count: 1, resetTime: now + VISIT_RATE_WINDOW })
    }

    const existing = await turso.execute({
      sql: 'SELECT visit_count, country FROM visitors WHERE ip = ?',
      args: [ip],
    })

    const isNew = existing.rows.length === 0

    if (!isNew) {
      await turso.execute({
        sql: "UPDATE visitors SET visit_count = visit_count + 1, last_visit = datetime('now', '+8 hours'), user_agent = ? WHERE ip = ?",
        args: [userAgent, ip],
      })
    } else {
      const geo = await geoLookup(ip)
      await turso.execute({
        sql: 'INSERT INTO visitors (ip, visit_count, first_visit, last_visit, user_agent, country, region, city, loc, referrer, ref, is_bot) VALUES (?, 1, datetime(\'now\', \'+8 hours\'), datetime(\'now\', \'+8 hours\'), ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [ip, userAgent, geo.country, geo.region, geo.city, geo.loc, referrer, ref, detectedBot],
      })

      // Telegram alert for new visitor (only for humans)
      if (!detectedBot) {
        const locStr = [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'Unknown location'
        const refStr = ref ? ` (ref: ${ref})` : referrer ? ` (via ${new URL(referrer).hostname})` : ''
        sendTelegramAlert(`👤 <b>New human visitor!</b>\n📍 ${locStr}\n🖥 ${userAgent.slice(0, 60)}\n${refStr ? `🔗${refStr}` : ''}`)
      }
    }

    // Daily & hourly counters (humans only)
    if (!detectedBot) {
    await turso.execute({
      sql: 'INSERT INTO daily_visits (date, count) VALUES (date(\'now\', \'+8 hours\'), 1) ON CONFLICT(date) DO UPDATE SET count = count + 1',
      args: [],
    })

    // Hourly visit counter (inside human-only block)
    await turso.execute({
      sql: 'INSERT INTO hourly_visits (hour, count) VALUES (strftime(\'%Y-%m-%d %H:00\', \'now\', \'+8 hours\'), 1) ON CONFLICT(hour) DO UPDATE SET count = count + 1',
      args: [],
    })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Visit tracking error:', err)
    res.status(500).json({ error: 'Failed to record visit' })
  }
})

// GET visitor stats with server-side pagination, sorting, search, and filters (protected)
app.get('/api/visitors', authMiddleware, async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '') || 20))
    const offset = (page - 1) * limit
    const sort = url.searchParams.get('sort') || 'last_visit'
    const order = url.searchParams.get('order')?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const search = url.searchParams.get('search') || ''
    const country = url.searchParams.get('country') || ''
    const humansOnly = url.searchParams.get('humansOnly') === '1'

    const allowedSorts: Record<string, string> = {
      visit_count: 'visit_count',
      first_visit: 'first_visit',
      last_visit: 'last_visit',
      country: 'country',
      ip: 'ip',
    }
    const sortColumn = allowedSorts[sort] || 'last_visit'

    const conditions: string[] = []
    const args: any[] = []

    // Bot detection filter
    if (humansOnly) {
      conditions.push('is_bot = 0')
    }

    if (search) {
      conditions.push(`(ip LIKE ? OR country LIKE ? OR city LIKE ? OR region LIKE ? OR referrer LIKE ? OR ref LIKE ? OR user_agent LIKE ?)`)
      const like = `%${search}%`
      args.push(like, like, like, like, like, like, like)
    }
    if (country) {
      conditions.push('country = ?')
      args.push(country)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await turso.execute({
      sql: `SELECT COUNT(*) as total FROM visitors ${where}`,
      args,
    })
    const total = Number(countResult.rows[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    const visitors = await turso.execute({
      sql: `SELECT * FROM visitors ${where} ORDER BY ${sortColumn} ${order} LIMIT ${limit} OFFSET ${offset}`,
      args,
    })

    const daily = await turso.execute('SELECT * FROM daily_visits ORDER BY date DESC LIMIT 60')
    const hourly = await turso.execute('SELECT * FROM hourly_visits ORDER BY hour DESC LIMIT 48')

    const countries = await turso.execute("SELECT DISTINCT country FROM visitors WHERE country IS NOT NULL AND country != '' ORDER BY country")

    const unfilteredTotal = await turso.execute('SELECT COUNT(*) as count FROM visitors')
    const unfilteredVisits = await turso.execute('SELECT SUM(visit_count) as count FROM visitors')

    res.json({
      visitors: visitors.rows,
      daily: daily.rows,
      hourly: hourly.rows,
      countries: countries.rows.map(r => r.country),
      pagination: { page, limit, total, totalPages },
      unfiltered_total: Number(unfilteredTotal.rows[0]?.count || 0),
      unfiltered_visits: Number(unfilteredVisits.rows[0]?.count || 0),
    })
  } catch (err) {
    console.error('Fetch visitors error:', err)
    res.status(500).json({ error: 'Failed to fetch visitors' })
  }
})

// GET visitor CSV export (protected)
app.get('/api/visitors/export', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT ip, visit_count, first_visit, last_visit, country, region, city, referrer, ref, user_agent FROM visitors ORDER BY last_visit DESC')
    const rows = result.rows as any[]
    const header = 'IP,Visits,First Visit,Last Visit,Country,Region,City,Referrer,Ref,User Agent'
    const csv = [header, ...rows.map(r =>
      [r.ip, r.visit_count, r.first_visit, r.last_visit, r.country || '', r.region || '', r.city || '', r.referrer || '', r.ref || '', `"${(r.user_agent || '').replace(/"/g, '""')}"`].join(',')
    )].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="visitors.csv"')
    res.send(csv)
  } catch (err) {
    console.error('Export visitors error:', err)
    res.status(500).json({ error: 'Failed to export visitors' })
  }
})

// POST preview analytics cleanup (protected)
app.post('/api/visitors/cleanup/preview', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.body
    if (!from || !to) return res.status(400).json({ error: 'from and to dates required' })

    const daily = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM daily_visits WHERE date >= ? AND date <= ?',
      args: [from, to],
    })
    const hourly = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM hourly_visits WHERE hour >= ? AND hour <= ?',
      args: [from + ' 00:00', to + ' 23:59'],
    })
    const visitorsResult = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM visitors WHERE last_visit >= ? AND last_visit <= ?',
      args: [from + ' 00:00', to + ' 23:59'],
    })

    res.json({
      daily: Number(daily.rows[0]?.count || 0),
      hourly: Number(hourly.rows[0]?.count || 0),
      visitors: Number(visitorsResult.rows[0]?.count || 0),
    })
  } catch (err) {
    console.error('Cleanup preview error:', err)
    res.status(500).json({ error: 'Failed to preview cleanup' })
  }
})

// POST execute analytics cleanup (protected)
app.post('/api/visitors/cleanup', authMiddleware, async (req, res) => {
  try {
    const { from, to, tables } = req.body
    if (!from || !to || !Array.isArray(tables)) return res.status(400).json({ error: 'from, to, and tables required' })

    const results: Record<string, number> = {}

    if (tables.includes('daily')) {
      const r = await turso.execute({
        sql: 'DELETE FROM daily_visits WHERE date >= ? AND date <= ?',
        args: [from, to],
      })
      results.daily = Number(r.rowsAffected || 0)
    }
    if (tables.includes('hourly')) {
      const r = await turso.execute({
        sql: 'DELETE FROM hourly_visits WHERE hour >= ? AND hour <= ?',
        args: [from + ' 00:00', to + ' 23:59'],
      })
      results.hourly = Number(r.rowsAffected || 0)
    }
    if (tables.includes('visitors')) {
      const r = await turso.execute({
        sql: 'DELETE FROM visitors WHERE last_visit >= ? AND last_visit <= ?',
        args: [from + ' 00:00', to + ' 23:59'],
      })
      results.visitors = Number(r.rowsAffected || 0)
    }

    res.json({ success: true, deleted: results })
  } catch (err) {
    console.error('Cleanup error:', err)
    res.status(500).json({ error: 'Failed to cleanup analytics' })
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

// ── Admin: Upload Profile Picture (multipart/form-data) ──
app.post('/api/admin/upload-profile-pic', authMiddleware, async (req, res) => {
  try {
    const ctype = (req.headers['content-type'] || '').toLowerCase()
    if (!ctype.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' })
    }

    const raw = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ctype)
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null
    if (!boundary) {
      return res.status(400).json({ error: 'Invalid multipart boundary' })
    }
    const delim = Buffer.from(`--${boundary}`)
    const crlf = Buffer.from('\r\n\r\n')

    // Manual split on multipart delimiter for Buffer (Buffer has no .split method)
    const splitBuffer = (source: Buffer, marker: Buffer): Buffer[] => {
      const segments: Buffer[] = []
      let start = 0
      while (start < source.length) {
        const idx = source.indexOf(marker, start)
        if (idx === -1) {
          segments.push(source.slice(start))
          break
        }
        segments.push(source.slice(start, idx))
        start = idx + marker.length
      }
      return segments
    }

    const segments = splitBuffer(raw, delim)
    let fileBuffer: Buffer | null = null
    let mimeType = 'image/png'
    let ext = 'png'

    for (const part of segments) {
      if (part.length === 0) continue
      const minorCrlf = Buffer.from('--\r\n')
      const minorOnly = Buffer.from('--')
      if (part.equals(minorCrlf) || part.equals(minorOnly)) continue

      const headerEnd = part.indexOf(crlf)
      if (headerEnd === -1) continue
      const headers = part.slice(0, headerEnd).toString('utf8')
      const body = part.slice(headerEnd + crlf.length, part.length - 2)
      const filenameMatch = /filename="([^"]+)"/i.exec(headers)
      if (!filenameMatch) continue
      const ctypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headers)
      if (ctypeMatch) {
        mimeType = ctypeMatch[1].trim().toLowerCase()
        if (!/^image\/(png|jpe?g|webp|gif)$/.test(mimeType)) continue
      }
      if (headers.toLowerCase().includes('content-type: image/')) {
        fileBuffer = body
        const fn = filenameMatch[1].toLowerCase()
        if (fn.endsWith('.jpg') || fn.endsWith('.jpeg')) ext = 'jpg'
        else if (fn.endsWith('.png')) ext = 'png'
        else if (fn.endsWith('.webp')) ext = 'webp'
        else if (fn.endsWith('.gif')) ext = 'gif'
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No image file found in upload' })
    }

    if (fileBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 4MB limit' })
    }

    // Vercel serverless filesystem is read-only — store as base64 data URL instead
    const base64 = fileBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`
    const size = fileBuffer.length

    await turso.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: ['profile_pic_url', dataUrl]
    })

    res.json({
      success: true,
      url: dataUrl,
      size,
      ext
    })
  } catch (err) {
    console.error('Upload profile pic error:', err)
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

// ── Admin: Reset Profile Picture to default ──
app.post('/api/admin/reset-profile-pic', authMiddleware, async (_req, res) => {
  try {
    await turso.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: ['profile_pic_url', '/img/profile-pic.png']
    })
    res.json({ success: true, url: '/img/profile-pic.png' })
  } catch (err) {
    console.error('Reset profile pic error:', err)
    res.status(500).json({ error: 'Failed to reset profile picture' })
  }
})

// ── Admin: Login ──
app.post('/api/auth/login', rateLimitMiddleware, loginHandler)

export default app
