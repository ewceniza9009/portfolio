# Graph Report - portfolio  (2026-07-05)

## Corpus Check
- 57 files · ~72,513 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 359 nodes · 486 edges · 27 communities (21 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aded698e`
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
- [[_COMMUNITY_generate-sitemap.mjs|generate-sitemap.mjs]]
- [[_COMMUNITY_vercel.json|vercel.json]]
- [[_COMMUNITY_convert-webp.mjs|convert-webp.mjs]]
- [[_COMMUNITY_vanta.d.ts|vanta.d.ts]]
- [[_COMMUNITY_OG_DEFAULT_IMAGE|OG_DEFAULT_IMAGE]]
- [[_COMMUNITY_OG_SITE_NAME|OG_SITE_NAME]]
- [[_COMMUNITY_OG_SITE_URL|OG_SITE_URL]]
- [[_COMMUNITY_DEFAULT_PROFILE_PIC|DEFAULT_PROFILE_PIC]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AccentKey` - 15 edges
3. `scripts` - 8 edges
4. `useProfilePic()` - 8 edges
5. `ACCENT_THEMES` - 7 edges
6. `parseMarkdown()` - 6 edges
7. `AdminPanel()` - 5 edges
8. `seedFirstBlog()` - 4 edges
9. `initDb()` - 4 edges
10. `BackToTop()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `PortfolioProps` --references--> `AccentKey`  [EXTRACTED]
  src/App.tsx → src/data/accents.ts
- `AdminPanel()` --calls--> `useProfilePic()`  [EXTRACTED]
  src/components/AdminPanel.tsx → src/utils/profilePic.ts
- `BlogPostPageProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/BlogPostPage.tsx → src/data/accents.ts
- `BlogsPageProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/BlogsPage.tsx → src/data/accents.ts
- `GitHubSectionProps` --references--> `AccentKey`  [EXTRACTED]
  src/components/GitHubSection.tsx → src/data/accents.ts

## Import Cycles
- None detected.

## Communities (27 total, 6 thin omitted)

### Community 0 - "AdminPanel.tsx"
Cohesion: 0.07
Nodes (28): AdminPanel(), AdminPanelProps, AI_PRESETS, Blog, Comment, formatDate(), getSafeItem(), Message (+20 more)

### Community 1 - "BlogPostPage.tsx"
Cohesion: 0.09
Nodes (21): BackToTop(), Blog, BlogPostPage(), Comment, formatDate(), getGradient(), Blog, BlogsPage() (+13 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, autoprefixer, postcss, sharp, tailwindcss, @types/cors, @types/express, @types/jsonwebtoken (+20 more)

### Community 3 - "index.ts"
Cohesion: 0.11
Nodes (16): authMiddleware(), AuthRequest, flexibleAuth(), loginAttempts, loginHandler(), rateLimitMiddleware(), seedFirstBlog(), initDb() (+8 more)

### Community 4 - "Navbar.tsx"
Cohesion: 0.11
Nodes (21): PortfolioProps, BlogPostPageProps, BlogsPageProps, GitHubSectionProps, Logo(), LogoProps, ACCENT_DROPDOWN_STYLE, AccentDropdown() (+13 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (11): AwardsSectionProps, Experience, ExperienceSectionProps, ResumeModalProps, texts, Award, awards, experience (+3 more)

### Community 6 - "FloatingControl.tsx"
Cohesion: 0.07
Nodes (15): ContactSectionProps, CopyableContactProps, SocialLinkProps, ADVENTURE_STORY, AdventureChoice, AdventureNode, ChatMessage, HistoryLine (+7 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, chart.js, clsx, cors, express, framer-motion, @google/generative-ai, jsonwebtoken (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 9 - "MarkdownEditor.tsx"
Cohesion: 0.20
Nodes (11): getTheme(), MarkdownEditor(), MarkdownEditorProps, registerCompletionProvider(), buildSnippet(), CHART_SNIPPET, getGenericSnippet(), INTERACTIVE3D_SNIPPET (+3 more)

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
Cohesion: 0.31
Nodes (8): CHART_TYPE_MAP, ChartBlock(), ChartBlockProps, COLORS, getIsDark(), parseArray(), parseChartCode(), ParsedChart

### Community 14 - "GallerySection.tsx"
Cohesion: 0.25
Nodes (5): GalleryImage, GalleryTile, PROJECT_ORDER, PROJECTS, GALLERY_DESCRIPTIONS

### Community 16 - "generate-sitemap.mjs"
Cohesion: 0.50
Nodes (3): buildSitemap(), main(), staticUrls

### Community 17 - "vercel.json"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/index.ts, rewrites

## Knowledge Gaps
- **155 isolated node(s):** `AuthRequest`, `loginAttempts`, `app`, `INDEXNOW_ENDPOINTS`, `visitRateLimit` (+150 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccentKey` connect `Navbar.tsx` to `AdminPanel.tsx`, `BlogPostPage.tsx`, `App.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `AuthRequest`, `loginAttempts`, `app` to the rest of the system?**
  _155 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AdminPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06659619450317125 - nodes in this community are weakly interconnected._
- **Should `BlogPostPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08907563025210084 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._