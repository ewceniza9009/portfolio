import { useState, useEffect } from 'react'
import { Save, Plus, X } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function AboutTab() {
  const [title, setTitle] = useState('About Me')
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    try {
      await apiFetch('/api/about', {
        method: 'POST',
        body: JSON.stringify({ title, paragraphs })
      })
      alert('Saved!')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="col-span-12 overflow-y-auto custom-scrollbar h-full">
      <div className="p-4 md:p-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">About Section</h2>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Section Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Paragraphs</label>
              <button onClick={() => setParagraphs([...paragraphs, ''])}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                <Plus size={12} /> Add Paragraph
              </button>
            </div>
            <div className="space-y-3">
              {paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <textarea value={p} onChange={e => { const next = [...paragraphs]; next[i] = e.target.value; setParagraphs(next) }}
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm resize-y"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  <button onClick={() => setParagraphs(paragraphs.filter((_, j) => j !== i))}
                    className="self-start mt-1 p-1 rounded hover:bg-red-500/20 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
