import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function AwardsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await apiFetch('/api/awards')
      setItems(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleEdit = (item: any) => { setEditingId(item.id); setFormData({ ...item }) }

  const handleCreate = () => {
    setEditingId(0)
    setFormData({ title: '', date: '', company: '', description: '', image: '', display_order: items.length })
  }

  const handleSave = async () => {
    try {
      if (editingId === 0) {
        await apiFetch('/api/awards', { method: 'POST', body: JSON.stringify(formData) })
      } else {
        await apiFetch(`/api/awards/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) })
      }
      setEditingId(null)
      fetchData()
    } catch { alert('Failed to save') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this award?')) return
    await apiFetch(`/api/awards/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (dragOverIndex !== index) setDragOverIndex(index) }
  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return }
    const reordered = [...items]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    setItems(reordered)
    setDragIndex(null)
    setDragOverIndex(null)
    try {
      await apiFetch('/api/awards/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: reordered.map((item, i) => ({ id: item.id, display_order: i })) })
      })
    } catch { alert('Failed to reorder') }
  }

  if (loading) return <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="col-span-12 overflow-y-auto custom-scrollbar h-full">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Awards</h2>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {editingId !== null && formData && (
          <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent)' }}>
            <div className="grid grid-cols-2 gap-3">
              {(['title', 'date', 'company', 'image'] as const).map(f => (
                <div key={f}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{f}</label>
                  <input value={formData[f] || ''} onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border text-sm"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
                className="w-full px-3 py-1.5 rounded border text-sm resize-y"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}><Save size={12} /> Save</button>
              <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><X size={12} /> Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id}
              draggable onDragStart={() => handleDragStart(index)} onDragOver={e => handleDragOver(e, index)} onDrop={() => handleDrop(index)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${dragOverIndex === index ? 'border-[var(--accent)]' : ''}`}
              style={{ background: 'var(--bg-card)', borderColor: dragOverIndex === index ? 'var(--accent)' : 'var(--border)', opacity: dragIndex === index ? 0.5 : 1 }}>
              <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{item.title}</div>
                <div className="text-xs" style={{ color: 'var(--accent)' }}>{item.company}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.date}</div>
              </div>
              <button onClick={() => handleEdit(item)} className="p-1.5 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary)' }}><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-500/20" style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
