import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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
