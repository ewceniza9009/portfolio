import fs from 'fs';

if (fs.existsSync('graphify-out')) {
  fs.cpSync('graphify-out', 'public/graphify-out', { recursive: true, force: true });
  const htmlPath = 'public/graphify-out/graph.html';
  if (fs.existsSync(htmlPath)) {
    let content = fs.readFileSync(htmlPath, 'utf8');
    const faviconTags = '<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=7" /><link rel="apple-touch-icon" href="/favicon.svg?v=7" />';
    if (!content.includes('favicon.svg')) {
      content = content.replace('</title>', '</title>' + faviconTags);
      fs.writeFileSync(htmlPath, content, 'utf8');
      console.log('Injected favicon into graph.html');
    }
  }
}
