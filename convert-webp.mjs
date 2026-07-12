import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Convert every PNG / JPG / JPEG image inside the project's public tree
 * into a next-gen WebP (and AVIF) variant.  The script is idempotent:
 *   * Files that already have a .webp / .avif pair are skipped
 *     (so re-runs are fast).
 *   * If the optimized variant is older than the source, it is regenerated.
 *
 * Usage:
 *   1. npm install -D sharp    (already in devDependencies)
 *   2. node convert-webp.mjs   (or:  node convert-webp.mjs --force)
 *
 * Flags:
 *   --force     Re-convert every file, ignoring mtime checks.
 *   --no-avif   Skip AVIF generation (WebP only).
 *   --quality=N Override WebP quality (default 82).
 */

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const NO_AVIF = args.includes('--no-avif')
const qualityArg = args.find(a => a.startsWith('--quality='))
const WEBP_QUALITY = qualityArg ? parseInt(qualityArg.split('=')[1], 10) : 82
const AVIF_QUALITY = 60

// Directories to scan for source images.  Anything under public/ is served by Vite as static assets.
const TARGET_DIRS = [
  path.join(__dirname, 'public', 'img'),
  path.join(__dirname, 'public', 'gallery'),
]

// File extensions we will convert.
const SOURCE_EXTS = new Set(['.png', '.jpg', '.jpeg'])

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist
  for (const entry of fs.readdirSync(dir)) {
    const filepath = path.join(dir, entry)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      walkSync(filepath, filelist)
    } else {
      filelist.push(filepath)
    }
  }
  return filelist
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main() {
  console.log('━'.repeat(60))
  console.log('  Elite Image Conversion Pipeline')
  console.log('━'.repeat(60))
  console.log(`WebP quality: ${WEBP_QUALITY}  |  AVIF: ${NO_AVIF ? 'disabled' : `quality ${AVIF_QUALITY}`}`)
  console.log(`Mode: ${FORCE ? 'FORCE (re-convert all)' : 'incremental (skip up-to-date)'}`)
  console.log('')

  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('✘ sharp is not installed.  Run:  npm install -D sharp')
    process.exit(1)
  }

  let totalSource = 0
  let totalWebp = 0
  let totalAvif = 0
  let savedBytes = 0

  for (const root of TARGET_DIRS) {
    if (!fs.existsSync(root)) {
      console.log(`  ⊘ Skipping missing dir: ${path.relative(__dirname, root)}`)
      continue
    }

    const files = walkSync(root)
    const sources = files.filter(f => SOURCE_EXTS.has(path.extname(f).toLowerCase()))

    if (sources.length === 0) continue

    console.log(`▸ ${path.relative(__dirname, root)}  (${sources.length} source image${sources.length === 1 ? '' : 's'})`)

    for (const src of sources) {
      const ext = path.extname(src)
      const base = src.slice(0, -ext.length)
      const webp = `${base}.webp`
      const avif = NO_AVIF ? null : `${base}.avif`

      const srcStat = fs.statSync(src)
      totalSource++

      // WebP
      const webpStale = FORCE || !fs.existsSync(webp) || fs.statSync(webp).mtimeMs < srcStat.mtimeMs
      if (webpStale) {
        const beforeWebp = fs.existsSync(webp) ? fs.statSync(webp).size : 0
        await sharp(src).webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webp)
        const afterWebp = fs.statSync(webp).size
        savedBytes += Math.max(0, beforeWebp - afterWebp)
        console.log(`   ✔ ${path.relative(__dirname, src)}  →  ${path.basename(webp)}  (${formatBytes(srcStat.size)} → ${formatBytes(afterWebp)})`)
      }
      totalWebp++

      // AVIF
      if (avif) {
        const avifStale = FORCE || !fs.existsSync(avif) || fs.statSync(avif).mtimeMs < srcStat.mtimeMs
        if (avifStale) {
          const beforeAvif = fs.existsSync(avif) ? fs.statSync(avif).size : 0
          await sharp(src).avif({ quality: AVIF_QUALITY, effort: 4 }).toFile(avif)
          const afterAvif = fs.statSync(avif).size
          savedBytes += Math.max(0, beforeAvif - afterAvif)
        }
        totalAvif++
      }
    }
    console.log('')
  }

  console.log('━'.repeat(60))
  console.log(`  ✓ Done.  Scanned ${totalSource} source image${totalSource === 1 ? '' : 's'}.`)
  console.log(`    WebP variants present: ${totalWebp}`)
  if (!NO_AVIF) console.log(`    AVIF variants present: ${totalAvif}`)
  if (savedBytes > 0) console.log(`    Bytes saved this run:  ${formatBytes(savedBytes)}`)
  console.log('━'.repeat(60))
}

main().catch(err => {
  console.error('✘ Conversion failed:', err)
  process.exit(1)
})
