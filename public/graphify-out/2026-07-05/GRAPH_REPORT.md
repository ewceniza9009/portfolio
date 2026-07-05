# Graph Report - portfolio  (2026-07-05)

## Corpus Check
- 85 files · ~74,353 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 412 nodes · 665 edges · 28 communities (22 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63212344`
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

## God Nodes (most connected - your core abstractions)
1. `AccentKey` - 18 edges
2. `compilerOptions` - 16 edges
3. `turso` - 13 edges
4. `getApiUrl()` - 12 edges
5. `scripts` - 8 edges
6. `authMiddleware()` - 8 edges
7. `ACCENT_THEMES` - 8 edges
8. `Blog` - 8 edges
9. `formatDate()` - 8 edges
10. `useProfilePic()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ensureDb()` --calls--> `initDb()`  [EXTRACTED]
  api/index.ts → server/db.ts
- `PortfolioProps` --references--> `AccentKey`  [EXTRACTED]
  src/App.tsx → src/data/accents.ts
- `AdminPanelProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/AdminPanel.tsx → src/data/accents.ts
- `AdminPanel()` --calls--> `useProfilePic()`  [EXTRACTED]
  src/components/AdminPanel.tsx → src/utils/profilePic.ts
- `BlogPostPageProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/BlogPostPage.tsx → src/data/accents.ts

## Import Cycles
- None detected.

## Communities (28 total, 6 thin omitted)

### Community 0 - "AdminPanel.tsx"
Cohesion: 0.08
Nodes (28): PortfolioProps, DashboardHeader(), DashboardHeaderProps, AdminPanelProps, BlogPostPageProps, BlogsPageProps, GitHubSectionProps, HeroSectionProps (+20 more)

### Community 1 - "BlogPostPage.tsx"
Cohesion: 0.09
Nodes (26): BlogsTabProps, MessagesTab(), MessagesTabProps, SettingsTabProps, BackToTop(), BlogPostPage(), BlogsPage(), categoryMeta (+18 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, autoprefixer, postcss, sharp, tailwindcss, @types/cors, @types/express, @types/jsonwebtoken (+20 more)

### Community 3 - "index.ts"
Cohesion: 0.10
Nodes (33): app, ensureDb(), authMiddleware(), AuthRequest, flexibleAuth(), loginAttempts, seedFirstBlog(), initDb() (+25 more)

### Community 4 - "Navbar.tsx"
Cohesion: 0.08
Nodes (23): AnalyticsTabProps, AI_PRESETS, processCountryStats(), processUAStats(), VISITOR_TABLE_COLUMNS, InlinePreviewTabsProps, LoginViewProps, AdminPanel() (+15 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (11): AwardsSectionProps, Experience, ExperienceSectionProps, ResumeModalProps, texts, Award, awards, experience (+3 more)

### Community 6 - "FloatingControl.tsx"
Cohesion: 0.08
Nodes (14): ADVENTURE_STORY, AdventureChoice, AdventureNode, ChatMessage, HistoryLine, SUGGESTIONS, Interactive3DBlockProps, InteractiveBlockProps (+6 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, chart.js, clsx, cors, express, framer-motion, @google/generative-ai, jsonwebtoken (+15 more)

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
Cohesion: 0.18
Nodes (8): BACKGROUND_DECORATIONS, CATEGORY_HOVER_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, SkillItem, SkillsData, SkillsSectionProps, SkillTag

### Community 13 - "ChartBlock.tsx"
Cohesion: 0.29
Nodes (6): CHART_TYPE_MAP, ChartBlockProps, COLORS, parseArray(), parseChartCode(), ParsedChart

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

## Knowledge Gaps
- **152 isolated node(s):** `app`, `__dirname`, `galleryDir`, `staticUrls`, `name` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccentKey` connect `AdminPanel.tsx` to `BlogPostPage.tsx`, `Navbar.tsx`, `App.tsx`, `FloatingControl.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `getApiUrl()` connect `Navbar.tsx` to `BlogPostPage.tsx`, `App.tsx`, `FloatingControl.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `app`, `__dirname`, `galleryDir` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AdminPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `BlogPostPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09506531204644413 - nodes in this community are weakly interconnected._