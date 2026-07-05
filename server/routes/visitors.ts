import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'
import { isBot } from '../utils/bot-detection.js'
import { geoLookup } from '../utils/geo.js'
import { sendTelegramAlert } from '../utils/telegram.js'

const router = Router()

// In-memory rate limiting for visit tracking
const visitRateLimit = new Map<string, { count: number; resetTime: number }>()
const VISIT_RATE_LIMIT = 30
const VISIT_RATE_WINDOW = 60 * 1000

// Record a page visit
router.post('/api/visit', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim()
    const userAgent = req.headers['user-agent'] || ''
    const referrer = (req.headers['referer'] as string) || ''
    const ref = req.body?.ref || ''
    const path = req.body?.path || ''
    const detectedBot = isBot(userAgent) ? 1 : 0

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
        sql: "INSERT INTO visitors (ip, visit_count, first_visit, last_visit, user_agent, country, region, city, loc, referrer, ref, is_bot) VALUES (?, 1, datetime('now', '+8 hours'), datetime('now', '+8 hours'), ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [ip, userAgent, geo.country, geo.region, geo.city, geo.loc, referrer, ref, detectedBot],
      })

      if (!detectedBot) {
        const locStr = [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'Unknown location'
        const refStr = ref ? ` (ref: ${ref})` : referrer ? ` (via ${new URL(referrer).hostname})` : ''
        sendTelegramAlert(`👤 <b>New human visitor!</b>\n📍 ${locStr}\n🖥 ${userAgent.slice(0, 60)}\n${refStr ? `🔗${refStr}` : ''}`)
      }
    }

    if (!detectedBot) {
      // Record the specific page visit
      if (path) {
        await turso.execute({
          sql: "INSERT INTO page_visits (ip, path, referrer, ref, visited_at) VALUES (?, ?, ?, ?, datetime('now', '+8 hours'))",
          args: [ip, path, referrer, ref]
        })
      }

      await turso.execute({
        sql: "INSERT INTO daily_visits (date, count) VALUES (date('now', '+8 hours'), 1) ON CONFLICT(date) DO UPDATE SET count = count + 1",
        args: [],
      })

      await turso.execute({
        sql: "INSERT INTO hourly_visits (hour, count) VALUES (strftime('%Y-%m-%d %H:00', 'now', '+8 hours'), 1) ON CONFLICT(hour) DO UPDATE SET count = count + 1",
        args: [],
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Visit tracking error:', err)
    res.status(500).json({ error: 'Failed to record visit' })
  }
})

// GET visitor stats with server-side pagination
router.get('/api/visitors', authMiddleware, async (req, res) => {
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
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''

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
    if (startDate) {
      conditions.push('last_visit >= ?')
      args.push(`${startDate} 00:00:00`)
    }
    if (endDate) {
      conditions.push('last_visit <= ?')
      args.push(`${endDate} 23:59:59`)
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

    const dailyConditions = []
    const dailyArgs = []
    if (startDate) { dailyConditions.push('date >= ?'); dailyArgs.push(startDate) }
    if (endDate) { dailyConditions.push('date <= ?'); dailyArgs.push(endDate) }
    const dailyWhere = dailyConditions.length > 0 ? `WHERE ${dailyConditions.join(' AND ')}` : ''

    const daily = await turso.execute({
      sql: `SELECT * FROM daily_visits ${dailyWhere} ORDER BY date DESC LIMIT 60`,
      args: dailyArgs
    })

    const hourlyConditions = []
    const hourlyArgs = []
    if (startDate) { hourlyConditions.push('hour >= ?'); hourlyArgs.push(`${startDate} 00:00`) }
    if (endDate) { hourlyConditions.push('hour <= ?'); hourlyArgs.push(`${endDate} 23:59`) }
    const hourlyWhere = hourlyConditions.length > 0 ? `WHERE ${hourlyConditions.join(' AND ')}` : ''

    const hourly = await turso.execute({
      sql: `SELECT * FROM hourly_visits ${hourlyWhere} ORDER BY hour DESC LIMIT 48`,
      args: hourlyArgs
    })

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

// GET top pages
router.get('/api/visitors/pages', authMiddleware, async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    
    const conditions = []
    const args = []
    if (startDate) { conditions.push('visited_at >= ?'); args.push(`${startDate} 00:00:00`) }
    if (endDate) { conditions.push('visited_at <= ?'); args.push(`${endDate} 23:59:59`) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await turso.execute({
      sql: `SELECT path, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM page_visits ${where} GROUP BY path ORDER BY views DESC LIMIT 50`,
      args
    })

    res.json(result.rows)
  } catch (err) {
    console.error('Fetch top pages error:', err)
    res.status(500).json({ error: 'Failed to fetch top pages' })
  }
})

// GET visitor CSV export
router.get('/api/visitors/export', authMiddleware, async (_req, res) => {
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

// POST preview analytics cleanup
router.post('/api/visitors/cleanup/preview', authMiddleware, async (req, res) => {
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

// POST execute analytics cleanup
router.post('/api/visitors/cleanup', authMiddleware, async (req, res) => {
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

export default router
