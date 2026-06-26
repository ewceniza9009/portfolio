import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod'

export interface AuthRequest extends Request {
  admin?: { authenticated: boolean }
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
