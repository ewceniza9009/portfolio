import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { apiFetch } from '../../utils/api'
import MarkdownEditor from '../MarkdownEditor'

export default function AboutTab() {
  const [title, setTitle] = useState('About Me')
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    apiFetch('/api/about')
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || 'About Me')
        setParagraphs(data.paragraphs || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage('')
    try {
      await apiFetch('/api/about', {
        method: 'POST',
        body: JSON.stringify({ title, paragraphs })
      })
      setSaveMessage('Successfully saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('Failed to save.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }



  if (loading) return <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="col-span-12 overflow-y-auto custom-scrollbar h-full relative">
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-10 flex justify-between items-center px-4 md:px-6 py-3 border-b backdrop-blur-md"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>About Me</h3>
          {saveMessage && (
            <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: saveMessage.includes('Failed') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: saveMessage.includes('Failed') ? '#ef4444' : '#22c55e' }}>
              {saveMessage}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Title Input */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Section Title
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-blue-500/50 outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            placeholder="e.g. About Me"
          />
        </div>

        {/* Paragraphs */}
        <div className="p-5 rounded-xl border space-y-4" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                About Paragraphs (Separate with double newlines)
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <MarkdownEditor 
                value={paragraphs.join('\n\n')} 
                onChange={val => setParagraphs(val.split('\n\n').filter(p => p.trim() !== ''))} 
                height="300px"
                showToolbar={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
