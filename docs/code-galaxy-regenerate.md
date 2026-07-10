# Regenerating the Code Galaxy

The **Code Galaxy** is the 3D graph of the codebase rendered by
`src/components/CodeGalaxy/`. Its data lives in
`src/data/code-galaxy-graph.json` and is copied into
`public/codegalaxy/graph.json` at dev/build time (see `copy-graph-data.mjs`).

This document explains how the data is produced and how to **regenerate it**
whenever you add, remove, or rename source files.

---

## How the data flows

```
source files (src/**)
        │
        ▼
generate-codegalaxy.mjs        ← scans source, builds the graph
        │
        ▼
src/data/code-galaxy-graph.json   ← committed source of truth
        │  (copy-graph-data.mjs)
        ▼
public/codegalaxy/graph.json      ← served to the browser
        │
        ▼
useGraphData.ts → CanvasGraph (three.js)
```

`useGraphData.ts` only **reads** `public/codegalaxy/graph.json`. It never
generates anything, so the graph is always as fresh as the last build.

---

## Quick start (regenerate now)

```bash
# One-off regeneration:
npm run generate:codegalaxy

# Or just start / build — it runs automatically (see npm scripts):
npm run dev
npm run build
```

`generate:codegalaxy` writes a fresh `src/data/code-galaxy-graph.json` using
the **current** source tree. `predev` / `prebuild` already chain it before
`copy-graph-data`, so a normal `npm run dev` or `npm run build` always ships
an up-to-date galaxy — no manual step required.

---

## What the generator does

`generate-codegalaxy.mjs` (dependency-free, Node built-ins only):

1. **Walks** every file under `src/` matching `.ts / .tsx / .js / .jsx`
   (skips `node_modules`, `dist`, tests, `*.d.ts`, and its own data/output).
2. **Creates one node per source file** with the fields the UI expects
   (`id`, `label`, `norm_label`, `source_file`, `source_location`,
   `community`, `community_name`, `file_type`, `degree`). Each file becomes
   its own *community* (so `community_name === filename`), matching the
   original per-file clustering.
3. **Parses import statements** (`import … from`, `export … from`, dynamic
   `import()`) and, for specifiers that resolve to another scanned file,
   emits an `imports` edge between the two files.
4. **Adds a `contains` self-link** per file to preserve the original graph
   shape.
5. Stamps `built_at_commit` with the current short git SHA (falls back to
   `"HEAD"` outside a git repo).

> The schema is defined in `src/components/CodeGalaxy/constants.ts`
> (`GraphNode`, `GraphLink`, `GraphPayload`). If you extend either type,
> update the generator's node/link objects to match.

---

## Adding new files (or folders)

No extra work is needed. Because regeneration is wired into `predev` /
`prebuild`, **any new source file is picked up automatically** on the next
`npm run dev` / `npm run build`:

- A new `src/foo/Bar.tsx` → becomes a new node + its own community.
- If it `import`s an existing file (or is imported by one), the corresponding
  `imports` edge appears.

To force a refresh without restarting the dev server:

```bash
npm run generate:codegalaxy
```

then reload the Code Galaxy view (the file is re-fetched on open).

---

## Tuning the scan

Edit the constants at the top of `generate-codegalaxy.mjs`:

| Knob | Purpose |
| --- | --- |
| `SCAN_DIRS` | Which top-level folders to scan (default `['src']`). Add e.g. `'lib'` if you keep source elsewhere. |
| `INCLUDE_EXT` | File extensions treated as source. |
| `EXCLUDE_DIRS` | Folders skipped entirely (build output, deps, etc.). |
| `SKIP_FILES` | Explicit paths to ignore (the data file, build scripts). |

> Bare/alias imports (`react`, `@/…`, `three`) are **not** resolved — only
> relative specifiers that map to a scanned file become edges, so external
> dependencies never pollute the galaxy.

---

## CI / reproducibility

The generator is deterministic for a given source tree (files are sorted
before assignment), so the same code always yields the same node/community
layout. Commit `src/data/code-galaxy-graph.json` so the graph is reproducible
and the app still works if generation is skipped.
