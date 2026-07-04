# Graph Report - X:\portfolio\src  (2026-07-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 241 nodes · 358 edges · 19 communities (14 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20222f29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_BlogPostPage.tsx|BlogPostPage.tsx]]
- [[_COMMUNITY_Navbar.tsx|Navbar.tsx]]
- [[_COMMUNITY_AdminPanel.tsx|AdminPanel.tsx]]
- [[_COMMUNITY_MarkdownEditor.tsx|MarkdownEditor.tsx]]
- [[_COMMUNITY_FloatingControl.tsx|FloatingControl.tsx]]
- [[_COMMUNITY_ProjectsSection.tsx|ProjectsSection.tsx]]
- [[_COMMUNITY_puter.d.ts|puter.d.ts]]
- [[_COMMUNITY_SkillsSection.tsx|SkillsSection.tsx]]
- [[_COMMUNITY_ChartBlock.tsx|ChartBlock.tsx]]
- [[_COMMUNITY_GallerySection.tsx|GallerySection.tsx]]
- [[_COMMUNITY_profilePic.ts|profilePic.ts]]
- [[_COMMUNITY_InteractiveBlock.tsx|InteractiveBlock.tsx]]
- [[_COMMUNITY_vanta.d.ts|vanta.d.ts]]
- [[_COMMUNITY_OG_DEFAULT_IMAGE|OG_DEFAULT_IMAGE]]
- [[_COMMUNITY_OG_SITE_NAME|OG_SITE_NAME]]
- [[_COMMUNITY_OG_SITE_URL|OG_SITE_URL]]
- [[_COMMUNITY_DEFAULT_PROFILE_PIC|DEFAULT_PROFILE_PIC]]

## God Nodes (most connected - your core abstractions)
1. `AccentKey` - 15 edges
2. `useProfilePic()` - 8 edges
3. `ACCENT_THEMES` - 7 edges
4. `parseMarkdown()` - 6 edges
5. `AdminPanel()` - 5 edges
6. `BackToTop()` - 4 edges
7. `BlogPostPage()` - 4 edges
8. `BlogsPage()` - 4 edges
9. `CursorFollower()` - 4 edges
10. `HeadTags()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `PortfolioProps` --references--> `AccentKey`  [EXTRACTED]
  App.tsx → data/accents.ts
- `AdminPanel()` --calls--> `useProfilePic()`  [EXTRACTED]
  components/AdminPanel.tsx → utils/profilePic.ts
- `BlogPostPageProps` --references--> `AccentKey`  [EXTRACTED]
  components/BlogPostPage.tsx → data/accents.ts
- `BlogsPageProps` --references--> `AccentKey`  [EXTRACTED]
  components/BlogsPage.tsx → data/accents.ts
- `GitHubSectionProps` --references--> `AccentKey`  [EXTRACTED]
  components/GitHubSection.tsx → data/accents.ts

## Import Cycles
- None detected.

## Communities (19 total, 5 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (16): AwardsSectionProps, ContactSectionProps, CopyableContactProps, SocialLinkProps, Experience, ExperienceSectionProps, ResumeModalProps, texts (+8 more)

### Community 1 - "BlogPostPage.tsx"
Cohesion: 0.09
Nodes (21): BackToTop(), Blog, BlogPostPage(), Comment, formatDate(), getGradient(), Blog, BlogsPage() (+13 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.09
Nodes (22): PortfolioProps, BlogPostPageProps, BlogsPageProps, GitHubSectionProps, HeroSectionProps, ROLES, Logo(), LogoProps (+14 more)

### Community 3 - "AdminPanel.tsx"
Cohesion: 0.10
Nodes (18): AdminPanel(), AdminPanelProps, AI_PRESETS, Blog, Comment, formatDate(), getSafeItem(), Message (+10 more)

### Community 4 - "MarkdownEditor.tsx"
Cohesion: 0.20
Nodes (11): getTheme(), MarkdownEditor(), MarkdownEditorProps, registerCompletionProvider(), buildSnippet(), CHART_SNIPPET, getGenericSnippet(), INTERACTIVE3D_SNIPPET (+3 more)

### Community 5 - "FloatingControl.tsx"
Cohesion: 0.14
Nodes (6): ADVENTURE_STORY, AdventureChoice, AdventureNode, ChatMessage, HistoryLine, SUGGESTIONS

### Community 6 - "ProjectsSection.tsx"
Cohesion: 0.15
Nodes (8): Project, ProjectModalProps, filterTabs, Project, ProjectCard, ProjectsSectionProps, TechIcon(), techIcons

### Community 7 - "puter.d.ts"
Cohesion: 0.14
Nodes (5): PuterAIModule, PuterChatOptions, PuterChatResponse, PuterChatTextPart, Window

### Community 8 - "SkillsSection.tsx"
Cohesion: 0.18
Nodes (8): BACKGROUND_DECORATIONS, CATEGORY_HOVER_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, SkillItem, SkillsData, SkillsSectionProps, SkillTag

### Community 9 - "ChartBlock.tsx"
Cohesion: 0.31
Nodes (8): CHART_TYPE_MAP, ChartBlock(), ChartBlockProps, COLORS, getIsDark(), parseArray(), parseChartCode(), ParsedChart

### Community 10 - "GallerySection.tsx"
Cohesion: 0.25
Nodes (5): GalleryImage, GalleryTile, PROJECT_ORDER, PROJECTS, GALLERY_DESCRIPTIONS

### Community 11 - "profilePic.ts"
Cohesion: 0.36
Nodes (7): getAdminToken(), getApiUrl(), loadProfilePic(), ProfilePicState, resetProfilePic(), subscribers, uploadProfilePic()

### Community 12 - "InteractiveBlock.tsx"
Cohesion: 0.40
Nodes (3): InteractiveBlock(), InteractiveBlockProps, parsePreset()

## Knowledge Gaps
- **76 isolated node(s):** `Message`, `Blog`, `Comment`, `VISITOR_TABLE_COLUMNS`, `AI_PRESETS` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccentKey` connect `Navbar.tsx` to `App.tsx`, `BlogPostPage.tsx`, `AdminPanel.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `parseMarkdown()` connect `AdminPanel.tsx` to `BlogPostPage.tsx`, `FloatingControl.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useProfilePic()` connect `BlogPostPage.tsx` to `profilePic.ts`, `Navbar.tsx`, `AdminPanel.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `Message`, `Blog`, `Comment` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07207207207207207 - nodes in this community are weakly interconnected._
- **Should `BlogPostPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08907563025210084 - nodes in this community are weakly interconnected._
- **Should `Navbar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09195402298850575 - nodes in this community are weakly interconnected._