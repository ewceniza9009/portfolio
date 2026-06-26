import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Mail, Send, Loader, LogOut, Bot, ArrowLeft } from 'lucide-react'

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

function AdminPanel() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'))
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Reply form state
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiModel, setAiModel] = useState('gemini-1.5-flash')

  const api = async (path: string, options?: RequestInit) => {
    return fetch(path, {
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
      localStorage.setItem('admin_token', data.token)
      setToken(data.token)
    } catch {
      setLoginError('Invalid password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
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
    if (token) { fetchMessages(); fetchModels() }
  }, [token])

  const handleSendReply = async () => {
    if (!selected || !replySubject || !replyBody) return
    setSending(true)
    try {
      const res = await api('/api/reply', {
        method: 'POST',
        body: JSON.stringify({ messageId: selected.id, subject: replySubject, body: replyBody }),
      })
      if (!res.ok) throw new Error('Failed')
      setSelected({ ...selected, replied: 1, reply_subject: replySubject, reply_body: replyBody, replied_at: new Date().toISOString() })
      setReplySubject('')
      setReplyBody('')
      setAiPrompt('')
      fetchMessages()
    } finally {
      setSending(false)
    }
  }

  const handleAiCompose = async () => {
    if (!selected || !aiPrompt) return
    setAiLoading(true)
    try {
      const res = await api('/api/ai/compose', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          model: aiModel,
          context: `Original message from ${selected.name} (${selected.email}):\n${selected.message}`,
        }),
      })
      if (!res.ok) throw new Error('AI failed')
      const data = await res.json()
      setReplyBody(data.body)
    } finally {
      setAiLoading(false)
    }
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl p-8 glass shadow-2xl"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <MessageSquare size={24} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              autoFocus
            />
            {loginError && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Message detail view
  if (selected) {
    return (
      <div className="min-h-screen px-6 py-12" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} /> Back to messages
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 glass shadow-2xl mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm" style={{ color: 'var(--accent)' }}>{selected.email}</p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(selected.created_at)}</span>
            </div>
            {selected.subject && <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subject: {selected.subject}</p>}
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selected.message}</p>
            {selected.replied === 1 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Replied on {formatDate(selected.replied_at!)}</p>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Subject: {selected.reply_subject}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selected.reply_body}</p>
              </div>
            )}
          </motion.div>

          {/* Reply Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 glass shadow-2xl"
          >
            <h3 className="text-lg font-semibold mb-4">Send Reply</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Subject</label>
              <input
                type="text"
                value={replySubject}
                onChange={e => setReplySubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder="Re: ..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Message</label>
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder="Write your reply..."
              />
            </div>

            {/* AI Compose */}
            <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--accent-secondary-dim)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Bot size={16} style={{ color: 'var(--accent-secondary)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--accent-secondary)' }}>AI Compose</span>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  placeholder="e.g., Write a friendly professional reply..."
                />
                <button
                  onClick={handleAiCompose}
                  disabled={aiLoading || !aiPrompt}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--accent-secondary)',
                    color: '#fff',
                    opacity: aiLoading || !aiPrompt ? 0.6 : 1,
                  }}
                >
                  {aiLoading ? <Loader size={16} className="animate-spin" /> : 'Generate'}
                </button>
              </div>
              <select
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {aiModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSendReply}
                disabled={sending || !replySubject || !replyBody}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  opacity: sending || !replySubject || !replyBody ? 0.6 : 1,
                }}
              >
                {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Message list
  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Mail size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-semibold">Messages ({messages.length})</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMessages}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <Mail size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <motion.button
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setSelected(msg); setReplySubject(`Re: ${msg.subject || 'Contact Form Message'}`) }}
                className="w-full text-left rounded-2xl p-5 transition-all"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{msg.email}</span>
                      {msg.replied === 1 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>Replied</span>
                      )}
                    </div>
                    {msg.subject && <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{msg.subject}</p>}
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{msg.message}</p>
                  </div>
                  <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
