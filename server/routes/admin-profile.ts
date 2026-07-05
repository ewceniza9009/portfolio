import { Router } from 'express'
import turso from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

// Upload Profile Picture (multipart/form-data)
router.post('/api/admin/upload-profile-pic', authMiddleware, async (req, res) => {
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

// Reset Profile Picture to default
router.post('/api/admin/reset-profile-pic', authMiddleware, async (_req, res) => {
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

export default router
