import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function ProjectsTab() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<any>(null)

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await apiFetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (p: any) => {
    setEditingId(p.id)
    setFormData({
      ...p,
      detailsStr: p.details?.join('\n') || '',
      techStr: p.tech?.join(', ') || ''
    })
  }

  const handleCreate = () => {
    setEditingId(0)
    setFormData({
      title: '', subtitle: '', description: '', year: new Date().getFullYear().toString(),
      type: 'Personal', color: '#3b82f6', repo: '', demo: '', video: '', image: '', fallback: '',
      detailsStr: '', techStr: '', display_order: projects.length
    })
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        details: formData.detailsStr.split('\n').filter((s: string) => s.trim()),
        tech: formData.techStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      }

      if (editingId === 0) {
        await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(payload) })
      } else {
        await apiFetch(`/api/projects/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      }
      setEditingId(null)
      fetchProjects()
    } catch (err) {
      console.error(err)
      alert('Failed to save')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
      fetchProjects()
    } catch (err) {
      console.error(err)
    }
  }

  // --- Drag & Drop ---
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    const newProjects = [...projects]
    const [moved] = newProjects.splice(dragIndex, 1)
    newProjects.splice(index, 0, moved)

    const updatedItems = newProjects.map((p, i) => ({ id: p.id, display_order: i }))
    setProjects(newProjects.map((p, i) => ({ ...p, display_order: i })))
    setDragIndex(null)
    setDragOverIndex(null)

    try {
      await apiFetch('/api/projects/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: updatedItems })
      })
    } catch (err) {
      console.error('Failed to reorder projects:', err)
      fetchProjects()
    }
  }

  // Shared input style
  const inputStyle = { background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
  const inputClass = "w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"

  if (loading) return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="col-span-12 p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h3>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          style={{ background: 'var(--accent-color, #3b82f6)', color: '#fff' }}
        >
          <Plus size={14} /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p, idx) => (
          <div
            key={p.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
            className="rounded-xl border relative transition-all duration-200 group"
            style={{
              borderColor: dragOverIndex === idx && dragIndex !== idx
                ? 'var(--accent-color, #3b82f6)'
                : 'var(--border-color)',
              background: 'var(--glass-bg)',
              opacity: dragIndex === idx ? 0.4 : 1,
              transform: dragOverIndex === idx && dragIndex !== idx ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {/* Drag handle */}
            <div className="absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity p-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}>
              <GripVertical size={14} />
            </div>

            <div className="p-4">
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
                style={{ background: 'var(--bg-secondary)' }}
              />
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</h4>
              <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{p.subtitle}</p>
              {p.tech && p.tech.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tech.slice(0, 4).map((t: string) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                    >
                      {t}
                    </span>
                  ))}
                  {p.tech.length > 4 && (
                    <span className="text-[10px] py-0.5" style={{ color: 'var(--text-muted)' }}>+{p.tech.length - 4}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => handleEdit(p)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
                <span className="ml-auto text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {p.year} · {p.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto border"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingId === 0 ? 'New Project' : 'Edit Project'}
              </h3>
              <button
                onClick={() => setEditingId(null)}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Title</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Subtitle</label>
                <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputClass} style={inputStyle} rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Details (one per line)</label>
                <textarea value={formData.detailsStr} onChange={e => setFormData({...formData, detailsStr: e.target.value})} className={inputClass} style={inputStyle} rows={4} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Tech (comma separated)</label>
                <input value={formData.techStr} onChange={e => setFormData({...formData, techStr: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Image URL</label>
                <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Fallback Image URL</label>
                <input value={formData.fallback} onChange={e => setFormData({...formData, fallback: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Year</label>
                <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Type</label>
                <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Color (Hex)</label>
                <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className={inputClass} style={inputStyle} type="color" />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Repo URL</label>
                <input value={formData.repo} onChange={e => setFormData({...formData, repo: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Demo URL</label>
                <input value={formData.demo} onChange={e => setFormData({...formData, demo: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                style={{ background: 'var(--accent-color, #3b82f6)' }}
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
