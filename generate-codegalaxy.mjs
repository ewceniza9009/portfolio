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
 *   nodes[]  – one per source file + one per top-level declaration
 *   links[]  – `contains` (file→symbol), `imports` (file→symbol/file),
 *              `imports_from` (file→file)
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
const ROOT = __dirname;
const OUT = path.join(ROOT, 'src', 'data', 'code-galaxy-graph.json');

const SCAN_DIRS = ['src'];

const INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', 'build', '.next', 'coverage', 'out',
]);
const SKIP_FILES = new Set([
  'src/data/code-galaxy-graph.json',
  'generate-codegalaxy.mjs',
  'copy-graph-data.mjs',
  'generate-sitemap.mjs',
]);

/* ── helpers ────────────────────────────────────────────────────────────── */

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

/** Convert a posix file path to a snake_case id (no extension, no src/ prefix). */
function pathToId(rel) {
  return rel
    .replace(/^src\//, '')     // strip src/ prefix (matching original AST scanner)
    .replace(/\.[^.]+$/, '')   // strip ext
    .split('/')
    .join('_')                 // path separators → underscore
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ''); // strip non-alnum
}

/** Strip src/ prefix from a relative path for source_file field. */
function srcFile(rel) {
  return rel.replace(/^src\//, '');
}

/** Convert a symbol name to lowercase for id use. */
function symbolToId(name) {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

/** Resolve a relative specifier to a scanned file path, or null. */
function resolveSpec(importerRel, spec, fileSet) {
  if (!spec.startsWith('.')) return null;
  const baseDir = path.posix.dirname(importerRel);
  const joined = path.posix.join(baseDir, spec);
  const exts = ['', '.ts', '.tsx', '.js', '.jsx'];
  const indexExts = ['.ts', '.tsx', '.js', '.jsx'];
  for (const e of exts) if (fileSet.has(joined + e)) return joined + e;
  for (const e of indexExts) {
    const idx = path.posix.join(joined, 'index' + e);
    if (fileSet.has(idx)) return idx;
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
  } catch { /* ignore */ }
  return 'HEAD';
}

/* ── symbol extraction ──────────────────────────────────────────────────── */

/**
 * Extract top-level declarations from a source file.
 * Returns { name, line } for each symbol.
 *
 * Rules (matching the original AST scanner):
 *  - Only top-level (brace depth 0) declarations
 *  - Functions, classes, consts, lets, vars, interfaces, types, enums
 *  - Both exported and non-exported
 *  - Skips `import` statements and variable declarations inside functions
 */
function extractTopLevelSymbols(src) {
  const symbols = [];
  const lines = src.split('\n');

  // Track brace depth to skip nested declarations
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for declaration BEFORE counting braces on this line
    // (the declaration keyword is at depth 0, the opening brace comes after)
    if (braceDepth === 0) {
      // Match top-level declarations (including declare statements for .d.ts)
      const m = trimmed.match(
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+(\w+)/
      ) || trimmed.match(/^declare\s+(?:global|module)\s/);
      if (m && !trimmed.startsWith('import') && m[1]) {
        symbols.push({ name: m[1], line: i + 1 });
      }

      // Also capture lazy imports: const X = lazy(() => import('...'))
      const lazyM = trimmed.match(/^const\s+(\w+)\s*=\s*lazy\s*\(\s*\(\)\s*=>\s*import\(/);
      if (lazyM) {
        symbols.push({ name: lazyM[1], line: i + 1 });
      }
    }

    // Count braces AFTER checking declaration (to track depth for next line)
    for (const ch of line) {
      if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
    }
  }

  return symbols;
}

/* ── import parsing ─────────────────────────────────────────────────────── */

/**
 * Parse import statements and return structured data.
 * Returns { default: string|null, named: string[], spec: string, line: number }[]
 */
function parseImports(src) {
  const results = [];
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // import X from 'spec'   (default import)
    const defM = line.match(/^import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);
    if (defM) {
      results.push({ default: defM[1], named: [], spec: defM[2], line: i + 1 });
      continue;
    }

    // import { A, B, C } from 'spec'   (named imports)
    const namedM = line.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
    if (namedM) {
      const names = namedM[1].split(',').map(s => s.trim().replace(/^type\s+/, '')).filter(Boolean);
      results.push({ default: null, named: names, spec: namedM[2], line: i + 1 });
      continue;
    }

    // import { A, B } from 'spec' spread across multiple lines (rare but possible)
    // import X, { A } from 'spec'  (mixed default + named)
    const mixedM = line.match(/^import\s+(\w+)\s*,\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
    if (mixedM) {
      const names = mixedM[2].split(',').map(s => s.trim().replace(/^type\s+/, '')).filter(Boolean);
      results.push({ default: mixedM[1], named: names, spec: mixedM[3], line: i + 1 });
      continue;
    }

    // import 'spec'   (side-effect import)
    const sideM = line.match(/^import\s*['"]([^'"]+)['"]/);
    if (sideM) {
      results.push({ default: null, named: [], spec: sideM[1], line: i + 1 });
      continue;
    }

    // Dynamic import() used in lazy() calls – already handled by extractTopLevelSymbols
    // export { X } from 'spec'  (re-exports)
    const reexportM = line.match(/^export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
    if (reexportM) {
      const names = reexportM[1].split(',').map(s => {
        const parts = s.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim(); // use the alias if present
      }).filter(Boolean);
      results.push({ default: null, named: names, spec: reexportM[2], line: i + 1 });
    }
  }

  return results;
}

/* ── main ───────────────────────────────────────────────────────────────── */

function main() {
  const files = collectFiles();
  const fileSet = new Set(files);

  // Build file id map
  const relToId = new Map();
  for (const rel of files) {
    relToId.set(rel, pathToId(rel));
  }

  const nodes = [];
  const links = [];
  const nodeIdSet = new Set();

  // Community index: one per file (deterministic, sorted order)
  const relToCommunity = new Map();
  files.forEach((rel, idx) => relToCommunity.set(rel, idx));

  // ── Pass 1: create file nodes + symbol nodes + contains links ──
  for (const rel of files) {
    const fileId = relToId.get(rel);
    const community = relToCommunity.get(rel);
    const label = path.posix.basename(rel);
    const norm = label.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/g, '');

    // File node
    nodes.push({
      id: fileId,
      label,
      norm_label: norm,
      source_file: srcFile(rel),
      source_location: 'L1',
      _origin: 'ast',
      community,
      community_name: label,
      file_type: 'code',
      degree: 0,
    });
    nodeIdSet.add(fileId);

    // Self contains link
    links.push({
      relation: 'contains',
      source: fileId,
      target: fileId,
      source_file: srcFile(rel),
      source_location: 'L1',
      confidence: 'EXTRACTED',
      weight: 1,
      confidence_score: 1,
    });

    // Extract symbols
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const symbols = extractTopLevelSymbols(src);

    for (const sym of symbols) {
      // Skip default export functions (the file node already represents them)
      const declLine = src.split('\n')[sym.line - 1]?.trim() || '';
      if (/^export\s+default\s+/.test(declLine)) continue;

      // Determine if it's a function by checking the source line
      const isFunc = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function/.test(declLine);

      const labelStr = isFunc ? sym.name + '()' : sym.name;
      const symId = fileId + '_' + symbolToId(sym.name);

      if (nodeIdSet.has(symId)) continue; // deduplicate
      nodeIdSet.add(symId);

      const symNorm = sym.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      nodes.push({
        id: symId,
        label: labelStr,
        norm_label: symNorm,
        source_file: srcFile(rel),
        source_location: 'L' + sym.line,
        _origin: 'ast',
        community,
        community_name: label,
        file_type: 'code',
        degree: 0,
      });

      // Contains link (file → symbol)
      links.push({
        relation: 'contains',
        source: fileId,
        target: symId,
        source_file: srcFile(rel),
        source_location: 'L' + sym.line,
        confidence: 'EXTRACTED',
        weight: 1,
        confidence_score: 1,
      });
    }
  }

  // ── Pass 2: import links ──
  for (const rel of files) {
    const fileId = relToId.get(rel);
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const imports = parseImports(src);

    // Track which files we've already created imports_from for
    const importsFromDone = new Set();

    for (const imp of imports) {
      const targetRel = resolveSpec(rel, imp.spec, fileSet);
      if (!targetRel || targetRel === rel) continue;
      const targetFileId = relToId.get(targetRel);

      // imports_from link (always to the file node)
      if (!importsFromDone.has(targetFileId)) {
        importsFromDone.add(targetFileId);
        links.push({
          relation: 'imports_from',
          source: fileId,
          target: targetFileId,
          source_file: srcFile(rel),
          source_location: 'L' + imp.line,
          confidence: 'EXTRACTED',
          weight: 1,
          confidence_score: 1,
        });
      }

      // Named imports: imports → specific symbol node
      for (const name of imp.named) {
        const symId = targetFileId + '_' + symbolToId(name);
        links.push({
          relation: 'imports',
          source: fileId,
          target: nodeIdSet.has(symId) ? symId : targetFileId + '_default',
          source_file: srcFile(rel),
          source_location: 'L' + imp.line,
          context: 'import',
          confidence: 'EXTRACTED',
          weight: 1,
          confidence_score: 1,
        });
      }

      // Default import: imports → file_default (may be dangling, matching original)
      if (imp.default) {
        links.push({
          relation: 'imports',
          source: fileId,
          target: targetFileId + '_default',
          source_file: srcFile(rel),
          source_location: 'L' + imp.line,
          context: 'import',
          confidence: 'EXTRACTED',
          weight: 1,
          confidence_score: 1,
        });
      }
    }
  }

  // ── Pass 3: compute degree for each node ──
  const degreeMap = new Map();
  for (const n of nodes) degreeMap.set(n.id, 0);
  for (const l of links) {
    if (degreeMap.has(l.source)) degreeMap.set(l.source, degreeMap.get(l.source) + 1);
    if (degreeMap.has(l.target)) degreeMap.set(l.target, degreeMap.get(l.target) + 1);
  }
  for (const n of nodes) {
    n.degree = degreeMap.get(n.id) || 0;
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
