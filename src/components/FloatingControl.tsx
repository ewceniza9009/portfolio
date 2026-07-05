import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Terminal, MessageCircle, X, Minimize2, Maximize2, SendHorizonal, Sparkles, Bot, User, MousePointer2, Mail, Phone, Linkedin, Github, Copy, Check } from 'lucide-react'
import { getSafeItem, setSafeItem } from '../utils/storage'
import { getApiUrl } from '../utils/api'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { parseMarkdown } from '../utils/markdown'
import { useLocation } from 'react-router-dom'

// ── Terminal Types ──
type HistoryLine = {
  type: 'command' | 'response' | 'error'
  content: string
}
interface AdventureChoice {
  text: string
  nextNode: string
}
interface AdventureNode {
  text: string
  choices: AdventureChoice[]
}

// ── Chat Types ──
type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

// ── Portfolio Context for AI ──
const PORTFOLIO_CONTEXT = `You are an AI assistant for Erwin Wilson Ceniza's portfolio. Answer questions about Erwin using the context below. Be concise, specific, and cite project names when relevant.

ABOUT: Erwin Wilson Ceniza, Senior Full-Stack Developer from Cebu, Philippines. 15+ years building commercial web apps, ERP/financial systems, distributed POS, AI integrations, and enterprise platforms. Deep expertise in C#/.NET, React/TypeScript, SQL Server/PostgreSQL.

SKILLS:
Backend: C#, ASP.NET Core 8/9/10, Node.js, Blazor, WPF, GraphQL (HotChocolate), SignalR, REST APIs, Entity Framework, Dapper, LINQ
Frontend: React, Angular, TypeScript, Tailwind CSS, Blazor, Flutter, Ionic, WPF/XAML
Database: MS SQL Server, PostgreSQL, MySQL, SQLite, MongoDB, Redis, Elasticsearch
DevOps: Docker, Azure DevOps, GitHub Actions, CI/CD, Azure, Vercel
Practices: Clean Architecture, CQRS, Domain-Driven Design, Microservices, MVVM, SOLID, OOP
Other: AI integration (Gemini, Puter.js), OpenCV/FaceNet, POS systems, real-time sync, n8n, SSRS reporting, Telerik/DevExpress/Syncfusion

EXPERIENCE:
- Nov 2025-Present: Software Developer at Eclaro Business Solution (Remote, US client) - Blazor, Azure Graph API, Azure Blob Storage, OData, EF Core, PostgreSQL
- Sep 2018-May 2025: Software Developer at AccountMate Corporation (Remote, San Francisco) - Built flagship ERP platform (WPF/XAML/MVVM). Built Advance Billing module for revenue optimization. Integrated Aatrix for 1099 tax compliance. SSRS reporting. WIP manufacturing module with Telerik UI. Azure DevOps CI/CD.
- Nov 2016-Sep 2018: Lead System Developer at TechnoLogic Solutions - Led full-lifecycle development of Cloud FMIS (Financial), Cloud HRIS (Payroll), Loan Management, POS, and Warehouse Management suites.
- Apr 2011-Mar 2015: Software Developer / RND at Innosoft Solutions - Transitioned legacy desktop to cloud services (POS, financial, HR systems).

PROJECTS (with full details):

1. Cloud FMIS (2019, Commercialized) - ASP.NET MVC, SQL Server, Telerik Reports
   FINANCIAL/ACCOUNTING system for trading/manufacturing. Full-cycle accounting: 5,000+ monthly journal entries across GL, AP (aging), AR (aging), with audit trail and adjustments. On-demand financial statements: Balance Sheet, Income Statement, Cash Flow, Trial Balance via custom .NET rendering. Multi-dimensional reporting by company/branch/consignment area/consolidated. Bank reconciliation with GL and float tracking. Inventory costing: 10,000+ SKUs integrated into financial ledgers (Ph1.5M-Ph3M monthly). 500+ purchase orders, invoices, disbursements, collections monthly (order-to-cash, procure-to-pay). Production/recipe management with BOMs for food manufacturing.
   Testimonial: Finance Manager at Maville Recycling praises real-time financial dashboards.

2. Cloud HRIS (2020, Commercialized) - ASP.NET Core, MAUI.NET, SQL Server, OpenCV/FaceNet
   Full-featured HR/payroll platform. Smart Payroll Engine: 10,000+ attendance records semi-monthly, auto-computes work hours, tardiness, overtime, night differentials, statutory contributions, custom deductions. Biometric facial recognition replacing hardware timekeeping. Self-service mobile app for payslips, leave, overtime. Intelligent leave integration auto-reflected in payroll.
   Testimonial: Accounting Head at Cebu Cube Ice Inc. praises payroll accuracy and tax deductions.

3. Cloud Loan (2022, Commercialized) - Blazor.NET, SQL Server, Syncfusion, DevExpress
   Complete loan lifecycle platform. Digital origination with e-forms and automated credit scoring. Portfolio oversight dashboard for active loans, maturities, payment schedules, delinquency. Automated loan servicing: recurring billing, payment allocation, penalty computation, amortization. Risk analytics: portfolio composition, exposure, collection effectiveness, aging analysis.

4. GenMatrix (2026, Emerging) - React, TypeScript, Node.js, Express, MongoDB
   Binary MLM platform. Binary genealogy tree with D3 visualization (zoom/pan, 3 views). Configurable commission engine: referral bonuses, binary pairing (1:1,1:2,2:3), multi-generation matching bonuses, rank advancement, daily cap carry-forward. Wallet system with full transaction ledger, P2P transfers, withdrawal with KYC. TOTP 2FA. Integrated product shop.

5. SynchroPOS (2023, Commercialized) - Flutter, ASP.NET Core, SQLite, SignalR
   Multi-platform POS for retail/food-service. 50+ concurrent terminals, 1,000+ daily transactions real-time sync. 2,000+ SKUs with low-stock alerts and auto purchase orders across 15+ locations. Offline-first: local SQLite guarantees 100% transaction continuity during outages, auto-sync $50K+ daily sales.
   Testimonial: Restaurant owner confirms reliability during internet outages.

6. CloudPallet (2025, Deployed) - ASP.NET Core 9, Angular 20, SignalR, Docker
   3PL cold storage WMS. Usage-based billing by storage duration, temperature tier, handling events, VAS. FEFO lot tracking, granular location hierarchy. Barcode-enforced ops (SSCC generation, verification). Multi-tier RBAC (Admin/Operator/Finance). QuestPDF invoices/receipts.

7. NexPoint CRM (2025, Deployed) - ASP.NET Core 10, PostgreSQL, Angular 20, SignalR
   Enterprise CRM. 360-degree customer profiles. Visual sales pipeline with lead scoring and revenue forecasting. Campaign + support ticketing. Real-time SignalR dashboards. Invoice preview and billing dashboard.

8. drobble (2024, Microservices) - ASP.NET Core, React, MongoDB, PostgreSQL, Docker
   E-commerce engine. Microservices: catalog, users, orders, payments, search, reviews. Ocelot API gateway + RabbitMQ. Polyglot persistence. OpenTelemetry observability. JWT auth, rate limiting.

9. Smash Elite (2026, SaaS) - React, Node.js, Express, SQLite/Turso, Socket.IO
   Badminton facility platform. Court booking with dynamic pricing. Tournament engine with live Socket.IO scoring. Jersey CMS + e-commerce with GCash/COD. Delivery dashboard with PIN verification.

10. Halkyone Clinical OS (2026, Emerging) - .NET 9, HotChocolate GraphQL, Next.js 14, PostgreSQL
    Multi-tenant EMR platform. Three-portal architecture (clinical, admin, mobile). Patient billing dashboard. Transactional outbox for data consistency. Geospatial clinician routing. Dynamic clinical assessments.

11. EWC-OS Portfolio - This portfolio site with AI chat, terminal emulator, visitor analytics, blog with Dev.to cross-posting, AI blog summarizer.

AWARDS:
- Award of Excellence (Dec 2024, AccountMate) - key role in developing/stabilizing core platform
- Service Award (Dec 2023, AccountMate) - 5 years of continuous dedication

EDUCATION: Not specified in portfolio data.

BLOG: He writes about React, TypeScript, C#, full-stack development, AI integrations, POS systems, and building real-world web applications.

If asked about something not in this context, say: "I don't have that information in my context. Check Erwin's portfolio or contact him directly."

IMPORTANT: If asked about accounting systems, mention ALL relevant projects: Cloud FMIS (full financial accounting), Cloud HRIS (payroll), GenMatrix (wallet/ledger), Cloud Loan (loan servicing), NexPoint (billing/invoicing), CloudPallet (usage billing), POS (transactional ledger). Erwin has deep experience building accounting-adjacent systems throughout his career.`

// ── Terminal Adventure Story ──
const ADVENTURE_STORY: Record<string, AdventureNode> = {
  start: {
    text: "🔒 Megacorp Mainframe Entrance. You have bypassed the external firewall. You see three entry points:\n[1] Physical access port in the basement server room\n[2] Optical fiber link on the rooftop antenna\n[3] Direct phishing attack on the CEO's assistant\nType '1', '2', or '3' to select your entry vector:",
    choices: [
      { text: "Basement vector selected. You slip past the loading dock.", nextNode: "basement" },
      { text: "Rooftop vector selected. You climb the fire escape with your node transceiver.", nextNode: "rooftop" },
      { text: "Phishing vector selected. You send an encrypted link disguised as an audit report.", nextNode: "phishing" }
    ]
  },
  basement: {
    text: "💾 Basement Server Room. A security guard is patrolling nearby. Do you:\n[1] Create a distraction by overloading the AC server rack cooling unit\n[2] Hide behind the high-density backup array cabinets\n[3] Hack the nearby terminal reader to lock the guard out\nType '1', '2', or '3':",
    choices: [
      { text: "AC unit overloaded! The guard leaves to investigate. You plug into the port.", nextNode: "success" },
      { text: "You hid behind the rack, but your custom cursor glow reflected on the floor. Caught!", nextNode: "fail" },
      { text: "Reader hacked! But it triggered a silent alarm. Lockdown engaged!", nextNode: "fail" }
    ]
  },
  rooftop: {
    text: "📡 Rooftop Antenna. A security drone begins mapping the rooftop. Do you:\n[1] Jam its sensors using your Flipper Zero\n[2] Disconnect and hide in the ventilation shaft\n[3] Attempt to hijack the drone's telemetry node\nType '1', '2', or '3':",
    choices: [
      { text: "Drone jammed! It spins off-course. You finish downloading files.", nextNode: "success" },
      { text: "Vent shaft entry. You escaped, but your connection equipment was seized.", nextNode: "fail" },
      { text: "Telemetry hijacked! You steer the drone away and extract the databases.", nextNode: "success" }
    ]
  },
  phishing: {
    text: "📧 Phishing Vector. The CEO's assistant opens the link, but security filters trigger a suspicious file warning. Do you:\n[1] Inject an obfuscated shell payload to bypass protection\n[2] Abort immediately and scrub connection logs\n[3] Call the assistant disguised as security IT support\nType '1', '2', or '3':",
    choices: [
      { text: "Payload injected! Security filters bypassed. Administrative access obtained.", nextNode: "success" },
      { text: "Scrubbed logs. Safe, but you gained no intelligence.", nextNode: "fail" },
      { text: "Disguise call worked! You talked them into verifying the OTP code. Shell active.", nextNode: "success" }
    ]
  },
  success: {
    text: "🎉 ACCESS GRANTED! You successfully downloaded the repository and logged out undetected. You are officially an Elite Netrunner. Type 'exit' to return to normal prompt.",
    choices: []
  },
  fail: {
    text: "🚨 SYSTEM LOCKED! Security caught you. Connection terminated. Type 'exit' to return to normal prompt, or 'try' to restart the hack.",
    choices: []
  }
}

// ── Terminal Sub-components ──
function MatrixOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animFrame: number
    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 360
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&+-=*/{}[]|<>'.split('')
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)
    const rootStyle = getComputedStyle(document.documentElement)
    const accentColor = rootStyle.getPropertyValue('--accent').trim() || '#a1781b'
    const draw = () => {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = accentColor
      ctx.font = `${fontSize}px monospace`
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      animFrame = requestAnimationFrame(draw)
    }
    draw()
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])
  return (
    <div className="absolute inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="px-4 py-2 border-b flex items-center justify-between text-xs select-none" style={{ borderColor: '#30363d', background: '#161b22', color: '#8b949e' }}>
        <span>Matrix Mode Active - Press ESC or click exit to close</span>
        <button onClick={onClose} className="hover:text-red-400 font-bold transition-colors">exit</button>
      </div>
      <canvas ref={canvasRef} className="flex-grow w-full" />
    </div>
  )
}

function SnakeOverlay({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [key, setKey] = useState(0)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let intervalId: any
    const width = 400, height = 300
    canvas.width = width; canvas.height = height
    const gridSize = 10, cols = width / gridSize, rows = height / gridSize
    let snake = [{ x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }]
    let dir = { x: 0, y: -1 }
    let food = { x: 15, y: 15 }
    let currentScore = 0
    const generateFood = () => {
      let newFood = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }
      while (snake.some(s => s.x === newFood.x && s.y === newFood.y))
        newFood = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }
      food = newFood
    }
    const rootStyle = getComputedStyle(document.documentElement)
    const accentColor = rootStyle.getPropertyValue('--accent').trim() || '#a1781b'
    const gameLoop = () => {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) { setGameOver(true); clearInterval(intervalId); return }
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) { setGameOver(true); clearInterval(intervalId); return }
      snake.unshift(head)
      if (head.x === food.x && head.y === food.y) { currentScore += 10; setScore(currentScore); generateFood() }
      else snake.pop()
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, width, height)
      snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? accentColor : 'rgba(255, 255, 255, 0.7)'
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1)
      })
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1)
    }
    intervalId = setInterval(gameLoop, 100)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': if (dir.y !== 1) dir = { x: 0, y: -1 }; e.preventDefault(); break
        case 'ArrowDown': case 's': case 'S': if (dir.y !== -1) dir = { x: 0, y: 1 }; e.preventDefault(); break
        case 'ArrowLeft': case 'a': case 'A': if (dir.x !== 1) dir = { x: -1, y: 0 }; e.preventDefault(); break
        case 'ArrowRight': case 'd': case 'D': if (dir.x !== -1) dir = { x: 1, y: 0 }; e.preventDefault(); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { clearInterval(intervalId); window.removeEventListener('keydown', handleKeyDown) }
  }, [onClose, key])
  const restartGame = () => { setGameOver(false); setScore(0); setKey(prev => prev + 1) }
  return (
    <div className="absolute inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="px-4 py-2 border-b flex items-center justify-between text-xs select-none" style={{ borderColor: '#30363d', background: '#161b22', color: '#8b949e' }}>
        <span>Snake Game - Score: <strong className="text-white">{score}</strong> (Controls: WASD / Arrows)</span>
        <button onClick={onClose} className="hover:text-red-400 font-bold transition-colors">exit</button>
      </div>
      <div className="flex-grow flex items-center justify-center relative p-4">
        <canvas ref={canvasRef} className="border shadow-lg bg-black" style={{ borderColor: '#30363d' }} />
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 z-20">
            <h4 className="text-red-400 text-xl font-bold mb-2">GAME OVER</h4>
            <p className="text-sm mb-4">Final Score: {score}</p>
            <div className="flex gap-4">
              <button onClick={restartGame} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90">Play Again</button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-transparent text-white border hover:bg-white/10" style={{ borderColor: '#30363d' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Terminal Window ──
function TerminalWindow({ onClose }: { onClose: () => void }) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isRoot, setIsRoot] = useState(false)
  const [input, setInput] = useState('')
  const [activeMode, setActiveMode] = useState<'matrix' | 'snake' | 'guess' | 'adventure' | null>(null)
  const [guessTarget, setGuessTarget] = useState(0)
  const [guessAttempts, setGuessAttempts] = useState(0)
  const [adventureNode, setAdventureNode] = useState('start')
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'response', content: 'Welcome to EWC-OS v1.0.0' },
    { type: 'response', content: 'Type "help" to see available commands.' }
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragControls = useDragControls()

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    if (inputRef.current) inputRef.current.focus()
  }, [history])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = input.trim().toLowerCase()
    if (!cmd) return

    if (activeMode === 'guess') {
      const newHistory = [...history, { type: 'command' as const, content: input }]
      if (cmd === 'exit' || cmd === 'quit') { setActiveMode(null); newHistory.push({ type: 'response', content: 'Exited Guess game.' }); setHistory(newHistory); setInput(''); return }
      const guessNum = parseInt(cmd)
      if (isNaN(guessNum)) { newHistory.push({ type: 'error', content: 'Please enter a valid number, or type "exit" to quit.' }) }
      else {
        const newAttempts = guessAttempts + 1; setGuessAttempts(newAttempts)
        if (guessNum === guessTarget) { newHistory.push({ type: 'response', content: `🎉 CORRECT! You guessed the number ${guessTarget} in ${newAttempts} attempts!` }); setActiveMode(null) }
        else { newHistory.push({ type: 'response', content: `${guessNum > guessTarget ? 'Too HIGH 👇' : 'Too LOW 👆'}. Try again (type "exit" to quit):` }) }
      }
      setHistory(newHistory); setInput(''); return
    }

    if (activeMode === 'adventure') {
      const newHistory = [...history, { type: 'command' as const, content: input }]
      if (cmd === 'exit' || cmd === 'quit') { setActiveMode(null); newHistory.push({ type: 'response', content: 'Exited Cyberpunk adventure.' }); setHistory(newHistory); setInput(''); return }
      if (adventureNode === 'fail' && cmd === 'try') { setAdventureNode('start'); newHistory.push({ type: 'response', content: 'Restarting Netrunner link...' }, { type: 'response', content: ADVENTURE_STORY['start'].text }); setHistory(newHistory); setInput(''); return }
      const currentNode = ADVENTURE_STORY[adventureNode]
      const choiceIndex = parseInt(cmd) - 1
      if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= currentNode.choices.length) { newHistory.push({ type: 'error', content: `Invalid option. Type '1', '2', or '3' (or 'exit' to quit).` }) }
      else {
        const selectedChoice = currentNode.choices[choiceIndex]
        newHistory.push({ type: 'response', content: `> ${selectedChoice.text}` })
        setAdventureNode(selectedChoice.nextNode)
        newHistory.push({ type: 'response', content: ADVENTURE_STORY[selectedChoice.nextNode].text })
      }
      setHistory(newHistory); setInput(''); return
    }

    const newHistory = [...history, { type: 'command' as const, content: cmd }]
    switch (cmd) {
      case 'help': newHistory.push({ type: 'response', content: 'Available commands: about, skills, contact, resume, clear, cls, date, whoami, su, sudo su, matrix, hack, snake, guess, adventure' }); break
      case 'about': newHistory.push({ type: 'response', content: 'Erwin Wilson Ceniza | Principal Full-Stack Developer | Building commercial web applications and AI integrations.' }); break
      case 'skills': newHistory.push({ type: 'response', content: 'Frontend: React, TypeScript, Tailwind | Backend: C#, ASP.NET Core, Node.js | Database: SQL Server, PostgreSQL' }); break
      case 'contact': newHistory.push({ type: 'response', content: 'Email: erwinwilsonceniza@gmail.com | Phone: +63 935-122-8470' }); break
      case 'resume': newHistory.push({ type: 'response', content: 'Opening resume... (Please use the top navigation button to download the actual PDF)' }); break
      case 'whoami': newHistory.push({ type: 'response', content: isRoot ? 'root' : 'guest' }); break
      case 'date': newHistory.push({ type: 'response', content: new Date().toString() }); break
      case 'matrix': setHistory(newHistory); setInput(''); setActiveMode('matrix'); return
      case 'snake': case 'game': setHistory(newHistory); setInput(''); setActiveMode('snake'); return
      case 'guess':
        setGuessTarget(Math.floor(Math.random() * 100) + 1); setGuessAttempts(0); setActiveMode('guess')
        newHistory.push({ type: 'response', content: '🔢 GUESS THE NUMBER! I am thinking of a number between 1 and 100.' }, { type: 'response', content: 'Enter your guess (type "exit" to quit):' }); break
      case 'adventure': case 'rpg':
        setAdventureNode('start'); setActiveMode('adventure')
        newHistory.push({ type: 'response', content: '🕵️ CYBERPUNK TEXT ADVENTURE' }, { type: 'response', content: ADVENTURE_STORY['start'].text }); break
      case 'hack':
        newHistory.push({ type: 'response', content: 'Initializing cybernetic link...' })
        const hackSteps = ['Locating target system [IP: 192.168.42.109]...', 'Bypassing SSL handshake protocols...', 'Cracking 256-bit AES encryption keys...', 'Injecting root payload into memory buffers...', 'Gaining shell access: guest -> administrative root...', 'Downloading top secret project files (98% completion)...', 'SUCCESS: Access granted. System owned. Type "su" to toggle root shell permanently.']
        hackSteps.forEach((step, index) => { setTimeout(() => { setHistory(prev => [...prev, { type: 'response', content: step }]) }, (index + 1) * 300) })
        break
      case 'sudo': case 'su': case 'sudo su':
        if (isRoot) newHistory.push({ type: 'response', content: 'You are already root.' })
        else { setIsRoot(true); newHistory.push({ type: 'response', content: 'Bypassing security protocols... Access granted. Welcome, root.' }) }
        break
      case 'exit': if (isRoot) { setIsRoot(false); newHistory.push({ type: 'response', content: 'Logged out of root.' }) } else onClose(); break
      case 'rm -rf /':
        if (isRoot) { setHistory([{ type: 'error', content: 'CRITICAL SYSTEM FAILURE: Root file system deleted.' }]); setTimeout(() => onClose(), 2000); return }
        else newHistory.push({ type: 'error', content: 'rm: cannot remove \'/\': Permission denied' }); break
      case 'clear': case 'cls': setHistory([]); setInput(''); return
      case 'ls': case 'dir': newHistory.push({ type: 'response', content: 'projects/  skills/  experience/  contact/' }); break
      default:
        if (cmd.startsWith('echo ')) newHistory.push({ type: 'response', content: cmd.replace('echo ', '') })
        else newHistory.push({ type: 'error', content: `Command not found: ${cmd}` })
    }
    setHistory(newHistory); setInput('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: -800, bottom: 50, left: -800, right: 800 }}
      className={`fixed z-[90] shadow-2xl overflow-hidden font-mono text-sm border ${
        isMaximized ? 'inset-4 rounded-xl' : 'sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:max-w-4xl sm:h-[400px] sm:max-h-[70vh] sm:w-[calc(100%-2rem)] sm:top-auto inset-4 rounded-xl'
      }`}
      style={{ background: '#0d1117', borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b select-none cursor-move active:cursor-grabbing"
        style={{ background: '#161b22', borderColor: '#30363d', touchAction: 'none' }}
        onPointerDown={(e) => { if (!isMaximized) dragControls.start(e) }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: '#8b949e' }}>
          <Terminal size={14} /> EWC-OS Terminal
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMaximized(!isMaximized)} className="hover:text-white transition-colors" style={{ color: '#8b949e' }}>
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClose} className="hover:text-red-400 transition-colors" style={{ color: '#8b949e' }}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(100%-40px)] relative" onClick={() => inputRef.current?.focus()} style={{ overscrollBehavior: 'contain' }}>
        {activeMode === 'matrix' && <MatrixOverlay onClose={() => setActiveMode(null)} />}
        {activeMode === 'snake' && <SnakeOverlay onClose={() => setActiveMode(null)} />}
        {history.map((line, i) => (
          <div key={i} className="mb-2">
            {line.type === 'command' && (
              <div className="flex items-start gap-2">
                <span className={isRoot ? "text-red-400 font-bold" : "text-green-400"}>
                  {isRoot ? 'root@ewc-os:~#' : 'guest@ewc-os:~$'}
                </span>
                <span className="text-white">{line.content}</span>
              </div>
            )}
            {line.type === 'response' && <div className="text-gray-300 ml-4 whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'error' && <div className="text-red-400 ml-4 font-bold">{line.content}</div>}
          </div>
        ))}
        <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
          <span className={isRoot ? "text-red-400 font-bold" : "text-green-400"}>
            {isRoot ? 'root@ewc-os:~#' : 'guest@ewc-os:~$'}
          </span>
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            className={`flex-1 bg-transparent border-none outline-none font-mono ${isRoot ? 'text-red-100' : 'text-white'}`}
            autoFocus autoComplete="off" spellCheck="false" />
        </form>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  )
}

// ── Chat Window ──
const SUGGESTIONS = [
  'What projects have you worked on?',
  'Tell me about Halkyone Clinical OS',
  'What are your top skills?',
  'Show me your experience',
  'What tech stack do you use?',
]

function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hey! Ask me anything about Erwin — his skills, projects, experience, or blog posts. 👋' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [blogContext, setBlogContext] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragControls = useDragControls()
  const [isMaximized, setIsMaximized] = useState(false)

  const parsedContent = useMemo(() => {
    return messages.map(msg => msg.role === 'assistant' ? parseMarkdown(msg.content) : null)
  }, [messages])

  useEffect(() => {
    fetch(getApiUrl('/api/blogs'))
      .then(r => r.json())
      .then(blogs => {
        if (Array.isArray(blogs) && blogs.length) {
          const lines = blogs.slice(0, 10).map((b: any) => `- "${b.title}" (${b.tags || 'general'}${b.summary ? ': ' + b.summary.slice(0, 120) : ''})`)
          setBlogContext('\n\nBLOG POSTS:\n' + lines.join('\n'))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowSuggestions(false)
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: msg }]
    setMessages(updatedMessages)
    setLoading(true)
    try {
      const fullContext = PORTFOLIO_CONTEXT + blogContext
      const res = await fetch(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, context: fullContext }),
      })
      const data = await res.json()
      const reply = data.reply || 'Sorry, I could not generate a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Try again?' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: -800, bottom: 50, left: -800, right: 800 }}
      className={`fixed z-[100] shadow-2xl overflow-hidden text-sm border ${
        isMaximized ? 'inset-4 rounded-2xl' : 'sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:max-w-lg sm:h-[520px] sm:max-h-[70vh] sm:w-[calc(100%-2rem)] sm:top-auto inset-4 rounded-2xl'
      }`}
      style={{ 
        background: 'var(--bg-card)', 
        borderColor: 'var(--accent)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 40px color-mix(in srgb, var(--accent) 20%, transparent)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 border-b select-none cursor-move active:cursor-grabbing"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--bg-secondary)) 0%, var(--bg-card) 100%)',
          borderColor: 'var(--border)',
          touchAction: 'none'
        }}
        onPointerDown={(e) => { if (!isMaximized) dragControls.start(e) }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ 
            background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--accent-secondary)) 100%)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)'
          }}>
            <Bot size={18} className="text-[var(--bg-primary)]" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>AI Assistant</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Ready to help</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsMaximized(!isMaximized)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90" style={{ color: 'var(--text-secondary)' }}>
            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-all active:scale-90" style={{ color: 'var(--text-secondary)' }}>
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto h-[calc(100%-150px)] px-4 py-5 space-y-5" style={{ background: 'var(--bg-primary)', overscrollBehavior: 'contain' }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ 
                background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--accent-secondary)) 100%)'
              }}>
                <Bot size={14} className="text-[var(--bg-primary)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-5 py-3.5 text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-2xl rounded-br-md'
                  : 'rounded-2xl rounded-bl-md'
              }`}
              style={{
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, var(--accent-secondary)) 100%)' 
                  : 'var(--bg-secondary)',
                color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                boxShadow: msg.role === 'user' ? '0 4px 12px color-mix(in srgb, var(--accent) 20%, transparent)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_p]:mb-1 [&_strong]:font-semibold [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-lg [&_code]:text-[11px] [&_code]:bg-black/10 dark:[&_code]:bg-white/10" style={{ '--tw-prose-body': 'var(--text-primary)', '--tw-prose-bold': 'var(--text-primary)', '--tw-prose-code': 'var(--text-primary)' } as any}>
                  {parsedContent[i]}
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, var(--text-muted) 0%, color-mix(in srgb, var(--text-muted) 70%, var(--text-secondary)) 100%)' }}>
                <User size={14} className="text-[var(--bg-primary)]" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Suggestions */}
        {showSuggestions && messages.length === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="pt-3 pb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)',
                    borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
                    color: 'var(--text-secondary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-3"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--accent-secondary)) 100%)'
            }}>
              <Bot size={14} className="text-[var(--bg-primary)]" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-bl-md shadow-sm" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce" style={{ color: 'var(--accent)', boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce [animation-delay:0.12s]" style={{ color: 'var(--accent)', boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce [animation-delay:0.24s]" style={{ color: 'var(--accent)', boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend() }}
        className="flex items-center gap-2.5 px-4 py-4 border-t"
        style={{ 
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)', 
          borderColor: 'var(--border)' 
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none border transition-all focus:ring-2 focus:ring-offset-0"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--accent-secondary)) 100%)', 
            color: 'var(--bg-primary)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)'
          }}
        >
          <SendHorizonal size={17} />
        </button>
      </form>
    </motion.div>
  )
}

// ── Main FloatingControl ──
export default function FloatingControl() {
  const location = useLocation()
  const isHomePage = location.pathname === '/' || location.pathname === ''
  const [mode, setMode] = useState<'menu' | 'terminal' | 'chat' | 'contact' | null>(null)
  const [cursorOn, setCursorOn] = useState(() => (getSafeItem('cursor_enabled') ?? 'true') === 'true')
  const menuContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.dataset.fabActive = mode === 'menu' ? 'true' : 'false'
    document.body.dataset.windowActive = mode === 'chat' || mode === 'terminal' ? 'true' : 'false'
    return () => { document.body.dataset.fabActive = 'false'; document.body.dataset.windowActive = 'false' }
  }, [mode])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mode === 'menu' && menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMode(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mode])

  const toggleCursor = useCallback(() => {
    setCursorOn(prev => {
      const next = !prev
      setSafeItem('cursor_enabled', next ? 'true' : 'false')
      document.documentElement.dataset.cursorEnabled = next ? 'true' : 'false'
      window.dispatchEvent(new CustomEvent('cursor-state-changed', { detail: { enabled: next } }))
      return next
    })
  }, [])

  if (!isHomePage) return null

  const handleFabClick = () => {
    if (mode === 'menu') setMode(null)
    else setMode('menu')
  }

  const handleClose = () => setMode(null)

  return (
    <div ref={menuContainerRef}>
      {/* FAB Button */}
      {(!mode || mode === 'menu') && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3">
          {/* AI Chat Standalone Button */}
          <motion.button
            onClick={() => setMode('chat')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-lg transition-all hover:brightness-110 select-none"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px color-mix(in srgb, var(--accent) 15%, transparent)'
            }}
          >
            <MessageCircle size={14} /> AI Chat
          </motion.button>

          {/* Launch Menu Button */}
          <div className="relative group">
            <motion.button
              onClick={handleFabClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-lg transition-all hover:brightness-110 select-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px color-mix(in srgb, var(--accent) 15%, transparent)'
              }}
            >
              <Sparkles size={13} /> Launch
            </motion.button>
            <div className={`absolute bottom-full mb-3 right-0 opacity-0 ${mode !== 'menu' ? 'group-hover:opacity-100' : ''} transition-opacity duration-200 pointer-events-none hidden sm:block`}>
              <div className="rounded-lg border shadow-xl px-3 py-2 text-[11px] font-medium whitespace-nowrap"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Terminal &middot; Contact &middot; Cursor
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-menu */}
      <AnimatePresence>
        {mode === 'menu' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[100] flex flex-col gap-1.5 items-end"
          >
            <button
              onClick={() => setMode('terminal')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all hover:brightness-110 active:scale-95 whitespace-nowrap border backdrop-blur-xl"
              style={{
                background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                borderColor: 'color-mix(in srgb, var(--border) 150%, transparent)',
                color: 'var(--text-secondary)',
              }}
            >
              <Terminal size={14} /> Terminal
            </button>
            <button
              onClick={() => setMode('contact')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all hover:brightness-110 active:scale-95 whitespace-nowrap border backdrop-blur-xl"
              style={{
                background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                borderColor: 'color-mix(in srgb, var(--border) 150%, transparent)',
                color: 'var(--text-secondary)',
              }}
            >
              <Phone size={14} /> Contact
            </button>
            <button
              onClick={toggleCursor}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all hover:brightness-110 active:scale-95 whitespace-nowrap border backdrop-blur-xl"
              style={{
                background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                borderColor: cursorOn ? 'var(--accent)' : 'color-mix(in srgb, var(--border) 150%, transparent)',
                color: cursorOn ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <MousePointer2 size={14} /> Cursor
            </button>
            <div className="absolute -top-1 right-6 w-6 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Window */}
      <AnimatePresence>
        {mode === 'terminal' && <TerminalWindow onClose={handleClose} />}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {mode === 'chat' && <ChatWindow onClose={handleClose} />}
      </AnimatePresence>

      {/* Contact Panel */}
      <AnimatePresence>
        {mode === 'contact' && <ContactPanel onClose={handleClose} />}
      </AnimatePresence>
    </div>
  )
}

// ── Contact Panel ──
function CopyToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="absolute -top-6 right-0 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap z-30 shadow-lg"
      style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
    >
      <Check size={9} className="inline mr-0.5 -mt-0.5" />
      {message}
    </motion.div>
  )
}

function ContactPanel({ onClose }: { onClose: () => void }) {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const dragControls = useDragControls()

  const handleCopy = useCallback(async (value: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {}
  }, [])

  const contactItems = [
    { icon: <Mail size={16} />, label: 'Email', value: 'erwinwilsonceniza@gmail.com', copyValue: 'erwinwilsonceniza@gmail.com', href: 'mailto:erwinwilsonceniza@gmail.com', copied: copiedEmail, setCopied: setCopiedEmail },
    { icon: <Phone size={16} />, label: 'Phone', value: '+63 935-122-8470', copyValue: '+639351228470', href: 'tel:+639351228470', copied: copiedPhone, setCopied: setCopiedPhone },
  ]

  const socialItems = [
    { icon: <Linkedin size={16} />, label: 'LinkedIn', value: 'erwin-wilson-ceniza', href: 'https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32' },
    { icon: <Github size={16} />, label: 'GitHub', value: 'ewceniza9009', href: 'https://github.com/ewceniza9009' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: -800, bottom: 50, left: -800, right: 800 }}
      className="fixed z-[100] shadow-2xl border sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:max-w-sm sm:w-[calc(100%-2rem)] sm:rounded-xl sm:top-auto inset-4 rounded-xl overflow-y-auto"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header - drag handle */}
      <div
        className="flex items-center justify-between px-4 py-3 select-none cursor-move active:cursor-grabbing"
        style={{ borderBottom: '1px solid var(--border)', touchAction: 'none' }}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="text-sm font-semibold">Contact</span>
        <button onClick={onClose}
          className="p-1 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {contactItems.map((item) => (
          <div key={item.label} className="relative">
            <AnimatePresence>
              {item.copied && <CopyToast message="Copied" />}
            </AnimatePresence>
            <a
              href={item.href}
              onClick={(e) => { e.preventDefault(); handleCopy(item.copyValue, item.setCopied) }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ color: 'var(--accent)', width: 20 }} className="flex-shrink-0">
                {item.icon}
              </div>
              <span className="text-sm truncate flex-1">{item.value}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {item.copied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* Social */}
      <div className="px-4 pb-4 pt-0 flex gap-2">
        {socialItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    </motion.div>
  )
}
