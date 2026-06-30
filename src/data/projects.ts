const projects = [
  {
    id: 1,
    title: "Cloud HRIS",
    subtitle: "Human Resources Information System",
    description: "A full-featured, cloud-based platform that unifies recruitment, attendance, payroll processing, and employee management into a single streamlined system, enhanced by AI-driven biometric security and self-service capabilities.",
    details: [
      "**Smart Payroll & Attendance Engine** : Processes 10,000+ attendance records semi-monthly with automatic computation of work hours, tardiness, undertime, overtime, night differentials, statutory contributions, and custom deductions.",
      "**Biometric Facial Recognition** : Replaces traditional timekeeping hardware with AI-powered touchless identification, preventing time fraud while feeding real-time attendance data directly into the payroll pipeline.",
      "**Self-Service Employee Portal** : A cross-platform mobile app that gives employees direct access to payslips, leave filing, overtime requests, and personal record updates - reducing HR's administrative overhead significantly.",
      "**AI-Powered HR Intelligence Agent** : A multilingual conversational assistant that queries the database directly, generates charts, diagrams, and tabular reports on demand, surfaces AI-driven insights, forecasts trends from historical data, and deflects repetitive HR inquiries 24/7.",
      "**Intelligent Leave Integration** : Approved leave requests are automatically reflected in payroll calculations, eliminating manual reconciliation between HR and accounting."
    ],
    tech: ["ASP.NET Core", "MAUI.NET", "SQL Server", "OpenCV", "FaceNet"],
    year: "2020",
    type: "Commercialized",
    color: "#00ff88",
    repo: "https://github.com/ewceniza9009/litestaff",
    demo: "https://demo-hr.liteclerk.com/LandingPage",
    video: "https://ewceniza23.bsite.net/videos/HRISVideo.mp4",
    image: "/img/HRIS.png",
    fallback: "/img/1-thumbnail.jpg",
    testimonial: {
      quote: "One of the standout features is the payroll system. It takes care of computations, tax deductions, and payslip generation with impressive accuracy. This has made our payroll process much smoother, saving us a lot of time and helping us avoid the usual errors that come with manual work.",
      author: "Mary Charmane",
      role: "Accounting Head, Cebu Cube Ice Inc."
    }
  },
  {
    id: 5,
    title: "Cloud FMIS",
    subtitle: "Financial Management Information System",
    description: "A centralized financial backbone for trading and manufacturing operations that consolidates accounting, inventory, and procurement into one authoritative system, giving leadership a real-time, holistic view of the company's financial position. Engineered to support multi-dimensional reporting by consignment area and production environment, with specialized capabilities for food and bakery manufacturing including finished goods, assembly items with components, and granular ingredient-level inventory tracking.",
    details: [
      "**Full-Cycle Accounting** : Handles 5,000+ monthly journal entries across General Ledger, Accounts Payable with aging, and Accounts Receivable with aging, with full audit-trail integrity, including entry adjustments.",
      "**Inventory & Costing Engine** : Tracks 10,000+ SKUs with real-time stock valuation integrated into financial ledgers for Ph1.5M-Ph3M in monthly inventory transactions.",
      "**On-Demand Financial Statements** : Generates Balance Sheets, Income Statements, Cash Flow Statements, and Trial Balances on demand via a custom .NET rendering pipeline. Supports multi-dimensional reporting by company, branch, consignment area, and consolidated views.",
      "**End-to-End Commercial Workflows** : Processes 500+ purchase orders, invoices, disbursements, and collections monthly through the full order-to-cash and procure-to-pay pipelines.",
      "**Production & Recipe Management** : Handles finished goods, assembly items with components, and ingredient-level inventory with stock ledger and production BOMs, purpose-built for food production, bakery, and process manufacturing.",
      "**Bank Reconciliation** : Automated reconciliation of bank transactions with GL and float tracking for cash management."
    ],
    tech: ["ASP.NET MVC", "SQL Server", "Telerik Reports"],
    year: "2019",
    type: "Commercialized",
    color: "#00ff88",
    repo: null,
    demo: "http://streetsmart-001-site2.gtempurl.com/",
    video: "https://ewceniza23.bsite.net/videos/FMISVideo.mp4",
    image: "/img/FMIS.png",
    fallback: "/img/5-thumbnail.jpg",
    testimonial: {
      quote: "The real-time financial dashboards give us instant visibility into our cash flow and inventory positions. What used to take our team days to compile now updates automatically. It's transformed how we make decisions.",
      author: "Michael Mancio",
      role: "Finance Manager, Maville Recycling"
    }
  },
  {
    id: 8,
    title: "Halkyone Clinical OS",
    subtitle: "Electronic Medical Record (EMR)",
    description: "A multi-tenant clinical platform structured around three specialized portals, a clinical workflow engine, an administrative console, and a native mobile companion, built on .NET 9 with Clean Architecture and CQRS for high-density healthcare data operations.",
    details: [
      "**Three-Portal Architecture** : Separates clinical workflows (Next.js), system administration, and field operations (Ionic/Capacitor mobile app) into purpose-built interfaces, each optimized for its user persona.",
      "**Efficient GraphQL Data Layer** : HotChocolate with DataLoader resolvers eliminates N+1 query problems, delivering fast responses even for deeply nested clinical data queries.",
      "**Guaranteed Data Consistency** : A transactional outbox pattern ensures atomic synchronization between the PostgreSQL source of truth and the Elasticsearch search index.",
      "**Geospatial Clinician Routing** : Applies the Haversine formula to optimize field clinician assignments based on proximity, with live location tracking that respects patient privacy boundaries.",
      "**Dynamic Clinical Assessments** : Runtime-generated forms for standardized instruments (ESAS-R, PHQ-9, PPS) with documentation accelerators and automated report generation via QuestPDF."
    ],
    tech: [".NET 9", "HotChocolate GraphQL", "Next.js 14", "PostgreSQL"],
    year: "2026",
    type: "Emerging",
    color: "#00ffcc",
    repo: "https://github.com/ewceniza9009/emr",
    demo: "https://emr-three-hazel.vercel.app",
    video: "https://www.youtube.com/watch?v=bzJQIrhxXFo&start=934",
    image: "/img/halkyone.png",
    fallback: "/img/2-thumbnail.jpg"
  },
  {
    id: 9,
    title: "Smash Elite",
    subtitle: "Badminton Facility & Community Platform",
    description: "A full-stack facility management and community platform connecting administrators, coaches, customers, and delivery staff. It features a robust system for court bookings, tournament brackets with live scoring, a custom jersey catalog, and an integrated online shop with real-time delivery tracking.",
    details: [
      "**Comprehensive Court Management** : Handles bookings across various modalities (coaching, rental, sparring, tournament) with dynamic peak-time pricing and coach assignments.",
      "**Live Tournament Engine** : Automates single-elimination brackets with BYE resolution, tracks live match scoring via Socket.IO, and maintains a tiered leaderboard.",
      "**Custom Jersey CMS & E-Commerce** : A complete pipeline for custom jersey inquiries alongside an online shop supporting GCash/COD, stock tracking, and multi-item cart checkout.",
      "**Delivery & Operations** : A mobile-responsive dashboard for delivery staff with order assignments, a complete status pipeline, and a security PIN verification system.",
      "**Coaching & Meetups** : Streamlines training sessions and open play meetups with capacity limits, registration workflows, and admin approval systems.",
      "**Real-Time Architecture** : Employs Socket.IO namespaced connections for live updates across tournament scores, order tracking, and cross-platform notifications."
    ],
    tech: ["React 18", "Node.js", "Express", "SQLite/Turso", "Socket.IO"],
    year: "2026",
    type: "Full-Stack SaaS",
    color: "#00ffcc",
    repo: "https://huggingface.co/spaces/ewceniza/smashelite/tree/main",
    demo: "https://ewceniza-smashelite.hf.space/",
    video: "https://www.youtube.com/watch?v=BGYXhj808-A",
    image: "/img/smashelite.png",
    fallback: "/img/1-thumbnail.jpg"
  },
  {
    id: 3,
    title: "CloudPallet",
    subtitle: "3PL Cold Storage WMS (SaaS)",
    description: "Purpose-built for third-party logistics operators managing cold storage facilities. Addresses temperature-sensitive inventory challenges with FEFO-based lot tracking, granular location hierarchies (down to individual shelf levels), and integrated environmental monitoring.",
    details: [
      "**Usage-Based 3PL Billing** : An event-driven billing engine that programmatically calculates client charges based on storage duration, temperature tier, handling events, and value-added services such as blast freezing, kitting, and fumigation.",
      "**Barcode-Enforced Operations** : Automates receiving workflows with integrated scale capture, generates SSCC pallet barcodes on the fly, and enforces barcode verification during picking and shipping to eliminate human error.",
      "**Scalable Domain Architecture** : Employs Domain-Driven Design, CQRS, and Clean Architecture with MediatR, enabling independent service evolution and horizontal scaling.",
      "**Granular Access Management** : Multi-tier role-based access (Admin, Operator, Finance) ensures operational separation and data security across warehouse tenants.",
      "**Real-Time Operational Dashboards** : SignalR-driven live views of dock scheduling, cold room temperatures, and inventory movement for immediate situational awareness.",
      "**Automated Document Generation** : QuestPDF integration produces professional invoices, warehouse receipts, and compliance reports on demand."
    ],
    tech: ["ASP.NET Core 9", "EF Core 9", "Angular 20", "SignalR", "Docker"],
    year: "2025",
    type: "Deployed",
    color: "#00ff88",
    repo: "https://github.com/ewceniza9009/cloudpallet",
    demo: "https://ewceniza9009.github.io/cloudpallet",
    video: null,
    image: "/img/cloudpallet.png",
    fallback: "/img/3-thumbnail.jpg"
  },
  {
    id: 2,
    title: "NexPoint CRM",
    subtitle: "Customer Relationship Management",
    description: "An enterprise-caliber CRM platform engineered for high-growth teams that need full visibility over their customer lifecycle, from initial lead capture through deal closure, campaign execution, and post-sale support.",
    details: [
      "**Unified Customer Profiles** : Aggregates every interaction, transaction, and communication into a single 360-degree customer view accessible across departments.",
      "**Visual Sales Pipeline** : Offers intuitive drag-and-drop deal management with built-in lead scoring and revenue forecasting to help sales teams prioritize effectively.",
      "**Campaign & Ticketing Center** : Combines marketing automation with a priority-driven support ticket system, bridging the gap between outreach and customer retention.",
      "**Live Business Intelligence** : Real-time dashboards powered by SignalR deliver instant visibility into KPIs, pipeline health, and team performance without page refreshes."
    ],
    tech: ["ASP.NET Core 10", "EF Core", "PostgreSQL", "Angular 20", "SignalR"],
    year: "2025",
    type: "Deployed",
    color: "#00ffcc",
    repo: "https://github.com/ewceniza9009/NexPoint",
    demo: "https://nex-point.vercel.app/",
    video: null,
    image: "/img/nexpoint.png",
    fallback: "/img/2-thumbnail.jpg"
  },
  {
    id: 4,
    title: "drobble",
    subtitle: "Ecommerce (SaaS)",
    description: "A cloud-native e-commerce engine decomposed into independent microservices, each owning its own data store and business logic. Designed as a production-ready blueprint for high-throughput online retail, with containerized deployment and full observability baked in.",
    details: [
      "**Service-Oriented Backend** : Independently deployable services for catalog, users, orders, payments, search, and reviews, coordinated through an Ocelot API gateway and RabbitMQ message bus.",
      "**Modern Storefront SPA** : A React 19+ progressive web app built with Vite and TypeScript, using Redux Toolkit and RTK Query for efficient state and cache management.",
      "**Principled Architecture** : Every service adheres to Clean Architecture and CQRS conventions with MediatR, ensuring testable, maintainable codebases that scale independently.",
      "**Enterprise-Grade Observability** : OpenTelemetry tracing plus Serilog structured logging provide deep visibility, while Polly handles transient fault tolerance with retries and circuit breakers.",
      "**Defense-in-Depth Security** : JWT-based authentication, request rate limiting, input validation via FluentValidation, and OWASP-aligned security practices protect every endpoint.",
      "**Polyglot Persistence** : PostgreSQL for transactional workloads, MongoDB for flexible document storage, Elasticsearch for full-text search, and Redis for high-speed caching and rate limiting."
    ],
    tech: ["ASP.NET Core", "React", "MongoDB", "PostgreSQL", "Docker"],
    year: "2024",
    type: "Microservices",
    color: "#00ffcc",
    repo: "https://github.com/ewceniza9009/drobble",
    demo: null,
    video: null,
    image: "/img/drobble.png",
    fallback: "/img/4-thumbnail.jpg"
  },
  {
    id: 6,
    title: "Cloud Loan",
    subtitle: "Loan Management System",
    description: "A complete loan lifecycle platform that digitizes everything from application intake and credit evaluation through disbursement, servicing, and final settlement, giving lending teams the tools to manage portfolios with precision and full transparency.",
    details: [
      "**Digital Loan Origination** : Streamlines applications with electronic forms, automated credit scoring workflows, and configurable approval chains that accelerate underwriting decisions.",
      "**Centralized Portfolio Oversight** : A command-center dashboard for monitoring active loans, upcoming maturities, payment schedules, and delinquency trends across the entire book.",
      "**Automated Loan Servicing** : Handles recurring billing cycles, payment allocation, penalty computation, and amortization schedule generation without manual intervention.",
      "**Risk & Performance Analytics** : Produces actionable reports on portfolio composition, exposure concentration, collection effectiveness, and aging analysis."
    ],
    tech: ["Blazor.NET", "SQL Server", "Syncfusion", "DevExpress"],
    year: "2022",
    type: "Commercialized",
    color: "#00ffcc",
    repo: null,
    demo: "http://streetsmart-001-site5.gtempurl.com/",
    video: "https://ewceniza23.bsite.net/videos/LMISVideo.mp4",
    image: "/img/LMIS.png",
    fallback: "/img/6-thumbnail.jpg"
  },
  {
    id: 10,
    title: "GenMatrix",
    subtitle: "Binary MLM Platform",
    description: "A full-stack binary multi-level marketing platform that manages distributor networks organized in a binary tree structure, handling everything from enrollment and genealogy visualization through commission calculation, wallet management, KYC verification, and an integrated product shop.",
    details: [
      "**Binary Genealogy Tree** : Interactive D3-powered tree visualization with zoom/pan, three view modes (standard, list, matrix), and materialized path pattern for O(1) subtree queries across the distributor network.",
      "**Commission Engine** : Configurable compensation plan supporting referral bonuses, binary pairing with multiple ratio formats (1:1, 1:2, 2:3), multi-generation matching bonuses, rank advancement rewards, and daily cap carry-forward logic.",
      "**Wallet & Financial System** : Real-time e-wallet with full transaction ledger, peer-to-peer fund transfers, withdrawal requests with KYC gate, and immutable commission records for lifetime earnings tracking.",
      "**Security & Compliance** : Two-factor authentication via TOTP, document-based KYC with admin review workflow, JWT-based RBAC, rate limiting, and Helmet HTTP header protection."
    ],
    tech: ["React", "TypeScript", "Redux Toolkit", "Node.js", "Express", "MongoDB", "Tailwind CSS", "Vite", "Docker"],
    year: "2026",
    type: "Emerging",
    color: "#8b5cf6",
    repo: "https://github.com/ewceniza9009/GenMatrix",
    demo: null,
    video: "https://github.com/user-attachments/assets/381e6f26-e5a0-4947-80d7-8414c1b4df6e",
    image: "/img/mlm.png",
    fallback: "/img/mlm.png"
  },
  {
    id: 7,
    title: "POS System",
    subtitle: "Point of Sale (Desktop & Mobile)",
    description: "A resilient, multi-platform point-of-sale solution built for retail and food-service environments where connectivity can't always be guaranteed. Its hybrid online/offline architecture keeps transactions flowing regardless of network conditions.",
    details: [
      "**Instant Multi-Terminal Sync** : Handles 50+ concurrent terminals syncing 1,000+ daily transactions in real time across all POS units.",
      "**Built-In Stock Management** : Tracks 2,000+ SKUs with low-stock alerts triggering automatic purchase orders for 15+ active retail locations.",
      "**Single-Codebase Multi-Platform** : Flutter enables native execution on iOS, Android, Windows, and web from one codebase serving 200+ daily active users.",
      "**Offline-First Resilience** : Local SQLite storage ensures 100% transaction continuity during outages with automatic sync for $50K+ in daily sales."
    ],
    tech: ["Flutter", "ASP.NET Core", "SQLite", "SignalR"],
    year: "2023",
    type: "Commercialized",
    color: "#00ff88",
    repo: "https://github.com/ewceniza9009/pos24",
    demo: null,
    video: "https://ewceniza23.bsite.net/videos/POSMVideo.mp4",
    image: "/img/POSM.png",
    fallback: "/img/1-thumbnail.jpg",
    testimonial: {
      quote: "We run a busy restaurant and reliability matters. When our internet goes down, the system keeps taking orders seamlessly. Our staff didn't even notice the outage. That's the kind of robustness we needed.",
      author: "Carlos Reyes",
      role: "Owner, Cebu Tasty Lechon"
    }
  }
]

export default projects