import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const galleryDir = path.join(__dirname, 'public', 'gallery')

// To run this script:
// 1. npm install -D sharp
// 2. node convert-webp.mjs

async function main() {
  try {
    const sharp = (await import('sharp')).default
    
    const walkSync = (dir, filelist = []) => {
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file)
        if (fs.statSync(filepath).isDirectory()) {
          filelist = walkSync(filepath, filelist)
        } else {
          filelist.push(filepath)
        }
      })
      return filelist
    }

    const files = walkSync(galleryDir)
    const pngs = files.filter(f => f.toLowerCase().endsWith('.png'))

    console.log(`Found ${pngs.length} PNGs to convert to WebP...`)

    let converted = 0
    for (const png of pngs) {
      const webp = png.replace(/\.png$/i, '.webp')
      if (!fs.existsSync(webp)) {
        await sharp(png).webp({ quality: 80 }).toFile(webp)
        converted++
        console.log(`Converted: ${path.basename(png)} -> .webp`)
      }
    }

    console.log(`Done! Converted ${converted} new files.`)
  } catch (err) {
    console.error('Error:', err.message)
    console.log('\nMake sure to install sharp first: npm install -D sharp')
  }
}

main()
