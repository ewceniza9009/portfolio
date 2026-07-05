# Graph Report - portfolio  (2026-07-05)

## Corpus Check
- 99 files · ~86,166 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 477 nodes · 810 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d21213b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_AdminPanel.tsx|AdminPanel.tsx]]
- [[_COMMUNITY_BlogPostPage.tsx|BlogPostPage.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Navbar.tsx|Navbar.tsx]]
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_FloatingControl.tsx|FloatingControl.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_MarkdownEditor.tsx|MarkdownEditor.tsx]]
- [[_COMMUNITY_ProjectsSection.tsx|ProjectsSection.tsx]]
- [[_COMMUNITY_puter.d.ts|puter.d.ts]]
- [[_COMMUNITY_SkillsSection.tsx|SkillsSection.tsx]]
- [[_COMMUNITY_ChartBlock.tsx|ChartBlock.tsx]]
- [[_COMMUNITY_GallerySection.tsx|GallerySection.tsx]]
- [[_COMMUNITY_ErrorBoundary|ErrorBoundary]]
- [[_COMMUNITY_generate-sitemap.mjs|generate-sitemap.mjs]]
- [[_COMMUNITY_vercel.json|vercel.json]]
- [[_COMMUNITY_convert-webp.mjs|convert-webp.mjs]]
- [[_COMMUNITY_vanta.d.ts|vanta.d.ts]]
- [[_COMMUNITY_OG_DEFAULT_IMAGE|OG_DEFAULT_IMAGE]]
- [[_COMMUNITY_OG_SITE_NAME|OG_SITE_NAME]]
- [[_COMMUNITY_OG_SITE_URL|OG_SITE_URL]]
- [[_COMMUNITY_DEFAULT_PROFILE_PIC|DEFAULT_PROFILE_PIC]]
- [[_COMMUNITY_seedAll|seedAll]]

## God Nodes (most connected - your core abstractions)
1. `turso` - 20 edges
2. `AccentKey` - 20 edges
3. `compilerOptions` - 16 edges
4. `authMiddleware()` - 13 edges
5. `getApiUrl()` - 12 edges
6. `apiFetch()` - 11 edges
7. `scripts` - 9 edges
8. `seedAll()` - 9 edges
9. `ACCENT_THEMES` - 9 edges
10. `formatDate()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ensureDb()` --calls--> `initDb()`  [EXTRACTED]
  api/index.ts → server/db.ts
- `NotFoundProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/NotFound.tsx → src/data/accents.ts
- `fetchJson()` --calls--> `getApiUrl()`  [EXTRACTED]
  src/hooks/usePortfolioData.ts → src/utils/api.ts
- `initDb()` --calls--> `seedAll()`  [EXTRACTED]
  server/db.ts → server/seed.ts
- `PortfolioProps` --references--> `AccentKey`  [EXTRACTED]
  src/App.tsx → src/data/accents.ts

## Import Cycles
- None detected.

## Communities (30 total, 6 thin omitted)

### Community 0 - "AdminPanel.tsx"
Cohesion: 0.08
Nodes (27): PortfolioProps, DashboardHeaderProps, AdminPanelProps, BlogPostPageProps, BlogsPageProps, GitHubSectionProps, HeroSectionProps, ROLES (+19 more)

### Community 1 - "BlogPostPage.tsx"
Cohesion: 0.06
Nodes (32): Portfolio(), AboutSectionProps, Award, AwardsSectionProps, BackToTop(), BlogsPage(), categoryMeta, relativeDate() (+24 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (29): devDependencies, autoprefixer, postcss, sharp, tailwindcss, @types/cors, @types/express, @types/jsonwebtoken (+21 more)

### Community 3 - "index.ts"
Cohesion: 0.08
Nodes (39): app, ensureDb(), authMiddleware(), AuthRequest, flexibleAuth(), loginAttempts, initDb(), turso (+31 more)

### Community 4 - "Navbar.tsx"
Cohesion: 0.06
Nodes (35): AnalyticsTabProps, AuditLog, AuditLogsTab(), BlogsTabProps, AI_PRESETS, processCountryStats(), processUAStats(), VISITOR_TABLE_COLUMNS (+27 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (14): AdminPanel(), ContactSectionProps, CopyableContactProps, SocialLinkProps, ADVENTURE_STORY, AdventureChoice, AdventureNode, ChatMessage (+6 more)

### Community 6 - "FloatingControl.tsx"
Cohesion: 0.10
Nodes (12): CHART_TYPE_MAP, ChartBlockProps, COLORS, ParsedChart, Interactive3DBlockProps, InteractiveBlockProps, CodeBlockProps, highlightCode() (+4 more)

### Community 7 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, chart.js, clsx, cors, dotenv, express, framer-motion, @google/generative-ai (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 9 - "MarkdownEditor.tsx"
Cohesion: 0.16
Nodes (10): FocusModeOverlayProps, MarkdownEditorProps, registerCompletionProvider(), buildSnippet(), CHART_SNIPPET, getGenericSnippet(), INTERACTIVE3D_SNIPPET, MERMAID_SNIPPET (+2 more)

### Community 10 - "ProjectsSection.tsx"
Cohesion: 0.15
Nodes (8): Project, ProjectModalProps, filterTabs, Project, ProjectCard, ProjectsSectionProps, TechIcon(), techIcons

### Community 11 - "puter.d.ts"
Cohesion: 0.14
Nodes (5): PuterAIModule, PuterChatOptions, PuterChatResponse, PuterChatTextPart, Window

### Community 12 - "SkillsSection.tsx"
Cohesion: 0.17
Nodes (9): BACKGROUND_DECORATIONS, CATEGORY_HOVER_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, SkillItem, SkillsData, SkillsSectionProps, SkillTag (+1 more)

### Community 13 - "ChartBlock.tsx"
Cohesion: 0.22
Nodes (9): router, visitRateLimit, BOT_PATTERNS, isBot(), isPrivateIP(), isSuspiciousRequest(), PRIVATE_IP_PATTERNS, geoLookup() (+1 more)

### Community 14 - "GallerySection.tsx"
Cohesion: 0.25
Nodes (5): GalleryImage, GalleryTile, PROJECT_ORDER, PROJECTS, GALLERY_DESCRIPTIONS

### Community 15 - "ErrorBoundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 16 - "generate-sitemap.mjs"
Cohesion: 0.50
Nodes (3): buildSitemap(), main(), staticUrls

### Community 17 - "vercel.json"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/index.ts, rewrites

### Community 28 - "seedAll"
Cohesion: 0.46
Nodes (7): seedAbout(), seedAll(), seedAwards(), seedBlog(), seedExperience(), seedProjects(), seedSkills()

## Knowledge Gaps
- **174 isolated node(s):** `app`, `__dirname`, `galleryDir`, `staticUrls`, `name` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccentKey` connect `AdminPanel.tsx` to `BlogPostPage.tsx`, `Navbar.tsx`, `FloatingControl.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `app`, `__dirname`, `galleryDir` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AdminPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `BlogPostPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057912457912457915 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08408249603384453 - nodes in this community are weakly interconnected._