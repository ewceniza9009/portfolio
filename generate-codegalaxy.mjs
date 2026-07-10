/**
 * generate-codegalaxy.mjs
 * ----------------------------------------------------------------------------
 * Scans the project source and regenerates the Code Galaxy graph data file
 * consumed by `src/components/CodeGalaxy/useGraphData.ts`.
 *
 *   node generate-codegalaxy.mjs
 *
 * It is intentionally dependency-free (Node built-ins only) so it can run in
 * `predev` / `prebuild` without installing anything extra.
 *
 * WHAT IT EMITS  (src/data/code-galaxy-graph.json)
 *   nodes[]  – one per source file
 *   links[]  – `contains` self-loops + `imports` edges between files
 *   built_at_commit – current git short SHA (falls back to "HEAD")
 *
 * The exact schema is dictated by `src/components/CodeGalaxy/constants.ts`
 * (GraphNode / GraphLink / GraphPayload). Keep field names in sync with it.
 * ----------------------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname; // this script lives at the repo root
const OUT = path.join(ROOT, 'src', 'data', 'code-galaxy-graph.json');

// Source roots to scan. Add new top-level folders here (e.g. "lib", "app").
const SCAN_DIRS = ['src'];

const INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', 'build', '.next', 'coverage', 'out',
]);
const SKIP_FILES = new Set([
  'src/data/code-galaxy-graph.json', // this generator's own output
  'generate-codegalaxy.mjs',
  'copy-graph-data.mjs',
  'generate-sitemap.mjs',
]);

/** Recursively collect source files (posix relative paths from ROOT). */
function collectFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (!INCLUDE_EXT.has(ext)) continue;
        if (entry.name.endsWith('.d.ts')) continue;
        if (/(\.test|\.spec)\.(tsx?|jsx?)$/.test(entry.name)) continue;
        const rel = path.relative(ROOT, full).split(path.sep).join('/');
        if (SKIP_FILES.has(rel)) continue;
        files.push(rel);
      }
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d));
  return files.sort();
}

/** Extract module specifiers from import / export-from / dynamic import. */
function extractImports(src) {
  const specs = new Set();
  const re = /(?:import\s[^;]*?from\s*|import\s*|export\s[^;]*?from\s*)(['"])([^'"]+)\1/g;
  let m;
  while ((m = re.exec(src))) specs.add(m[2]);
  const dyn = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dyn.exec(src))) specs.add(m[1]);
  return specs;
}

/** Resolve a relative specifier to a scanned file path, or null. */
function resolveSpec(importerRel, spec, fileSet) {
  if (!spec.startsWith('.')) return null; // skip bare / alias / node_modules
  const baseDir = path.posix.dirname(importerRel);
  const joined = path.posix.join(baseDir, spec);
  const exts = ['', '.ts', '.tsx', '.js', '.jsx'];
  const indexExts = ['.ts', '.tsx', '.js', '.jsx'];
  for (const e of exts) if (fileSet.has(joined + e)) return joined + e;
  for (const e of indexExts) {
    if (fileSet.has(path.posix.join(joined, 'index' + e)))
      return path.posix.join(joined, 'index' + e);
  }
  return null;
}

function getCommit() {
  try {
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  } catch {
    /* ignore */
  }
  return 'HEAD';
}

function main() {
  const files = collectFiles();
  const fileSet = new Set(files);

  const nodes = [];
  const links = [];
  const labelToId = new Map();

  // Deterministic community index (one community per file, matching the
  // original per-file clustering where community_name === filename).
  files.forEach((rel, idx) => {
    const label = path.posix.basename(rel);
    const norm = label.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/g, '');
    const id = rel; // posix path is unique & stable
    labelToId.set(rel, id);
    nodes.push({
      id,
      label,
      norm_label: norm,
      source_file: rel,
      source_location: 'L1',
      _origin: 'scanner',
      community: idx,
      community_name: label,
      file_type: 'code',
      degree: 0,
    });
    // Self `contains` link (matches the original graph shape).
    links.push({
      relation: 'contains',
      source: id,
      target: id,
      source_file: rel,
      source_location: 'L1',
      weight: 1,
      confidence: 'SCANNED',
      confidence_score: 1,
    });
  });

  // Import edges between scanned files.
  for (const rel of files) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const spec of extractImports(src)) {
      const target = resolveSpec(rel, spec, fileSet);
      if (!target || target === rel) continue;
      const sourceId = labelToId.get(rel);
      const targetId = labelToId.get(target);
      links.push({
        relation: 'imports',
        source: sourceId,
        target: targetId,
        source_file: rel,
        source_location: 'L1',
        weight: 1,
        confidence: 'SCANNED',
        confidence_score: 1,
      });
    }
  }

  const payload = {
    nodes,
    links,
    built_at_commit: getCommit(),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 0));
  console.log(
    `CodeGalaxy: generated ${nodes.length} nodes, ${links.length} links → ${path.relative(ROOT, OUT)}`,
  );
}

main();
