import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function AboutTab() {
  const [title, setTitle] = useState('About Me')
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
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

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const newParagraphs = [...paragraphs]
    const [moved] = newParagraphs.splice(dragIndex, 1)
    newParagraphs.splice(index, 0, moved)
    setParagraphs(newParagraphs)
    setDragIndex(null)
    setDragOverIndex(null)
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
          style={{ background: 'var(--accent)', color: '#fff' }}
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
                About Paragraphs
              </label>
              <div className="group relative">
                <AlertCircle size={12} style={{ color: 'var(--text-muted)' }} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 text-[10px] rounded border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Drag items by the grip icon to reorder them.
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setParagraphs([...paragraphs, ''])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              <Plus size={12} /> Add Paragraph
            </button>
          </div>

          <div className="space-y-3">
            {paragraphs.length === 0 && (
              <div className="text-center py-8 text-sm italic" style={{ color: 'var(--text-muted)' }}>
                No paragraphs added yet. Click "Add Paragraph" to start.
              </div>
            )}

            {paragraphs.map((p, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                className={`flex gap-3 p-3 rounded-lg border transition-all duration-200 group ${dragOverIndex === i ? 'border-[var(--accent)] scale-[1.01]' : ''}`}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: dragOverIndex === i ? 'var(--accent)' : 'var(--border)',
                  opacity: dragIndex === i ? 0.4 : 1
                }}
              >
                <div className="pt-2 cursor-grab active:cursor-grabbing">
                  <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                
                <textarea
                  value={p}
                  onChange={e => {
                    const next = [...paragraphs];
                    next[i] = e.target.value;
                    setParagraphs(next)
                  }}
                  rows={4}
                  placeholder={`Paragraph ${i + 1}...`}
                  className="flex-1 w-full bg-transparent border-none p-0 text-sm resize-y outline-none focus:ring-0"
                  style={{ color: 'var(--text-primary)' }}
                />

                <div className="flex flex-col justify-start">
                  <button
                    onClick={() => setParagraphs(paragraphs.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}
                    title="Remove Paragraph"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
