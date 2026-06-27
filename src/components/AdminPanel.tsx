import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Mail, Send, Loader, LogOut, 
  ArrowLeft, Search, Sparkles, Check, Copy, Inbox, 
  Lock, RefreshCw, CheckCircle2, ChevronDown, Cpu 
} from 'lucide-react'

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  replied: number
  reply_subject: string | null
  reply_body: string | null
  replied_at: string | null
  created_at: string
}

const getSafeItem = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
}
const setSafeItem = (key: string, value: string): void => {
  try { localStorage.setItem(key, value) } catch {}
}
const removeSafeItem = (key: string): void => {
  try { localStorage.removeItem(key) } catch {}
}

const AI_PRESETS = [
  { label: 'Accept Offer', prompt: 'Draft a warm, professional acceptance email. Express enthusiasm about the opportunity to collaborate, thank them for the offer, and ask about next onboarding steps.' },
  { label: 'Polite Decline', prompt: 'Draft a professional decline email. Polite and appreciative tone. State that I am currently at capacity and cannot take on new work, but thank them for reaching out.' },
  { label: 'Request Call', prompt: 'Draft a reply thanking them for their message. Express interest and ask if they are free to schedule a brief 15-minute Google Meet next week to discuss in detail.' },
  { label: 'General Thanks', prompt: 'Draft a brief, friendly reply thanking them for reaching out and writing such a thoughtful message. Let them know I will review their comments shortly.' }
]

function AdminPanel() {
  const [token, setToken] = useState<string | null>(getSafeItem('admin_token'))
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  // Real-time search/filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'unreplied' | 'replied'>('all')
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Reply form state
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiModel, setAiModel] = useState('gemini-2.5-flash')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  const api = async (path: string, options?: RequestInit) => {
    const baseUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3000'
      : ''
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Invalid password')
      const data = await res.json()
      setSafeItem('admin_token', data.token)
      setToken(data.token)
    } catch {
      setLoginError('Invalid password')
    }
  }

  const handleLogout = () => {
    removeSafeItem('admin_token')
    setToken(null)
    setSelected(null)
    setMessages([])
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await api('/api/messages')
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const res = await api('/api/ai/models')
      if (res.ok) {
        const data = await res.json()
        setAiModels(data.models)
        setAiModel(data.models[0])
      }
    } catch {}
  }

  useEffect(() => {
    if (token) { 
      fetchMessages()
      fetchModels() 
    }
  }, [token])

  const handleSendReply = async () => {
    if (!selected || !replySubject || !replyBody) return
    setSending(true)
    try {
      const res = await api('/api/reply', {
        method: 'POST',
        body: JSON.stringify({ messageId: selected.id, subject: replySubject, body: replyBody }),
      })
      if (!res.ok) throw new Error('Failed to send reply')
      
      const updated = { 
        ...selected, 
        replied: 1, 
        reply_subject: replySubject, 
        reply_body: replyBody, 
        replied_at: new Date().toISOString() 
      }
      setSelected(updated)
      setMessages(prev => prev.map(m => m.id === selected.id ? updated : m))
      setReplySubject('')
      setReplyBody('')
      setAiPrompt('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleAiCompose = async (customPrompt?: string) => {
    if (!selected) return
    const promptText = customPrompt || aiPrompt
    if (!promptText) return

    setAiLoading(true)
    try {
      const res = await api('/api/ai/compose', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          model: aiModel,
          context: `Original message from ${selected.name} (${selected.email}):\n${selected.message}`,
        }),
      })
      if (!res.ok) throw new Error('AI generation failed')
      const data = await res.json()
      setReplyBody(data.body)
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  // Filter messages dynamically based on tab and search query
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.subject && msg.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterTab === 'unreplied') return matchesSearch && msg.replied === 0
    if (filterTab === 'replied') return matchesSearch && msg.replied === 1
    return matchesSearch
  })

  // Count summaries
  const inboxCount = messages.filter(m => m.replied === 0).length
  const repliedCount = messages.filter(m => m.replied === 1).length

  // Login view
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 transition-all duration-300" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-md rounded-3xl p-8 glass shadow-2xl border"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border shadow-inner" style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}>
              <Lock size={24} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-1">Developer Cockpit</h2>
          <p className="text-xs text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Enter credentials to access admin functions</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Security Token</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border)',
                  outlineColor: 'var(--accent)'
                }}
                autoFocus
              />
            </div>
            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-xs text-center font-medium" 
                style={{ color: '#ef4444' }}
              >
                {loginError}
              </motion.p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Elite Dashboard layout
  return (
    <div className="min-h-screen flex flex-col transition-all duration-300" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Premium Dashboard Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 glass shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
          </a>
          <div className="flex items-center gap-2">
            <span className="font-signature text-lg font-bold" style={{ color: 'var(--accent)' }}>EWC</span>
            <span className="text-xs uppercase tracking-widest opacity-60 border-l pl-3 ml-1" style={{ borderColor: 'var(--border)' }}>Admin Control</span>
          </div>
        </div>

        {/* Dashboard Metrics Bar */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <Mail size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold">Inbox: <strong style={{ color: 'var(--accent)' }}>{inboxCount}</strong></span>
          </div>
          <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold">Replied: <strong style={{ color: 'var(--accent)' }}>{repliedCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 hover:bg-[#ef4444]/10 hover:border-[#ef4444]/30"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Split Grid Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 h-[calc(100vh-80px)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-stretch">
          
          {/* Left Column: Messages List (Visible always on desktop, hidden on mobile if message selected) */}
          <div className={`md:col-span-4 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selected ? 'hidden md:flex' : 'flex'}`}
               style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
            
            {/* Search and Tabs Container */}
            <div className="p-4 border-b space-y-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search inbox..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Filtering tabs */}
              <div className="flex p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                {(['all', 'unreplied', 'replied'] as const).map(tab => {
                  const active = filterTab === tab
                  const count = 
                    tab === 'all' ? messages.length : 
                    tab === 'unreplied' ? inboxCount : 
                    repliedCount
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{ 
                        background: active ? 'var(--accent)' : 'transparent',
                        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      {tab === 'all' ? 'All' : tab === 'unreplied' ? 'Inbox' : 'Sent'}
                      <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* List View Scroll Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted space-y-3">
                  <Loader size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span className="text-xs">Fetching records...</span>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-20">
                  <Inbox size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No messages found.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredMessages.map(msg => {
                    const active = selected?.id === msg.id
                    return (
                      <motion.button
                        key={msg.id}
                        layoutId={`card-${msg.id}`}
                        onClick={() => { 
                          setSelected(msg)
                          setReplySubject(msg.reply_subject || `Re: ${msg.subject || 'Contact Form Message'}`)
                        }}
                        className="w-full text-left rounded-xl p-4 transition-all relative border outline-none select-none flex flex-col"
                        style={{ 
                          background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
                          borderColor: active ? 'var(--accent)' : 'transparent',
                        }}
                        whileHover={{ scale: active ? 1 : 1.01 }}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="font-bold text-xs truncate max-w-[150px]" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{msg.name}</span>
                          <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatDate(msg.created_at).split(',')[0]}</span>
                        </div>
                        {msg.subject && <p className="text-[11px] font-semibold truncate mb-1" style={{ color: 'var(--text-secondary)' }}>{msg.subject}</p>}
                        <p className="text-xs truncate opacity-70 mb-1" style={{ color: 'var(--text-muted)' }}>{msg.message}</p>
                        
                        {msg.replied === 0 ? (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full shadow" style={{ background: 'var(--accent)' }} />
                        ) : (
                          <span className="text-[9px] self-start px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>Replied</span>
                        )}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Column: Message details & composer */}
          <div className={`md:col-span-8 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selected ? 'flex' : 'hidden md:flex'}`}
               style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
            
            {selected ? (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                
                {/* Message Header bar */}
                <div className="p-5 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelected(null)}
                      className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold">{selected.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{selected.email}</span>
                        <button 
                          onClick={() => handleCopyEmail(selected.email)}
                          className="p-1 hover:brightness-125 transition-all text-muted"
                          style={{ color: 'var(--text-muted)' }}
                          title="Copy Email"
                        >
                          {copiedEmail ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{formatDate(selected.created_at)}</span>
                </div>

                {/* Scrollable Reader & Composer wrapper */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* Original message body card */}
                  <div className="p-5 rounded-2xl border flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted" style={{ color: 'var(--text-secondary)' }}>Original Inquiry</span>
                      {selected.subject && <span className="text-xs font-semibold">Subject: {selected.subject}</span>}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                  </div>

                  {/* Thread History (If Replied) */}
                  {selected.replied === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl border flex flex-col" 
                      style={{ background: 'rgba(243, 202, 101, 0.05)', borderColor: 'var(--accent)' }}
                    >
                      <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--accent)' }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
                          <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--accent)' }}>Sent Reply</span>
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Replied on {formatDate(selected.replied_at!)}</span>
                      </div>
                      <p className="text-xs font-bold mb-2">Subject: {selected.reply_subject}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-95">{selected.reply_body}</p>
                    </motion.div>
                  )}

                  {/* Reply Form (Always Available for Follow-up Replies) */}
                  <div className="space-y-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        {selected.replied === 1 ? 'Send Follow-up Reply' : 'Compose Reply'}
                      </span>
                    </div>
                    
                    {/* Premium AI Assistant Co-pilot */}
                    <div className="p-5 rounded-2xl border" style={{ background: 'var(--accent-secondary-dim)', borderColor: 'rgba(204, 160, 61, 0.15)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>AI Copilot Autocomposer</span>
                        </div>
                        
                        {/* Custom Model Combobox */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:brightness-110 active:scale-[0.98]"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                          >
                            <Cpu size={12} style={{ color: 'var(--accent)' }} />
                            <span>{aiModel}</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                          </button>

                          <AnimatePresence>
                            {modelDropdownOpen && (
                              <>
                                {/* Click-outside overlay */}
                                <div className="fixed inset-0 z-30" onClick={() => setModelDropdownOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl p-1 w-48 overflow-hidden"
                                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                                >
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 p-0.5">
                                    {aiModels.map(m => {
                                      const active = m === aiModel
                                      return (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => {
                                            setAiModel(m)
                                            setModelDropdownOpen(false)
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-between"
                                          style={{ 
                                            background: active ? 'var(--accent-dim)' : 'transparent',
                                            color: active ? 'var(--accent)' : 'var(--text-primary)'
                                          }}
                                        >
                                          <span>{m}</span>
                                          {active && <Check size={11} style={{ color: 'var(--accent)' }} />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* One-Click Presets Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {AI_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAiCompose(preset.prompt)}
                            disabled={aiLoading}
                            className="px-3 py-2 rounded-xl text-[10px] font-bold text-center border transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                            style={{ 
                              background: 'var(--bg-card)', 
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Manual instructions prompt */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl text-xs"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          placeholder="Type custom instructions (e.g., Ask him to meet next Friday)..."
                        />
                        <button
                          onClick={() => handleAiCompose()}
                          disabled={aiLoading || !aiPrompt}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center shrink-0 min-w-[80px]"
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--bg-primary)',
                            opacity: aiLoading || !aiPrompt ? 0.6 : 1,
                          }}
                        >
                          {aiLoading ? <Loader size={12} className="animate-spin" /> : 'Generate'}
                        </button>
                      </div>
                    </div>

                    {/* Manual Composer */}
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">Subject Line</label>
                        <input
                          type="text"
                          value={replySubject}
                          onChange={e => setReplySubject(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-sm"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          placeholder="Re: ..."
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">Email Body</label>
                        <textarea
                          value={replyBody}
                          onChange={e => setReplyBody(e.target.value)}
                          rows={7}
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none custom-scrollbar"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          placeholder="Draft your reply message here..."
                        />
                      </div>

                      {/* Composer Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={handleSendReply}
                          disabled={sending || !replySubject || !replyBody}
                          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-[0.98] shadow-md"
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--bg-primary)',
                            opacity: sending || !replySubject || !replyBody ? 0.65 : 1,
                          }}
                        >
                          {sending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                          {sending ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              // Empty reader slate
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                <Inbox size={48} className="mb-4 opacity-25 animate-pulse" style={{ color: 'var(--accent)' }} />
                <h4 className="text-sm font-bold mb-1">Select an Inquiry</h4>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Click on a card from the left panel to review developer inquiries, copy addresses, and compose AI-assisted replies.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  )
}

export default AdminPanel
