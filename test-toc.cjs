const fs = require('fs');

function extractHeadings(content) {
  if (!content) return []
  const lines = content.split('\n')
  const headings = []
  let inCodeBlock = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) { 
      inCodeBlock = !inCodeBlock; 
      console.log('Toggled code block at line', i+1, 'inCodeBlock:', inCodeBlock, 'line:', JSON.stringify(line));
      continue; 
    }
    if (inCodeBlock) continue
    const m = line.match(/^(#{1,6})\s+(.+)$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].replace(/[*_`~\[\]\(\)]/g, '').trim()
    if (!text) continue
    headings.push({ text, level, lineIndex: i+1 })
  }
  return headings.filter(h => h.level >= 2 && h.level <= 3).slice(0, 20)
}

fetch('http://localhost:3000/api/blogs').then(r => r.json()).then(data => {
  const latest = data.find(b => b.title.includes('SOLID'));
  console.log('Latest blog:', latest ? latest.title : 'Not found');
  if (latest) {
      const headings = extractHeadings(latest.content);
      console.log('Headings found:', headings.length);
      console.log(headings);
  }
}).catch(console.error);
