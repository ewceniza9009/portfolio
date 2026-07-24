import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import turso from './db.js'

if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is missing.')
}
const JWT_SECRET = process.env.JWT_SECRET

export interface AuthRequest extends Request {
  admin?: { authenticated: boolean }
}

// In-memory rate limiting map for login protection
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (attempt) {
    if (now < attempt.resetTime) {
      if (attempt.count >= 15) {
        return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' })
      }
      attempt.count += 1
    } else {
      loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 })
    }
  } else {
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 })
  }
  next()
}

export function loginHandler(req: Request, res: Response) {
  const { password } = req.body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { authenticated: boolean }
    req.admin = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function isAdminRequest(req: Request): boolean {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return false
  try {
    const token = header.slice(7)
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

// Accepts both JWT tokens and long-lived API tokens (for n8n integration)
export function flexibleAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Missing authorization' })

  // Try JWT first
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { authenticated: boolean }
      ;(req as AuthRequest).admin = decoded
      return next()
    } catch {}
  }

  // Try API token from settings
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  turso.execute({ sql: "SELECT value FROM settings WHERE key = 'api_token'", args: [] })
    .then(result => {
      if (result.rows.length && (result.rows[0] as any).value === token) {
        ;(req as AuthRequest).admin = { authenticated: true }
        return next()
      }
      return res.status(401).json({ error: 'Invalid token' })
    })
    .catch(() => res.status(500).json({ error: 'Auth check failed' }))
}
