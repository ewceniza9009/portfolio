import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

// Fetch all audit logs
router.get('/api/admin/audit-logs', authMiddleware, async (_req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500')
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch audit logs error:', err)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// Clear audit logs
router.delete('/api/admin/audit-logs', authMiddleware, async (_req, res) => {
  try {
    await turso.execute('DELETE FROM audit_logs')
    res.json({ success: true })
  } catch (err) {
    console.error('Clear audit logs error:', err)
    res.status(500).json({ error: 'Failed to clear audit logs' })
  }
})

export default router
