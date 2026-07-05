import { GoogleGenerativeAI } from '@google/generative-ai'
import turso from '../db.js'

export const FREE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
]

export const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
export const MAX_RETRIES_PER_MODEL = 2

export async function tryGenerate(genAI: any, modelName: string, prompt: string): Promise<string> {
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

export async function getAiProvider(): Promise<string> {
  const result = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'ai_provider'", args: [] })
  return (result.rows[0] as any)?.value || 'gemini'
}

export async function getAiModel(): Promise<string> {
  const result = await turso.execute({ sql: "SELECT value FROM settings WHERE key = 'default_ai_model'", args: [] })
  return (result.rows[0] as any)?.value || 'gemini-2.5-flash'
}

export function createGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey)
}
