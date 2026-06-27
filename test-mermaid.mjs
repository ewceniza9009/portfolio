import { createClient } from '@libsql/client'

const turso = createClient({
  url: 'libsql://ewcportfolio-ewceniza9009.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI0OTA4MzcsImlkIjoiMDE5ZjA0YmItMWEwMS03NWY4LTk3OWEtMzkzYmVlMjg2YjQxIiwicmlkIjoiOWI5ODgzM2QtNDI2OC00ZjhhLWI0MDgtMDcwMTU5OGZmY2VhIn0.4LbGvRCLhN7Cx8o5pzcPVHOx-MjXjmmH0F7LVbm3eNgav47PKx_4wVkBdf4MEO4BilJZ6BkgyY3LJAv8eUhWCQ'
})

const r = await turso.execute({ sql: 'SELECT content FROM blogs WHERE slug = ?', args: ['monolith-vs-microservices-real-world-autopsy'] })
const content = r.rows[0].content

// Extract all mermaid blocks and test each one
const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
let match
let i = 0
let allOk = true

while ((match = mermaidRegex.exec(content)) !== null) {
  const mermaidCode = match[1].trim()
  const initConfig = `%%{init: {"theme": "dark", "themeVariables": {"fontFamily": "Outfit, Inter, system-ui, sans-serif"}}}%%`
  const formatted = initConfig + '\n' + mermaidCode
  const base64 = Buffer.from(formatted).toString('base64url')
  const url = 'https://mermaid.ink/svg/' + base64
  
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      const errText = await resp.text()
      console.log(`Diagram ${++i} FAILED:`)
      console.log(`Code (first 100 chars): ${mermaidCode.substring(0, 100)}...`)
      console.log(`Status: ${resp.status}`)
      console.log(`Error: ${errText.substring(0, 300)}`)
      console.log('---')
      allOk = false
    } else {
      console.log(`Diagram ${++i} OK (${(await resp.text()).length} bytes)`)
    }
  } catch (e) {
    console.log(`Diagram ${++i} FETCH ERROR: ${e.message}`)
    allOk = false
  }
}

if (allOk) console.log('\nAll diagrams render successfully!')
process.exit(0)
