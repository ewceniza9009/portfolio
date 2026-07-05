import { Router } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'
import { FREE_MODELS, CHAT_MODELS, tryGenerate, createGeminiClient, getAiProvider, getAiModel } from '../utils/ai.js'

const router = Router()

// List available AI providers and models
router.get('/api/ai/providers', authMiddleware, async (_req, res) => {
  try {
    const currentProvider = await getAiProvider()

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

// AI compose message
router.post('/api/ai/compose', authMiddleware, async (req, res) => {
  try {
    const { prompt, context, model: modelName } = req.body
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

    const currentProvider = await getAiProvider()

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
        selected = await getAiModel()
      }

      if (!providerConfig.freeModels.includes(selected)) {
        return res.status(400).json({ error: `Model ${selected} is not available in free tier` })
      }

      const genAI = createGeminiClient(apiKey)
      const model = genAI.getGenerativeModel({ model: selected })

      const fullPrompt = context
        ? `You are helping compose a professional email reply. Context:\n${context}\n\nInstructions: ${prompt}\n\nWrite the email reply body only (no subject line).`
        : `You are helping compose a professional email. ${prompt}\n\nWrite the email body only (no subject line).`

      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      res.json({ body: text.trim() })
    } else if (currentProvider === 'puter') {
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

// Public AI Chat
router.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, context } = req.body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

    const genAI = createGeminiClient(apiKey)

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

export default router
