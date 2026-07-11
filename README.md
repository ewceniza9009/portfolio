# Erwin Wilson Ceniza - Portfolio

Personal portfolio website for **Erwin Wilson Ceniza**, a Full Stack Software Developer specializing in .NET, React, Angular, and Node.js with 10+ years building enterprise ERP, LOB, and AI applications.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, Three.js (Vanta), Monaco Editor, Mermaid, Chart.js/Recharts, Shiki, Lucide Icons

**Backend:** Express.js (Vercel Serverless Functions), Turso (libSQL), JWT auth, Nodemailer (Gmail SMTP), Multer (image uploads)

**AI:** Google Gemini API, Puter.js (browser-side AI)

## Features

- **Sections:** Hero, About, Experience (timeline), Awards, Projects (modal with details), Skills (categorized), Gallery (searchable screenshots), GitHub activity, Contact form
- **Blog Engine:** Full CRUD admin, Markdown editor with live preview, categories, comments, likes, Dev.to cross-posting, AI summarization, TOC, related posts, search
- **Admin Panel:** Password/JWT-protected dashboard with tabs for Messages, Blogs, Analytics, Audit Logs, Settings, Projects, Skills, About, Experience, Awards; AI-powered reply composer, visitor analytics with charts, data export & cleanup, n8n workflow config
- **Floating Control:** Multi-mode overlay with AI Chat (portfolio-aware), Terminal (Unix-style commands + cyberpunk adventure game), Code Galaxy (interactive 3D codebase graph)
- **Search Palette:** `Ctrl+K` / `/` — searches projects, blogs, and skills via API
- **Analytics:** Visitor tracking with geolocation (IP-based), page visits, daily/hourly trends, device/browser breakdown, top pages, CSV export
- **Theme System:** Dark/light with automatic rotation; 7 accent colors (gold, green, indigo, teal, blue, orange, violet) — also rotatable
- **Custom Cursor:** Theme-aware hardware-accelerated SVG cursor with toggle
- **SEO:** JSON-LD structured data (Person + WebSite), sitemap.xml, RSS feed, Open Graph / Twitter cards, canonical URLs, preloaded fonts
- **Interactive Blog Blocks:** Mermaid diagrams, 3D interactive embeds, step-through tutorials, charts, code morphing/diff/highlight animations
- **Code Galaxy:** 3D force-directed graph of the codebase with community coloring, search, filtering, side panel with file details
- **Keyboard Shortcuts:** `g+h` (home), `g+b` (blog), `g+t` (theme toggle), `/` (search), `?` (cheatsheet)

## Commands

```bash
npm run dev          # Start Vite dev server
npm run vercel       # Start Vercel dev server (with API)
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
npm run sitemap      # Generate sitemap.xml
```

Prebuild/predev hooks automatically run sitemap generation, Code Galaxy data extraction, and graph data copy.

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable             | Description                    |
| -------------------- | ------------------------------ |
| `TURSO_DATABASE_URL` | Turso/libSQL database URL      |
| `TURSO_AUTH_TOKEN`   | Turso auth token               |
| `GMAIL_USER`         | Gmail address for contact form |
| `GMAIL_APP_PASSWORD` | Gmail App Password             |
| `ADMIN_PASSWORD`     | Admin panel password           |
| `JWT_SECRET`         | JWT signing secret             |
| `GEMINI_API_KEY`     | Google Gemini API key          |

## Deployment

Deployed on **Vercel** with the API as a serverless function. The `vercel.json` rewrites route `/api/*` to the serverless entry point and all other routes to `index.html` for SPA behavior.
