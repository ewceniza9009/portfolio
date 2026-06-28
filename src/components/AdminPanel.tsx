import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Send, Loader, LogOut, 
  ArrowLeft, Search, Sparkles, Check, Copy, Inbox, 
  Lock, RefreshCw, CheckCircle2, ChevronDown, Cpu,
  Trash2, Edit, Plus, FileText, Eye, Heart, Settings, BarChart3
} from 'lucide-react'
import { parseMarkdown } from '../utils/markdown'
import { ACCENT_THEMES, type AccentKey } from '../data/accents'
import Logo from './Logo'
import { Link } from 'react-router-dom'

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

interface Blog {
  id: string
  slug: string
  title: string
  content: string
  summary: string | null
  tags: string | null
  published: number
  likes: number
  read_time: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  blog_id: string
  author_name: string
  author_email: string | null
  content: string
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

interface AdminPanelProps {
  theme: 'dark' | 'light'
  accent: AccentKey
}

function AdminPanel({ theme, accent }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(getSafeItem('admin_token'))
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  // Dashboard Tab selection
  const [activeTab, setActiveTab] = useState<'messages' | 'blogs' | 'settings' | 'analytics'>('messages')

  // ── Tab 1: Messages State ──
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'unreplied' | 'replied'>('all')
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiModel, setAiModel] = useState('gemini-2.5-flash')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  // ── Tab 2: Blogs State ──
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [blogSearchQuery, setBlogSearchQuery] = useState('')
  const [blogFilterTab, setBlogFilterTab] = useState<'all' | 'drafts' | 'published'>('all')
  
  // Blog Form Fields
  const [blogTitle, setBlogTitle] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [blogContent, setBlogContent] = useState('')
  const [blogSummary, setBlogSummary] = useState('')
  const [blogTags, setBlogTags] = useState('')
  const [blogPublished, setBlogPublished] = useState(false)
  const [blogReadTime, setBlogReadTime] = useState('')
  const [blogCoverImage, setBlogCoverImage] = useState('')
  const [blogComments, setBlogComments] = useState<Comment[]>([])
  
  const [blogEditorTab, setBlogEditorTab] = useState<'edit' | 'preview'>('edit')
  const [isNewBlog, setIsNewBlog] = useState(false)
  const [blogAiPrompt, setBlogAiPrompt] = useState('')
  const [blogAiLoading, setBlogAiLoading] = useState(false)
  const [blogSaving, setBlogSaving] = useState(false)
  const [blogDeleting, setBlogDeleting] = useState(false)
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(null)

  // ── Visitor Analytics State ──
  const [visitors, setVisitors] = useState<any[]>([])
  const [dailyVisits, setDailyVisits] = useState<any[]>([])
  const [hourlyVisits, setHourlyVisits] = useState<any[]>([])
  const [visitorLoading, setVisitorLoading] = useState(false)

  function parseUA(ua: string) {
    const isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const isTablet = /Tablet|iPad|PlayBook|Silk/i.test(ua) && !isMobile
    const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
    let browser = 'Other'
    if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome'
    else if (/Firefox/i.test(ua)) browser = 'Firefox'
    else if (/Safari/i.test(ua) && !/Chrome|Edg/i.test(ua)) browser = 'Safari'
    else if (/Edg/i.test(ua)) browser = 'Edge'
    else if (/OPR/i.test(ua)) browser = 'Opera'
    let os = 'Other'
    if (/Windows/i.test(ua)) os = 'Windows'
    else if (/Mac OS|macOS/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) os = 'macOS'
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
    else if (/Android/i.test(ua)) os = 'Android'
    else if (/Linux/i.test(ua)) os = 'Linux'
    return { device, browser, os }
  }

  function processUAStats(visitors: any[]) {
    const deviceCount: Record<string, number> = {}
    const browserCount: Record<string, number> = {}
    const osCount: Record<string, number> = {}
    visitors.forEach((v: any) => {
      const parsed = parseUA(v.user_agent || '')
      deviceCount[parsed.device] = (deviceCount[parsed.device] || 0) + Number(v.visit_count || 1)
      browserCount[parsed.browser] = (browserCount[parsed.browser] || 0) + Number(v.visit_count || 1)
      osCount[parsed.os] = (osCount[parsed.os] || 0) + Number(v.visit_count || 1)
    })
    return { deviceCount, browserCount, osCount }
  }

  function processCountryStats(visitors: any[]) {
    const countryCount: Record<string, number> = {}
    visitors.forEach((v: any) => {
      const country = v.country || 'Unknown'
      countryCount[country] = (countryCount[country] || 0) + Number(v.visit_count || 1)
    })
    return Object.entries(countryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  // ── Tab 3: System Settings State ──
  const [defaultTheme, setDefaultTheme] = useState<'dark' | 'light' | null>(() => {
    const saved = getSafeItem('default_theme')
    return saved === 'light' || saved === 'dark' ? saved : null
  })
  const [defaultAccent, setDefaultAccent] = useState<string | null>(() => {
    const saved = getSafeItem('default_accent')
    return saved && saved in ACCENT_THEMES ? saved : null
  })
  const [rotationThemeEnabled, setRotationThemeEnabled] = useState(() => {
    return getSafeItem('rotation_theme_enabled') !== 'false'
  })
  const [rotationAccentEnabled, setRotationAccentEnabled] = useState(() => {
    return getSafeItem('rotation_accent_enabled') === 'true'
  })
  const [rotationIntervalHours, setRotationIntervalHours] = useState(() => {
    return Number(getSafeItem('rotation_interval_hours') || '2')
  })

  const saveSettings = async (updates: Record<string, string>) => {
    try {
      await api('/api/settings', {
        method: 'POST',
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  const toggleRotationTheme = async () => {
    const nextVal = !rotationThemeEnabled
    setRotationThemeEnabled(nextVal)
    setSafeItem('rotation_theme_enabled', String(nextVal))
    if (nextVal) {
      removeSafeItem('theme')
    }
    await saveSettings({ 
      rotation_theme_enabled: String(nextVal),
      ...(nextVal ? { theme: '' } : {})
    })
  }

  const toggleRotationAccent = async () => {
    const nextVal = !rotationAccentEnabled
    setRotationAccentEnabled(nextVal)
    setSafeItem('rotation_accent_enabled', String(nextVal))
    if (nextVal) {
      removeSafeItem('accent')
    }
    await saveSettings({ 
      rotation_accent_enabled: String(nextVal),
      ...(nextVal ? { accent: '' } : {})
    })
  }

  const handleIntervalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(24, Number(e.target.value) || 2))
    setRotationIntervalHours(val)
    setSafeItem('rotation_interval_hours', String(val))
    await saveSettings({ rotation_interval_hours: String(val) })
  }

  const fetchVisitors = useCallback(async () => {
    setVisitorLoading(true)
    try {
      const res = await api('/api/visitors')
      if (res.ok) {
        const data = await res.json()
        setVisitors(data.visitors || [])
        setDailyVisits(data.daily || [])
        setHourlyVisits(data.hourly || [])
      }
    } catch (err) {
      console.error('Failed to fetch visitors:', err)
    } finally {
      setVisitorLoading(false)
    }
  }, [])

  const exportCSV = useCallback(async () => {
    try {
      const res = await api('/api/visitors/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'visitors.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('CSV export failed:', err)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'settings' || activeTab === 'analytics') {
      fetchVisitors()
    }
  }, [activeTab, fetchVisitors])

  const handleDefaultThemeChange = async (val: string) => {
    if (val === 'dark' || val === 'light') {
      setDefaultTheme(val)
      setSafeItem('default_theme', val)
      setRotationThemeEnabled(false)
      setSafeItem('rotation_theme_enabled', 'false')
      await saveSettings({ default_theme: val, rotation_theme_enabled: 'false' })
    } else {
      setDefaultTheme(null)
      removeSafeItem('default_theme')
      setRotationThemeEnabled(true)
      setSafeItem('rotation_theme_enabled', 'true')
      await saveSettings({ default_theme: '', rotation_theme_enabled: 'true' })
    }
  }

  const handleDefaultAccentChange = async (val: string) => {
    if (val && val !== 'auto') {
      setDefaultAccent(val)
      setSafeItem('default_accent', val)
      setRotationAccentEnabled(false)
      setSafeItem('rotation_accent_enabled', 'false')
      await saveSettings({ default_accent: val, rotation_accent_enabled: 'false' })
    } else {
      setDefaultAccent(null)
      removeSafeItem('default_accent')
      setRotationAccentEnabled(true)
      setSafeItem('rotation_accent_enabled', 'true')
      await saveSettings({ default_accent: '', rotation_accent_enabled: 'true' })
    }
  }

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
    setBlogs([])
    setSelectedBlog(null)
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

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const res = await api('/api/admin/blogs')
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      setBlogs(data)
    } catch (err) {
      console.error('Failed to fetch blogs:', err)
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

  const fetchSettings = async () => {
    try {
      const res = await api('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.default_theme !== undefined) {
          const val = data.default_theme
          if (val === 'dark' || val === 'light') {
            setDefaultTheme(val)
            setSafeItem('default_theme', val)
          } else {
            setDefaultTheme(null)
            removeSafeItem('default_theme')
          }
        }
        if (data.default_accent !== undefined) {
          const val = String(data.default_accent)
          if (val && val in ACCENT_THEMES) {
            setDefaultAccent(val)
            setSafeItem('default_accent', val)
          } else {
            setDefaultAccent(null)
            removeSafeItem('default_accent')
          }
        }
        if (data.rotation_theme_enabled !== undefined) {
          setRotationThemeEnabled(data.rotation_theme_enabled === 'true')
        }
        if (data.rotation_accent_enabled !== undefined) {
          setRotationAccentEnabled(data.rotation_accent_enabled === 'true')
        }
        if (data.rotation_interval_hours !== undefined) {
          setRotationIntervalHours(Number(data.rotation_interval_hours))
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  useEffect(() => {
    if (token) { 
      fetchMessages()
      fetchBlogs()
      fetchModels() 
      fetchSettings()
    }
  }, [token])

  const refreshData = () => {
    if (activeTab === 'messages') {
      fetchMessages()
    } else if (activeTab === 'blogs') {
      fetchBlogs()
    } else {
      fetchSettings()
    }
  }

  // ── Tab 1: Messages Handlers ──
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

  // ── Tab 2: Blogs Handlers ──
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleBlogTitleChange = (val: string) => {
    setBlogTitle(val)
    if (isNewBlog) {
      setBlogSlug(slugify(val))
    }
  }

  const handleSelectBlog = async (blog: Blog) => {
    setIsNewBlog(false)
    setSelectedBlog(blog)
    setBlogTitle(blog.title)
    setBlogSlug(blog.slug)
    setBlogContent(blog.content)
    setBlogSummary(blog.summary || '')
    setBlogTags(blog.tags || '')
    setBlogPublished(blog.published === 1)
    setBlogReadTime(blog.read_time || '')
    setBlogCoverImage(blog.cover_image || '')
    setBlogEditorTab('edit')
    setBlogAiPrompt('')

    // Fetch comments for moderation
    try {
      const res = await api(`/api/blogs/${blog.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setBlogComments(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleNewBlog = () => {
    setIsNewBlog(true)
    const tempId = `new-${Date.now()}`
    const emptyBlog: Blog = {
      id: tempId,
      slug: '',
      title: '',
      content: '',
      summary: '',
      tags: '',
      published: 0,
      likes: 0,
      read_time: '5 min read',
      cover_image: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSelectedBlog(emptyBlog)
    setBlogTitle('')
    setBlogSlug('')
    setBlogContent('')
    setBlogSummary('')
    setBlogTags('')
    setBlogPublished(false)
    setBlogReadTime('5 min read')
    setBlogCoverImage('')
    setBlogComments([])
    setBlogEditorTab('edit')
    setBlogAiPrompt('')
  }

  const handleSaveBlog = async () => {
    if (!blogTitle || !blogSlug || !blogContent) return
    setBlogSaving(true)
    
    const blogData = {
      title: blogTitle,
      slug: blogSlug,
      content: blogContent,
      summary: blogSummary,
      tags: blogTags,
      published: blogPublished ? 1 : 0,
      read_time: blogReadTime,
      cover_image: blogCoverImage
    }

    try {
      if (isNewBlog) {
        const res = await api('/api/admin/blogs', {
          method: 'POST',
          body: JSON.stringify(blogData)
        })
        if (!res.ok) {
          const err = await res.json()
          alert(err.error || 'Failed to create blog post')
          return
        }
        await res.json()
        setIsNewBlog(false)
        await fetchBlogs()
        // Select the newly created blog by matching its slug
        const resBlogs = await api('/api/admin/blogs')
        const allBlogs = await resBlogs.json()
        const match = allBlogs.find((b: Blog) => b.slug === blogSlug)
        if (match) handleSelectBlog(match)
      } else {
        const res = await api(`/api/admin/blogs/${selectedBlog!.id}`, {
          method: 'PUT',
          body: JSON.stringify(blogData)
        })
        if (!res.ok) {
          const err = await res.json()
          alert(err.error || 'Failed to update blog post')
          return
        }
        await fetchBlogs()
        // Update selected blog reference
        setSelectedBlog(prev => prev ? { ...prev, ...blogData } : null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBlogSaving(false)
    }
  }

  const handleDeleteBlog = async () => {
    if (!selectedBlog || isNewBlog) return
    if (!window.confirm(`Are you sure you want to delete the blog "${blogTitle}"?`)) return
    
    setBlogDeleting(true)
    try {
      const res = await api(`/api/admin/blogs/${selectedBlog.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setSelectedBlog(null)
        await fetchBlogs()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBlogDeleting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    setCommentDeletingId(commentId)
    try {
      const res = await api(`/api/admin/comments/${commentId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setBlogComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCommentDeletingId(null)
    }
  }

  const handleBlogAiCompose = async (mode: 'outline' | 'polish' | 'summary' | 'write') => {
    if (mode !== 'outline' && mode !== 'write' && !blogContent) return
    if (mode === 'outline' && !blogTitle) {
      alert('Please specify a blog title first.')
      return
    }

    setBlogAiLoading(true)
    try {
      const res = await api('/api/admin/blogs/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: blogAiPrompt || (mode === 'write' ? 'Write a section about full-stack architectures' : ''),
          content: blogContent,
          title: blogTitle,
          mode: mode
        })
      })
      if (!res.ok) throw new Error('AI generation failed')
      const data = await res.json()
      
      if (mode === 'summary') {
        setBlogSummary(data.result)
      } else if (mode === 'outline') {
        setBlogContent(prev => prev ? `${prev}\n\n${data.result}` : data.result)
      } else if (mode === 'polish') {
        setBlogContent(data.result)
      } else {
        setBlogContent(prev => prev ? `${prev}\n\n${data.result}` : data.result)
      }
      setBlogAiPrompt('')
    } catch (err) {
      console.error(err)
    } finally {
      setBlogAiLoading(false)
    }
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

  // Filter blogs dynamically
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      (blog.summary && blog.summary.toLowerCase().includes(blogSearchQuery.toLowerCase())) ||
      (blog.tags && blog.tags.toLowerCase().includes(blogSearchQuery.toLowerCase()))

    if (blogFilterTab === 'drafts') return matchesSearch && blog.published === 0
    if (blogFilterTab === 'published') return matchesSearch && blog.published === 1
    return matchesSearch
  })

  // Count summaries
  const inboxCount = messages.filter(m => m.replied === 0).length
  const repliedCount = messages.filter(m => m.replied === 1).length
  
  const draftCount = blogs.filter(b => b.published === 0).length
  const publishedCount = blogs.filter(b => b.published === 1).length

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

  return (
    <div className="min-h-screen flex flex-col transition-all duration-300" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Dashboard Header */}
      <header className="border-b px-3 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-30 glass shadow-sm gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href="/"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
          </a>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center hover:opacity-85 transition-opacity duration-200">
              <Logo size={24} className="flex-shrink-0" />
            </Link>
            <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-60 border-l pl-2 ml-1" style={{ borderColor: 'var(--border)' }}>Dashboard</span>
          </div>
          <div className="flex items-center gap-2 ml-auto md:hidden">
            <button
              onClick={refreshData}
              disabled={loading}
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <LogOut size={11} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-xl border overflow-x-auto w-full md:w-auto flex-nowrap" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => { setActiveTab('messages'); setSelected(null); setSelectedBlog(null); }}
            className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
            style={{ 
              background: activeTab === 'messages' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'messages' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            <MessageSquare size={11} />
            <span className="hidden sm:inline">Inquiries</span>
            {inboxCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
          </button>
          <button
            onClick={() => { setActiveTab('blogs'); setSelected(null); setSelectedBlog(null); }}
            className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
            style={{ 
              background: activeTab === 'blogs' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'blogs' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            <FileText size={11} />
            <span className="hidden sm:inline">Blogs</span>
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSelected(null); setSelectedBlog(null); }}
            className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
            style={{ 
              background: activeTab === 'settings' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'settings' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            <Settings size={11} />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            onClick={() => { setActiveTab('analytics'); setSelected(null); setSelectedBlog(null); }}
            className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
            style={{ 
              background: activeTab === 'analytics' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            <BarChart3 size={11} />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>

        {/* Header Right Actions (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={refreshData}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 h-[calc(100vh-var(--header-h,80px))] overflow-y-auto md:overflow-hidden" style={{ '--header-h': activeTab === 'analytics' || activeTab === 'settings' ? '140px' : '80px' } as any}>
        <div className="grid grid-cols-1 gap-3 md:gap-6 h-full items-stretch md:grid-cols-12">
          
          {/* TAB 1: MESSAGES DASHBOARD */}
          {activeTab === 'messages' && (
            <>
              {/* Left Column: Messages List */}
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
                            >
                              {copiedEmail ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{formatDate(selected.created_at)}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      <div className="p-5 rounded-2xl border flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted" style={{ color: 'var(--text-secondary)' }}>Original Inquiry</span>
                          {selected.subject && <span className="text-xs font-semibold">Subject: {selected.subject}</span>}
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                      </div>

                      {selected.replied === 1 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 rounded-2xl border flex flex-col" 
                          style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}
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

                      <div className="space-y-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {selected.replied === 1 ? 'Send Follow-up Reply' : 'Compose Reply'}
                          </span>
                        </div>
                        
                        <div className="p-5 rounded-2xl border" style={{ background: 'var(--accent-secondary-dim)', borderColor: 'rgba(204, 160, 61, 0.15)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>AI Copilot Autocomposer</span>
                            </div>
                            
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
                                    <div className="fixed inset-0 z-30" onClick={() => setModelDropdownOpen(false)} />
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute right-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl p-1 w-48 overflow-hidden"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                                    >
                                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 p-0.5 font-sans">
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
                  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                    <Inbox size={48} className="mb-4 opacity-25 animate-pulse" style={{ color: 'var(--accent)' }} />
                    <h4 className="text-sm font-bold mb-1">Select an Inquiry</h4>
                    <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Click on a card from the left panel to review developer inquiries, copy addresses, and compose AI-assisted replies.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: BLOGS DASHBOARD */}
          {activeTab === 'blogs' && (
            <>
              {/* Left Column: Blogs List */}
              <div className={`md:col-span-4 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selectedBlog ? 'hidden md:flex' : 'flex'}`}
                   style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                
                {/* Search, Filter & New Post button */}
                <div className="p-4 border-b space-y-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={handleNewBlog}
                    className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98] shadow-md flex items-center justify-center gap-2 select-none"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    <Plus size={14} /> New Post
                  </button>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={blogSearchQuery}
                      onChange={e => setBlogSearchQuery(e.target.value)}
                      placeholder="Search blogs..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    />
                  </div>

                  {/* Filtering tabs */}
                  <div className="flex p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    {(['all', 'drafts', 'published'] as const).map(tab => {
                      const active = blogFilterTab === tab
                      const count = 
                        tab === 'all' ? blogs.length : 
                        tab === 'drafts' ? draftCount : 
                        publishedCount
                      return (
                        <button
                          key={tab}
                          onClick={() => setBlogFilterTab(tab)}
                          className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{ 
                            background: active ? 'var(--accent)' : 'transparent',
                            color: active ? 'var(--bg-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          {tab === 'all' ? 'All' : tab === 'drafts' ? 'Drafts' : 'Live'}
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
                      <span className="text-xs">Loading records...</span>
                    </div>
                  ) : filteredBlogs.length === 0 ? (
                    <div className="text-center py-20">
                      <FileText size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No articles found.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredBlogs.map(blog => {
                        const active = selectedBlog?.id === blog.id
                        const isNew = blog.id.startsWith('new-')
                        return (
                          <motion.button
                            key={blog.id}
                            layoutId={`blog-${blog.id}`}
                            onClick={() => handleSelectBlog(blog)}
                            className="w-full text-left rounded-xl p-4 transition-all relative border outline-none select-none flex flex-col"
                            style={{ 
                              background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
                              borderColor: active ? 'var(--accent)' : isNew ? 'dashed var(--border)' : 'transparent',
                            }}
                            whileHover={{ scale: active ? 1 : 1.01 }}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-bold text-xs truncate max-w-[170px]" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {blog.title || <span className="italic opacity-50">Untitled Post</span>}
                              </span>
                              <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                {isNew ? 'New Draft' : formatDate(blog.created_at).split(',')[0]}
                              </span>
                            </div>
                            
                            <p className="text-[10px] truncate opacity-70 mb-2" style={{ color: 'var(--text-muted)' }}>
                              {blog.summary || <span className="italic opacity-40">No summary provided</span>}
                            </p>

                            <div className="flex items-center justify-between w-full mt-1">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider" 
                                    style={{ 
                                      background: blog.published === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: blog.published === 1 ? '#10b981' : '#f59e0b'
                                    }}>
                                {blog.published === 1 ? 'Published' : 'Draft'}
                              </span>
                              {!isNew && (
                                <span className="text-[9px] flex items-center gap-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                                  <Heart size={10} className="text-red-500 fill-current" />
                                  {blog.likes} likes
                                </span>
                              )}
                            </div>
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Right Column: Blog Creator / Editor Panel */}
              <div className={`md:col-span-8 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selectedBlog ? 'flex' : 'hidden md:flex'}`}
                   style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                {selectedBlog ? (
                  <div className="flex-1 flex flex-col overflow-hidden h-full">
                    {/* Header bar */}
                    <div className="px-5 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedBlog(null)}
                          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <div>
                          <h3 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">
                            {isNewBlog ? 'New Post Creator' : `Editing: ${blogTitle}`}
                          </h3>
                        </div>
                      </div>

                      {/* Edit / Preview Tabs */}
                      <div className="flex p-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                        <button
                          onClick={() => setBlogEditorTab('edit')}
                          className="px-3 py-1 rounded flex items-center gap-1"
                          style={{ 
                            background: blogEditorTab === 'edit' ? 'var(--accent)' : 'transparent',
                            color: blogEditorTab === 'edit' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          <Edit size={10} /> Edit
                        </button>
                        <button
                          onClick={() => setBlogEditorTab('preview')}
                          className="px-3 py-1 rounded flex items-center gap-1"
                          style={{ 
                            background: blogEditorTab === 'preview' ? 'var(--accent)' : 'transparent',
                            color: blogEditorTab === 'preview' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          <Eye size={10} /> Live Preview
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Form Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      
                      {blogEditorTab === 'edit' ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Article Title *</label>
                              <input
                                type="text"
                                value={blogTitle}
                                onChange={e => handleBlogTitleChange(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-xs border"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="Enter an engaging title..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">URL Slug *</label>
                              <input
                                type="text"
                                value={blogSlug}
                                onChange={e => setBlogSlug(slugify(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl text-xs border font-mono"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="my-slug-path"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={blogTags}
                                onChange={e => setBlogTags(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-xs border"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="React, TypeScript, CSS"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Reading Time</label>
                              <input
                                type="text"
                                value={blogReadTime}
                                onChange={e => setBlogReadTime(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-xs border"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="5 min read"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Cover Image URL</label>
                              <input
                                type="text"
                                value={blogCoverImage}
                                onChange={e => setBlogCoverImage(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-xs border"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="https://..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Excerpt / Brief Summary</label>
                            <input
                              type="text"
                              value={blogSummary}
                              onChange={e => setBlogSummary(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl text-xs border"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                              placeholder="Brief summary displayed in the search feed cards..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Markdown Body Content *</label>
                            <textarea
                              value={blogContent}
                              onChange={e => setBlogContent(e.target.value)}
                              rows={15}
                              className="w-full px-4 py-3 rounded-xl text-xs font-mono resize-y border custom-scrollbar"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                              placeholder="Write your article in Markdown syntax (# headers, **bold**, lists, ```code blocks)..."
                            />
                          </div>

                          {/* AI Copilot Writing Panel */}
                          <div className="p-5 rounded-2xl border" style={{ background: 'var(--accent-secondary-dim)', borderColor: 'rgba(204, 160, 61, 0.15)' }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>AI Blog Copilot (Gemini)</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3 select-none">
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose('outline')}
                                disabled={blogAiLoading}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)]"
                              >
                                Generate Outline
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose('polish')}
                                disabled={blogAiLoading || !blogContent}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)] disabled:opacity-50"
                              >
                                Polish Content
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose('summary')}
                                disabled={blogAiLoading || !blogContent}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)] disabled:opacity-50"
                              >
                                Summarize Summary
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={blogAiPrompt}
                                onChange={e => setBlogAiPrompt(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs border"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                placeholder="Type manual instructions for custom section drafting..."
                              />
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose('write')}
                                disabled={blogAiLoading || !blogAiPrompt}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--bg-primary)] disabled:opacity-60 shrink-0 min-w-[80px]"
                              >
                                {blogAiLoading ? <Loader size={12} className="animate-spin" /> : 'Write'}
                              </button>
                            </div>
                          </div>

                          {/* Published Status Toggle */}
                          <div className="flex items-center gap-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={blogPublished}
                                onChange={e => setBlogPublished(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                              />
                              <span className="text-xs font-semibold">Publish Post (visible on public `/blogs` page)</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        /* Live Preview */
                        <div className="prose max-w-none p-5 rounded-3xl border select-text" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                          <h1 className="text-3xl font-bold mb-4">{blogTitle || 'Untitled Article'}</h1>
                          <div className="flex items-center gap-4 text-xs opacity-60 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <span>Read time: {blogReadTime || '5 min read'}</span>
                            {blogTags && <span>Tags: {blogTags}</span>}
                          </div>
                          
                          {blogContent ? (
                            parseMarkdown(blogContent, theme, accent)
                          ) : (
                            <p className="italic text-center text-xs opacity-50 py-10">No markdown content written yet.</p>
                          )}
                        </div>
                      )}

                      {/* Comments Moderation Panel (Underneath the editor, only if post exists in DB) */}
                      {!isNewBlog && (
                        <div className="pt-8 border-t border-dashed space-y-4" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Comment Moderation ({blogComments.length})</span>
                          </div>

                          {blogComments.length === 0 ? (
                            <p className="text-xs italic opacity-40">No comments posted on this article.</p>
                          ) : (
                            <div className="space-y-3">
                              {blogComments.map(comment => (
                                <div key={comment.id} className="p-4 rounded-xl border flex items-start justify-between gap-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold">{comment.author_name}</span>
                                      {comment.author_email && (
                                        <span className="text-[10px]" style={{ color: 'var(--accent)' }}>({comment.author_email})</span>
                                      )}
                                      <span className="text-[9px] opacity-55">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <p className="text-xs opacity-90 select-text leading-relaxed">{comment.content}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    disabled={commentDeletingId === comment.id}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 shrink-0"
                                    title="Delete Comment"
                                  >
                                    {commentDeletingId === comment.id ? (
                                      <Loader size={12} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={13} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Footer Actions */}
                    <div className="px-5 py-4 border-t flex items-center justify-between shrink-0 select-none" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={handleDeleteBlog}
                        disabled={blogDeleting || isNewBlog}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-red-500/10 hover:border-red-500/30 text-red-500 disabled:opacity-30"
                      >
                        {blogDeleting ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete Post
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveBlog}
                        disabled={blogSaving || !blogTitle || !blogSlug || !blogContent}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--bg-primary)',
                          opacity: blogSaving || !blogTitle || !blogSlug || !blogContent ? 0.6 : 1
                        }}
                      >
                        {blogSaving && <Loader size={12} className="animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                    <FileText size={48} className="mb-4 opacity-25 animate-pulse" style={{ color: 'var(--accent)' }} />
                    <h4 className="text-sm font-bold mb-1">Select an Article</h4>
                    <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Click on a blog post to modify its content, manage comments, or compose layouts with AI assist. Click "New Post" to create a new draft.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="col-span-12 flex flex-col h-full rounded-2xl border overflow-hidden"
                 style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
              
              <div className="p-6 border-b shrink-0 flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <Settings size={18} style={{ color: 'var(--accent)' }} />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">System Rotation Settings</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Configure automatic theme and accent rotation schedules for your portfolio</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Section 1: Default Theme */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                  <div className="md:col-span-8 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Default Theme</h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Set a fixed fallback theme. Selecting a specific theme disables automatic rotation.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleDefaultThemeChange('auto')}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95"
                      style={{
                        background: defaultTheme === null ? 'var(--accent-dim)' : 'transparent',
                        borderColor: defaultTheme === null ? 'var(--accent)' : 'var(--border)',
                        color: defaultTheme === null ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => handleDefaultThemeChange('dark')}
                      className="px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95"
                      style={{
                        background: defaultTheme === 'dark' ? 'var(--accent-dim)' : 'transparent',
                        borderColor: defaultTheme === 'dark' ? 'var(--accent)' : 'var(--border)',
                        color: defaultTheme === 'dark' ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => handleDefaultThemeChange('light')}
                      className="px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95"
                      style={{
                        background: defaultTheme === 'light' ? 'var(--accent-dim)' : 'transparent',
                        borderColor: defaultTheme === 'light' ? 'var(--accent)' : 'var(--border)',
                        color: defaultTheme === 'light' ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      Light
                    </button>
                  </div>
                </div>

                {/* Section 2: Default Accent Color */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                  <div className="md:col-span-8 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Default Accent Color</h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Set a fixed fallback accent. Selecting a specific accent disables automatic rotation.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <select
                      value={defaultAccent === null ? 'auto' : defaultAccent}
                      onChange={(e) => handleDefaultAccentChange(e.target.value)}
                      className="w-full max-w-[160px] px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    >
                      <option value="auto">Auto (Rotation)</option>
                      {Object.entries(ACCENT_THEMES).map(([key, theme]) => (
                        <option key={key} value={key}>{theme.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 3: Theme Rotation Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                  <div className="md:col-span-8 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Automatic Theme Rotation</h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Automatically alternate the portfolio website between Light and Dark mode based on the current hour.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      onClick={toggleRotationTheme}
                      className="px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-2"
                      style={{
                        background: rotationThemeEnabled ? 'var(--accent-dim)' : 'transparent',
                        borderColor: rotationThemeEnabled ? 'var(--accent)' : 'var(--border)',
                        color: rotationThemeEnabled ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      {rotationThemeEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Section 2: Accent Color Rotation Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                  <div className="md:col-span-8 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Automatic Accent Color Rotation</h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Automatically cycle between different branding accent colors (Gold, Blue, Emerald, Crimson, etc.) across the website.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      onClick={toggleRotationAccent}
                      className="px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-2"
                      style={{
                        background: rotationAccentEnabled ? 'var(--accent-dim)' : 'transparent',
                        borderColor: rotationAccentEnabled ? 'var(--accent)' : 'var(--border)',
                        color: rotationAccentEnabled ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      {rotationAccentEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Section 3: Rotation Hour Interval */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                  <div className="md:col-span-8 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Rotation Time Interval (Hours)</h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Specify the frequency of automatic changes. For example, setting it to 2 will swap themes/accents every 2 hours.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex items-center justify-end gap-3">
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={rotationIntervalHours}
                      onChange={handleIntervalChange}
                      className="w-20 px-3 py-2 rounded-xl text-xs font-bold text-center border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>hours</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="col-span-12 flex flex-col rounded-2xl border overflow-hidden max-h-full" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
              
              <div className="p-4 md:p-6 border-b shrink-0 flex flex-wrap items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
                <div className="min-w-0">
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider truncate">Visitor Analytics</h3>
                  <p className="text-[9px] md:text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>Track and analyze your portfolio visitors</p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={fetchVisitors}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    disabled={visitorLoading}
                  >
                    <RefreshCw size={10} className={visitorLoading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">{visitorLoading ? 'Loading...' : 'Refresh'}</span>
                  </button>
                  <button
                    onClick={exportCSV}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-8 custom-scrollbar">
                {visitorLoading ? (
                  <div className="p-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading visitor data...</div>
                ) : visitors.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">🌐</div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No visitor data yet</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Visit your portfolio to start tracking analytics.</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      {[
                        { label: 'Unique', value: visitors.length, icon: '👤' },
                        { label: 'Total Visits', value: visitors.reduce((s: number, v: any) => s + Number(v.visit_count || 0), 0), icon: '📊' },
                        { label: "Today", value: dailyVisits.find((d: any) => d.date === new Date().toISOString().slice(0,10))?.count || 0, icon: '📅' },
                        { label: 'Yesterday', value: dailyVisits.find((d: any) => d.date === new Date(Date.now() - 86400000).toISOString().slice(0,10))?.count || 0, icon: '📆' },
                      ].map((stat, i) => (
                        <div key={i} className="rounded-xl md:rounded-2xl border p-3 md:p-5 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                          <div className="text-lg md:text-2xl mb-1 md:mb-2">{stat.icon}</div>
                          <div className="text-xl md:text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stat.value}</div>
                          <div className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider mt-0.5 md:mt-1.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Daily Visits + Peak Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {dailyVisits.length > 0 && (
                        <div className="rounded-xl md:rounded-2xl border p-3 md:p-6 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                          <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4" style={{ color: 'var(--text-muted)' }}>Daily Traffic</h4>
                          <div className="w-full" style={{ height: 160 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dailyVisits.slice(0, 14).reverse()}>
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={20} />
                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }} labelFormatter={(v: any) => String(v)} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--accent)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {hourlyVisits.length > 0 && (
                        <div className="rounded-xl md:rounded-2xl border p-3 md:p-6 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                          <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4" style={{ color: 'var(--text-muted)' }}>Peak Hours</h4>
                          <div className="w-full" style={{ height: 160 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[...hourlyVisits].reverse().slice(-24)}>
                                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'var(--text-secondary)' }} tickFormatter={(v: string) => v.slice(11, 16)} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={20} />
                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }} labelFormatter={(v: any) => String(v)} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--accent)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Country / Device / Browser */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-2xl border p-6 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>By Country</h4>
                        <div className="space-y-2">
                          {processCountryStats(visitors).slice(0, 8).map((c: any) => (
                            <div key={c.name} className="flex items-center gap-3">
                              <span className="text-[10px] w-5 font-bold" style={{ color: 'var(--accent)' }}>{c.count}</span>
                              <div className="flex-1 h-4 rounded-md" style={{ background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                <div className="h-full rounded-md" style={{ width: `${Math.min(100, (c.count / Math.max(...processCountryStats(visitors).slice(0, 8).map((x: any) => x.count))) * 100)}%`, background: 'var(--accent)' }} />
                              </div>
                              <span className="text-[10px] w-24 text-right truncate" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border p-6 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>By Device</h4>
                        <div className="space-y-2">
                          {Object.entries(processUAStats(visitors).deviceCount).sort((a: any, b: any) => b[1] - a[1]).map(([name, count]: any) => {
                            const total = Object.values(processUAStats(visitors).deviceCount).reduce((s: number, v: any) => s + v, 0) as number
                            const icons: Record<string, string> = { Desktop: '🖥', Mobile: '📱', Tablet: '📟' }
                            return (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-sm">{icons[name] || '?'}</span>
                                <span className="text-[10px] w-5 font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
                                <div className="flex-1 h-4 rounded-md" style={{ background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                  <div className="h-full rounded-md" style={{ width: `${(count / total) * 100}%`, background: 'var(--accent)' }} />
                                </div>
                                <span className="text-[10px] w-12 text-right" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="rounded-2xl border p-6 bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>By Browser</h4>
                        <div className="space-y-2">
                          {Object.entries(processUAStats(visitors).browserCount).sort((a: any, b: any) => b[1] - a[1]).map(([name, count]: any) => {
                            const total = Object.values(processUAStats(visitors).browserCount).reduce((s: number, v: any) => s + v, 0) as number
                            return (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-[10px] w-5 font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
                                <div className="flex-1 h-4 rounded-md" style={{ background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                  <div className="h-full rounded-md" style={{ width: `${(count / total) * 100}%`, background: 'var(--accent)' }} />
                                </div>
                                <span className="text-[10px] w-16 text-right truncate" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Visitor Log Table */}
                    <div className="rounded-2xl border overflow-hidden bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider p-5 pb-0" style={{ color: 'var(--text-muted)' }}>Visitor Log</h4>
                      <div className="overflow-x-auto p-5 pt-3">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Location</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>IP</th>
                              <th className="text-right p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Visits</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Referrer</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Ref</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>First Visit</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Last Visit</th>
                              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Device</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...visitors].sort((a: any, b: any) => Number(b.visit_count) - Number(a.visit_count)).map((v: any, i: number) => {
                              const loc = [v.city, v.region].filter(Boolean).join(', ') || (v.country || '—')
                              const pua = parseUA(v.user_agent || '')
                              let refDisplay = v.referrer || ''
                              try { refDisplay = refDisplay ? new URL(refDisplay).hostname : '' } catch {}
                              return (
                                <tr key={v.ip} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                  <td className="p-3">
                                    <span className="font-semibold">{loc}</span>
                                    {v.country && <span className="ml-1.5 opacity-60">{v.country}</span>}
                                  </td>
                                  <td className="p-3 font-mono opacity-70">{v.ip}</td>
                                  <td className="p-3 text-right font-bold" style={{ color: 'var(--accent)' }}>{v.visit_count}</td>
                                  <td className="p-3 max-w-[80px] truncate" style={{ color: 'var(--text-secondary)' }} title={v.referrer || ''}>{refDisplay || '—'}</td>
                                  <td className="p-3">
                                    {v.ref ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{v.ref}</span> : '—'}
                                  </td>
                                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{v.first_visit?.replace('T', ' ')?.slice(0, 16)}</td>
                                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{v.last_visit?.replace('T', ' ')?.slice(0, 16)}</td>
                                  <td className="p-3" style={{ color: 'var(--text-muted)' }}>
                                    <span title={`${pua.browser} / ${pua.os}`}>{pua.device}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  )
}

export default AdminPanel
