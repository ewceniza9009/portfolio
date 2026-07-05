import { Client } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

let lastBlogCheckedMtime = 0

export async function seedAll(db: Client) {
  await seedAbout(db)
  await seedExperience(db)
  await seedAwards(db)
  await seedProjects(db)
  await seedSkills(db)
  await seedBlog(db)
}

async function seedAbout(db: Client) {
  const res = await db.execute('SELECT COUNT(*) as count FROM about')
  const count = res.rows[0].count as number
  if (count > 0) return

  try {
    await db.execute({
      sql: `INSERT INTO about (id, title, paragraphs) VALUES (?, ?, ?)`,
      args: [
        1,
        'About Me',
        JSON.stringify([
          "I'm a Full Stack Software Developer with over a decade of experience building enterprise-grade applications, ERP systems, and cloud solutions. I specialize in the .NET ecosystem, React, and modern web technologies.",
          "Throughout my career, I've had the privilege of leading a dedicated team of developers and implementors to deliver impactful software solutions. Together, we've built everything from complex payroll and accounting engines to comprehensive inventory, order management, and logistics platforms for small to medium-sized businesses in my area.",
          "My philosophy is simple: write clean, maintainable code that solves real business problems. When I'm not behind a screen, you'll likely find me shredding as the lead guitarist of my band, training in Filipino Martial Arts (where I hold a degree), or catching up on the latest NBA games."
        ])
      ]
    })
  } catch (err) {
    console.error('Error seeding about:', err)
  }
}

async function seedExperience(db: Client) {
  const res = await db.execute('SELECT COUNT(*) as count FROM experience')
  const count = res.rows[0].count as number
  if (count > 0) return

  const experience = [
    {
      year: "Nov 2025 - Present",
      company: "Eclaro Business Solution",
      location: "Remote (Manila HQ / New York, US Client)",
      position: "Software Developer",
      descriptions: [
        "Developed provider reassignment scheduling features, integrating Microsoft Graph API for Azure scheduling and Outlook email synchronization.",
        "Implemented a document vault utilizing Azure Cloud Storage Blobs, utilizing Azurite for local development.",
        "Created a dynamic scripting algorithm to generate patient outreach scripts based on state, zip code, and street address.",
        "Built modules for patient visit assessments and vital signs, including data visualization graphs.",
        "Incorporated OData to support efficient search functionality across large datasets.",
        "Ensured code quality through unit testing with xUnit and bUnit, API testing with Postman, and managed database state via EF Core migrations and seeding.",
        "Participated in creating pull requests and agile scrum meetings to solidify the feature function and development I am involved with."
      ],
      technologies: ["Blazor", "Azure Graph API", "Azure Blob Storage", "OData", "EF Core", "xUnit", "bUnit", "PostgreSQL", "C#", ".NET"]
    },
    {
      year: "Sep 2018 - May 2025",
      company: "AccountMate Corporation",
      location: "Petaluma, San Francisco CA (Remote)",
      position: "Software Developer",
      descriptions: [
        "Contributed to the Development of their flagship ERP platform using WPF, XAML, and MVVM. Developed modular systems via Mediator/MEF and run through all development life cycles using Azure DevOps CI/CD pipelines.",
        "**WIP Module Optimization:** Engineered a high-performance manufacturing module using Telerik UI; optimized data operations with LINQ to Entities to accelerate reporting and tracking accuracy.",
        "**Reporting & BI:** Designed SSRS-based reports and deployed an automated back-end distribution service, streamlining operational insights for stakeholders.",
        "**Advanced Feature Engineering:** Developed an Advance Billing module for revenue optimization, integrated Aatrix for 1099 tax compliance, and built a real-time Zip Code API for address validation.",
        "**DevOps:** Standardized Azure DevOps workflows, utilizing Git and automated CI/CD pipelines to ensure frequent, reliable, and high-quality deployments."
      ],
      technologies: ["WPF", "XAML", "MVVM", "Mediator", "MEF", "C#", ".NET", "SQL Server", "SSRS", "Azure DevOps", "Telerik UI"]
    },
    {
      year: "Nov 2016 - Sep 2018",
      company: "TechnoLogic Solutions",
      location: "Cebu City, Cebu",
      position: "Lead System Developer",
      descriptions: [
        "Led the technical direction and full-lifecycle development of commercial software products.",
        "Managed development of Cloud FMIS (Financial), Cloud HRIS (Payroll), Loan Management, POS, and Warehouse Management suites.",
        "Defined product roadmaps, evaluated feature designs, and made core architecture decisions.",
        "Wrote clean code alongside the team, managed version control, and maintained code repositories using GitHub."
      ],
      technologies: ["ASP.NET MVC", "C#", "SQL Server", "GitHub", "Cloud Architecture", "Web API"]
    },
    {
      year: "April 2011 - March 2015",
      company: "Innosoft Solutions Inc.",
      location: "Cebu City, Cebu",
      position: "Software Developer / RND",
      descriptions: [
        "Transitioned from support to the R&D team to specialize in new mobile and cloud projects.",
        "Helped transition legacy desktop applications to multi-layered cloud services, including POS, financial, and HR systems.",
        "Built and deployed R&D projects from initial concepts through to production release using mobile and cloud frameworks.",
        "Shortened product delivery times by designing and introducing faster development and release pipelines."
      ],
      technologies: ["C#", ".NET", "Mobile Development", "Cloud Solutions", "SQL Server"]
    }
  ]

  try {
    let displayOrder = 0
    for (const exp of experience) {
      await db.execute({
        sql: `INSERT INTO experience (year, company, location, position, descriptions, technologies, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          exp.year, exp.company, exp.location, exp.position,
          JSON.stringify(exp.descriptions),
          JSON.stringify(exp.technologies),
          displayOrder++
        ]
      })
    }
  } catch (err) {
    console.error('Error seeding experience:', err)
  }
}

async function seedAwards(db: Client) {
  const res = await db.execute('SELECT COUNT(*) as count FROM awards')
  const count = res.rows[0].count as number
  if (count > 0) return

  const awards = [
    {
      title: 'Award of Excellence',
      date: 'DEC 2024',
      company: 'AccountMate Corporation',
      description: `Earned for playing a key role in developing and stabilizing the company's core platform. This award highlighted my focus on delivering reliable, high-performance code and stepping up to solve critical technical challenges when the team needed it most.`,
      image: '/img/awardofexcellence.png'
    },
    {
      title: 'Service Award',
      date: 'DEC 2023',
      company: 'AccountMate Corporation',
      description: 'Awarded in recognition of five years of continuous dedication and technical contribution to the company. Over half a decade, I helped evolve our systems from early iterations into mature, scalable products while mentoring newer developers along the way.',
      image: '/img/serviceaward.png'
    }
  ]

  try {
    let displayOrder = 0
    for (const awd of awards) {
      await db.execute({
        sql: `INSERT INTO awards (title, date, company, description, image, display_order)
               VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          awd.title, awd.date, awd.company, awd.description, awd.image, displayOrder++
        ]
      })
    }
  } catch (err) {
    console.error('Error seeding awards:', err)
  }
}

async function seedProjects(db: Client) {
  const res = await db.execute('SELECT COUNT(*) as count FROM projects')
  const count = res.rows[0].count as number
  if (count > 0) return

  const projects = [
    { title: "Cloud HRIS", subtitle: "Human Resources Information System", description: "A full-featured, cloud-based platform that unifies recruitment, attendance, payroll processing, and employee management into a single streamlined system, enhanced by AI-driven biometric security and self-service capabilities.", details: ["**Smart Payroll & Attendance Engine** : Processes 10,000+ attendance records semi-monthly with automatic computation of work hours, tardiness, undertime, overtime, night differentials, statutory contributions, and custom deductions.","**Biometric Facial Recognition** : Replaces traditional timekeeping hardware with AI-powered touchless identification, preventing time fraud while feeding real-time attendance data directly into the payroll pipeline.","**Self-Service Employee Portal** : A cross-platform mobile app that gives employees direct access to payslips, leave filing, overtime requests, and personal record updates - reducing HR's administrative overhead significantly.","**AI-Powered HR Intelligence Agent** : A multilingual conversational assistant that queries the database directly, generates charts, diagrams, and tabular reports on demand, surfaces AI-driven insights, forecasts trends from historical data, and deflects repetitive HR inquiries 24/7.","**Intelligent Leave Integration** : Approved leave requests are automatically reflected in payroll calculations, eliminating manual reconciliation between HR and accounting."], tech: ["ASP.NET Core","MAUI.NET","SQL Server","OpenCV","FaceNet"], year: "2020", type: "Commercialized", color: "#00ff88", repo: "https://github.com/ewceniza9009/litestaff", demo: "https://demo-hr.liteclerk.com/LandingPage", video: "https://ewceniza23.bsite.net/videos/HRISVideo.mp4", image: "/img/HRIS.png", fallback: "/img/1-thumbnail.jpg", testimonial_quote: "One of the standout features is the payroll system. It takes care of computations, tax deductions, and payslip generation with impressive accuracy. This has made our payroll process much smoother, saving us a lot of time and helping us avoid the usual errors that come with manual work.", testimonial_author: "Mary Charmane", testimonial_role: "Accounting Head, Cebu Cube Ice Inc." },
    { title: "Cloud FMIS", subtitle: "Financial Management Information System", description: "A centralized financial backbone for trading and manufacturing operations that consolidates accounting, inventory, and procurement into one authoritative system, giving leadership a real-time, holistic view of the company's financial position.", details: ["**Full-Cycle Accounting** : Handles 5,000+ monthly journal entries across General Ledger, Accounts Payable with aging, and Accounts Receivable with aging, with full audit-trail integrity.","**Inventory & Costing Engine** : Tracks 10,000+ SKUs with real-time stock valuation integrated into financial ledgers for Ph1.5M-Ph3M in monthly inventory transactions.","**On-Demand Financial Statements** : Generates Balance Sheets, Income Statements, Cash Flow Statements, and Trial Balances on demand via a custom .NET rendering pipeline.","**End-to-End Commercial Workflows** : Processes 500+ purchase orders, invoices, disbursements, and collections monthly through the full order-to-cash and procure-to-pay pipelines.","**Production & Recipe Management** : Handles finished goods, assembly items with components, and ingredient-level inventory with stock ledger and production BOMs.","**Bank Reconciliation** : Automated reconciliation of bank transactions with GL and float tracking for cash management."], tech: ["ASP.NET MVC","SQL Server","Telerik Reports"], year: "2019", type: "Commercialized", color: "#00ff88", repo: null, demo: "http://streetsmart-001-site2.gtempurl.com/", video: "https://ewceniza23.bsite.net/videos/FMISVideo.mp4", image: "/img/FMIS.png", fallback: "/img/5-thumbnail.jpg", testimonial_quote: "The real-time financial dashboards give us instant visibility into our cash flow and inventory positions. What used to take our team days to compile now updates automatically.", testimonial_author: "Michael Mancio", testimonial_role: "Finance Manager, Maville Recycling" },
    { title: "Halkyone Clinical OS", subtitle: "Electronic Medical Record (EMR)", description: "A multi-tenant clinical platform structured around three specialized portals, a clinical workflow engine, an administrative console, and a native mobile companion, built on .NET 9 with Clean Architecture and CQRS.", details: ["**Three-Portal Architecture** : Separates clinical workflows (Next.js), system administration, and field operations (Ionic/Capacitor mobile app) into purpose-built interfaces.","**Efficient GraphQL Data Layer** : HotChocolate with DataLoader resolvers eliminates N+1 query problems.","**Guaranteed Data Consistency** : A transactional outbox pattern ensures atomic synchronization between PostgreSQL and Elasticsearch.","**Geospatial Clinician Routing** : Applies the Haversine formula to optimize field clinician assignments based on proximity.","**Dynamic Clinical Assessments** : Runtime-generated forms for standardized instruments with documentation accelerators and automated report generation via QuestPDF."], tech: [".NET 9","HotChocolate GraphQL","Next.js 14","PostgreSQL"], year: "2026", type: "Emerging", color: "#00ffcc", repo: "https://github.com/ewceniza9009/emr", demo: "https://emr-three-hazel.vercel.app", video: "https://www.youtube.com/watch?v=bzJQIrhxXFo&start=934", image: "/img/halkyone.png", fallback: "/img/2-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "Smash Elite", subtitle: "Badminton Facility & Community Platform", description: "A full-stack facility management and community platform connecting administrators, coaches, customers, and delivery staff.", details: ["**Comprehensive Court Management** : Handles bookings across various modalities with dynamic peak-time pricing.","**Live Tournament Engine** : Automates single-elimination brackets with BYE resolution and live match scoring via Socket.IO.","**Custom Jersey CMS & E-Commerce** : A complete pipeline for custom jersey inquiries alongside an online shop.","**Delivery & Operations** : A mobile-responsive dashboard for delivery staff with order assignments and security PIN verification.","**Coaching & Meetups** : Streamlines training sessions and open play meetups with capacity limits and registration workflows.","**Real-Time Architecture** : Employs Socket.IO namespaced connections for live updates across tournament scores and order tracking."], tech: ["React 18","Node.js","Express","SQLite/Turso","Socket.IO"], year: "2026", type: "Full-Stack SaaS", color: "#00ffcc", repo: "https://huggingface.co/spaces/ewceniza/smashelite/tree/main", demo: "https://ewceniza-smashelite.hf.space/", video: "https://www.youtube.com/watch?v=BGYXhj808-A", image: "/img/smashelite.png", fallback: "/img/1-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "CloudPallet", subtitle: "3PL Cold Storage WMS (SaaS)", description: "Purpose-built for third-party logistics operators managing cold storage facilities.", details: ["**Usage-Based 3PL Billing** : An event-driven billing engine that programmatically calculates client charges.","**Barcode-Enforced Operations** : Automates receiving workflows with integrated scale capture and SSCC pallet barcodes.","**Scalable Domain Architecture** : Employs Domain-Driven Design, CQRS, and Clean Architecture with MediatR.","**Granular Access Management** : Multi-tier role-based access (Admin, Operator, Finance).","**Real-Time Operational Dashboards** : SignalR-driven live views of dock scheduling and cold room temperatures.","**Automated Document Generation** : QuestPDF integration produces professional invoices and warehouse receipts."], tech: ["ASP.NET Core 9","EF Core 9","Angular 20","SignalR","Docker"], year: "2025", type: "Deployed", color: "#00ff88", repo: "https://github.com/ewceniza9009/cloudpallet", demo: "https://ewceniza9009.github.io/cloudpallet", video: null, image: "/img/cloudpallet.png", fallback: "/img/3-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "NexPoint CRM", subtitle: "Customer Relationship Management", description: "An enterprise-caliber CRM platform engineered for high-growth teams.", details: ["**Unified Customer Profiles** : Aggregates every interaction, transaction, and communication into a single 360-degree view.","**Visual Sales Pipeline** : Offers intuitive drag-and-drop deal management with built-in lead scoring.","**Campaign & Ticketing Center** : Combines marketing automation with a priority-driven support ticket system.","**Live Business Intelligence** : Real-time dashboards powered by SignalR deliver instant visibility into KPIs."], tech: ["ASP.NET Core 10","EF Core","PostgreSQL","Angular 20","SignalR"], year: "2025", type: "Deployed", color: "#00ffcc", repo: "https://github.com/ewceniza9009/NexPoint", demo: "https://nex-point.vercel.app/", video: null, image: "/img/nexpoint.png", fallback: "/img/2-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "drobble", subtitle: "Ecommerce (SaaS)", description: "A cloud-native e-commerce engine decomposed into independent microservices.", details: ["**Service-Oriented Backend** : Independently deployable services coordinated through Ocelot API gateway and RabbitMQ.","**Modern Storefront SPA** : A React 19+ progressive web app built with Vite and TypeScript.","**Principled Architecture** : Every service adheres to Clean Architecture and CQRS conventions with MediatR.","**Enterprise-Grade Observability** : OpenTelemetry tracing plus Serilog structured logging.","**Defense-in-Depth Security** : JWT-based authentication, rate limiting, FluentValidation, OWASP-aligned practices.","**Polyglot Persistence** : PostgreSQL, MongoDB, Elasticsearch, and Redis."], tech: ["ASP.NET Core","React","MongoDB","PostgreSQL","Docker"], year: "2024", type: "Microservices", color: "#00ffcc", repo: "https://github.com/ewceniza9009/drobble", demo: null, video: null, image: "/img/drobble.png", fallback: "/img/4-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "Cloud Loan", subtitle: "Loan Management System", description: "A complete loan lifecycle platform that digitizes everything from application intake through disbursement and settlement.", details: ["**Digital Loan Origination** : Streamlines applications with electronic forms and automated credit scoring.","**Centralized Portfolio Oversight** : A command-center dashboard for monitoring active loans and delinquency trends.","**Automated Loan Servicing** : Handles recurring billing cycles, payment allocation, and penalty computation.","**Risk & Performance Analytics** : Produces actionable reports on portfolio composition and collection effectiveness."], tech: ["Blazor.NET","SQL Server","Syncfusion","DevExpress"], year: "2022", type: "Commercialized", color: "#00ffcc", repo: null, demo: "http://streetsmart-001-site5.gtempurl.com/", video: "https://ewceniza23.bsite.net/videos/LMISVideo.mp4", image: "/img/LMIS.png", fallback: "/img/6-thumbnail.jpg", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "GenMatrix", subtitle: "Binary MLM Platform", description: "A full-stack binary multi-level marketing platform that manages distributor networks.", details: ["**Binary Genealogy Tree** : Interactive D3-powered tree visualization with zoom/pan and three view modes.","**Commission Engine** : Configurable compensation plan supporting referral bonuses and binary pairing.","**Wallet & Financial System** : Real-time e-wallet with full transaction ledger and peer-to-peer transfers.","**Security & Compliance** : Two-factor authentication, KYC with admin review workflow, JWT-based RBAC."], tech: ["React","TypeScript","Redux Toolkit","Node.js","Express","MongoDB","Tailwind CSS","Vite","Docker"], year: "2026", type: "Emerging", color: "#8b5cf6", repo: "https://github.com/ewceniza9009/GenMatrix", demo: null, video: "https://github.com/user-attachments/assets/381e6f26-e5a0-4947-80d7-8414c1b4df6e", image: "/img/mlm.png", fallback: "/img/mlm.png", testimonial_quote: null, testimonial_author: null, testimonial_role: null },
    { title: "POS System", subtitle: "Point of Sale (Desktop & Mobile)", description: "A resilient, multi-platform point-of-sale solution built for retail and food-service environments.", details: ["**Instant Multi-Terminal Sync** : Handles 50+ concurrent terminals syncing 1,000+ daily transactions in real time.","**Built-In Stock Management** : Tracks 2,000+ SKUs with low-stock alerts triggering automatic purchase orders.","**Single-Codebase Multi-Platform** : Flutter enables native execution on iOS, Android, Windows, and web.","**Offline-First Resilience** : Local SQLite storage ensures 100% transaction continuity during outages."], tech: ["Flutter","ASP.NET Core","SQLite","SignalR"], year: "2023", type: "Commercialized", color: "#00ff88", repo: "https://github.com/ewceniza9009/pos24", demo: null, video: "https://ewceniza23.bsite.net/videos/POSMVideo.mp4", image: "/img/POSM.png", fallback: "/img/1-thumbnail.jpg", testimonial_quote: "We run a busy restaurant and reliability matters. When our internet goes down, the system keeps taking orders seamlessly.", testimonial_author: "Carlos Reyes", testimonial_role: "Owner, Cebu Tasty Lechon" }
  ]

  try {
    let displayOrder = 0
    for (const p of projects) {
      await db.execute({
        sql: `INSERT INTO projects (title, subtitle, description, details, tech, year, type, color, repo, demo, video, image, fallback, testimonial_quote, testimonial_author, testimonial_role, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.title, p.subtitle, p.description, JSON.stringify(p.details), JSON.stringify(p.tech),
          p.year, p.type, p.color,
          p.repo || null, p.demo || null, p.video || null, p.image, p.fallback,
          p.testimonial_quote || null, p.testimonial_author || null, p.testimonial_role || null, displayOrder++
        ]
      })
    }
  } catch (err) {
    console.error('Error seeding projects:', err)
  }
}

async function seedSkills(db: Client) {
  const res = await db.execute('SELECT COUNT(*) as count FROM skill_categories')
  const count = res.rows[0].count as number
  if (count > 0) return

  const categories = [
    { id: 'backend', label: 'Backend', image: '/img/2-thumbnail.jpg' },
    { id: 'frontend', label: 'Frontend', image: '/img/1-thumbnail.jpg' },
    { id: 'database', label: 'Database', image: '/img/3-thumbnail.jpg' },
    { id: 'tools', label: 'Tools & DevOps', image: '/img/4-thumbnail.jpg' },
    { id: 'practices', label: 'Practices', image: '/img/5-thumbnail.jpg' }
  ]

  const skillsByCategory: Record<string, { name: string; level: string }[]> = {
    backend: [
      { name: 'C#', level: 'core' }, { name: 'VBA', level: 'familiar' },
      { name: 'ASP.NET Core', level: 'core' }, { name: 'ASP.NET Core MVC', level: 'core' },
      { name: '.NET 8/9+', level: 'core' }, { name: 'Node.js', level: 'core' },
      { name: 'Express', level: 'core' }, { name: 'Entity Framework', level: 'core' },
      { name: 'LINQ', level: 'core' }, { name: 'Dapper', level: 'core' },
      { name: 'GraphQL', level: 'core' }, { name: 'Apollo Federation', level: 'familiar' },
      { name: 'Hot Chocolate', level: 'familiar' }, { name: 'SignalR', level: 'familiar' },
      { name: 'Microsoft Graph API', level: 'familiar' }, { name: 'Python', level: 'familiar' },
      { name: 'TensorFlow', level: 'familiar' }, { name: 'OpenCV', level: 'familiar' },
      { name: 'Gemini AI', level: 'familiar' }
    ],
    frontend: [
      { name: 'React', level: 'core' }, { name: 'Angular', level: 'core' },
      { name: 'TypeScript', level: 'core' }, { name: 'Blazor', level: 'familiar' },
      { name: 'WPF', level: 'familiar' }, { name: '.NET MAUI', level: 'familiar' },
      { name: 'Windows Forms', level: 'familiar' }, { name: 'HTML5', level: 'core' },
      { name: 'CSS3', level: 'core' }, { name: 'jQuery', level: 'familiar' },
      { name: 'Bootstrap', level: 'familiar' }, { name: 'Tailwind CSS', level: 'core' },
      { name: 'Flutter', level: 'familiar' }, { name: 'Ionic', level: 'familiar' },
      { name: 'Xamarin Forms', level: 'familiar' }
    ],
    database: [
      { name: 'MS SQL Server', level: 'core' }, { name: 'MS Access', level: 'familiar' },
      { name: 'PostgreSQL', level: 'core' }, { name: 'MongoDB', level: 'familiar' },
      { name: 'MySQL', level: 'core' }, { name: 'SQLite', level: 'core' },
      { name: 'Elasticsearch', level: 'familiar' }, { name: 'Redis', level: 'familiar' }
    ],
    tools: [
      { name: 'GitHub', level: 'core' }, { name: 'GitHub Actions', level: 'core' },
      { name: 'Git', level: 'core' }, { name: 'Azure DevOps', level: 'core' },
      { name: 'Azure CI/CD', level: 'core' }, { name: 'Azure', level: 'core' },
      { name: 'Docker', level: 'core' }, { name: 'Telerik', level: 'familiar' },
      { name: 'DevExpress', level: 'familiar' }, { name: 'Syncfusion', level: 'familiar' }
    ],
    practices: [
      { name: 'Clean Architecture', level: 'core' }, { name: 'CQRS', level: 'core' },
      { name: 'Domain-Driven Design', level: 'core' }, { name: 'SOLID', level: 'core' },
      { name: 'OOP', level: 'core' }, { name: 'MVVM', level: 'core' },
      { name: 'Microservices', level: 'core' }, { name: 'Multithreading', level: 'familiar' },
      { name: 'Async & Concurrency', level: 'familiar' }
    ]
  }

  try {
    let categoryOrder = 0
    let skillOrder = 0
    for (const cat of categories) {
      await db.execute({
        sql: 'INSERT INTO skill_categories (id, label, image, display_order) VALUES (?, ?, ?, ?)',
        args: [cat.id, cat.label, cat.image, categoryOrder++]
      })
      for (const skill of skillsByCategory[cat.id]) {
        await db.execute({
          sql: 'INSERT INTO skills (category_id, name, icon, level, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [cat.id, skill.name, skill.name, skill.level, skillOrder++]
        })
      }
    }
  } catch (err) {
    console.error('Error seeding skills:', err)
  }
}

async function seedBlog(db: Client) {
  const markdownPath = path.join(process.cwd(), 'api', 'engineering-realtime-telemetry-signalr.md')
  let currentMtime: number
  try {
    currentMtime = fs.statSync(markdownPath).mtime.getTime()
  } catch {
    return
  }
  if (currentMtime <= lastBlogCheckedMtime && lastBlogCheckedMtime !== 0) return
  lastBlogCheckedMtime = currentMtime

  const slug = 'engineering-realtime-telemetry-signalr'
  const blogId = '550e8400-e29b-41d4-a716-446655440000'
  const title = 'Engineering Real-Time Telemetry and Secure Clinical Messaging with SignalR'
  const summary = 'A technical deep-dive into the real-time websocket pipelines of Halkyone Clinical OS (EMR), covering SignalR telemetry loops, geospatial privacy masking, and HIPAA-compliant secure messaging.'
  const tags = 'SignalR, WebSockets, Real-Time, IoT, HealthTech, .NET, React'
  const readTime = '8 min read'

  try {
    const content = fs.readFileSync(markdownPath, 'utf8')
    const check = await db.execute({
      sql: 'SELECT id, likes, updated_at FROM blogs WHERE slug = ?',
      args: [slug]
    })

    if (check.rows.length > 0) {
      const row = check.rows[0]
      const dbLikes = Number(row.likes || 0)
      const targetLikes = dbLikes === 12 ? 0 : dbLikes
      const dbUpdatedStr = String(row.updated_at || '1970-01-01 00:00:00')
      const dbMtime = new Date(dbUpdatedStr.replace(' ', 'T') + 'Z').getTime()

      if (currentMtime > dbMtime + 2000) {
        await db.execute({
          sql: `UPDATE blogs SET title = ?, content = ?, summary = ?, tags = ?, category = ?, read_time = ?, likes = ?, updated_at = datetime('now') WHERE slug = ?`,
          args: [title, content, summary, tags, 'Engineering', readTime, targetLikes, slug]
        })
        console.log('Synced EMR blog post from disk (file was updated).')
      }
      return
    }

    await db.execute({
      sql: `INSERT INTO blogs (id, slug, title, content, summary, tags, category, published, likes, read_time, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, datetime('now'))`,
      args: [blogId, slug, title, content, summary, tags, 'Engineering', readTime]
    })
    console.log('Successfully seeded EMR blog post from disk!')
  } catch (err) {
    console.error('Failed to seed blog post:', err)
  }
}
