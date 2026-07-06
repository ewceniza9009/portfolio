import { Router } from 'express'
import turso from '../db.js'
import { flexibleAuth } from '../auth.js'
import { SITE_URL } from '../utils/indexnow.js'
import { getAiProvider, getAiModel, createGeminiClient } from '../utils/ai.js'

const router = Router()

async function generateDevtoSummary(blog: any, modelOverride?: string, providerOverride?: string): Promise<{ body_markdown: string; clientSide?: boolean }> {
  const provider = providerOverride || await getAiProvider()

  if (provider === 'puter') {
    return { body_markdown: blog.content?.slice(0, 3000) || blog.summary || '', clientSide: true }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  let selectedModel: string = modelOverride ?? 'gemini-1.5-flash'
  selectedModel = await getAiModel() || selectedModel

  const genAI = createGeminiClient(apiKey)
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
  const provider = providerOverride || await getAiProvider()

  if (provider === 'puter') {
    return { body_markdown: blog.content?.slice(0, 3000) || blog.summary || '', clientSide: true }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  let selectedModel: string = modelOverride ?? 'gemini-1.5-flash'
  selectedModel = await getAiModel() || selectedModel

  const genAI = createGeminiClient(apiKey)
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

// Get all blogs with Dev.to sync status
router.get('/api/admin/blogs/devto-status', flexibleAuth, async (_req, res) => {
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

// Get blogs not yet posted to Dev.to
router.get('/api/admin/blogs/unposted-devto', flexibleAuth, async (_req, res) => {
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
router.post('/api/admin/blogs/:id/devto-mark', flexibleAuth, async (req, res) => {
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

// Generate and cache Dev.to summary
router.post('/api/admin/blogs/:id/devto-summary', flexibleAuth, async (req, res) => {
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

// Generate and cache social summary
router.post('/api/admin/blogs/:id/social-summary', flexibleAuth, async (req, res) => {
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

// Refine a summary
router.post('/api/admin/blogs/:id/refine-summary', flexibleAuth, async (req, res) => {
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
    selectedModel = await getAiModel() || selectedModel

    const genAI = createGeminiClient(apiKey)
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

// Save a pre-generated summary
router.post('/api/admin/blogs/:id/save-summary', flexibleAuth, async (req, res) => {
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

export default router
