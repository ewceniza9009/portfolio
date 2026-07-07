import fs from 'fs';
import path from 'path';

const src = 'src/data/code-galaxy-graph.json';
const dest = 'public/codegalaxy/graph.json';

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const sizeKB = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`CodeGalaxy: shipped ${sizeKB}KB → ${dest}`);
}
