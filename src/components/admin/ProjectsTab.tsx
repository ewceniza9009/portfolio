import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function ProjectsTab() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<any>(null)

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

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="col-span-12 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h3>
        <button onClick={handleCreate} className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 flex items-center gap-1">
          <Plus size={14} /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className="p-4 rounded-xl border relative" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-3 bg-black/20" />
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</h4>
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{p.subtitle}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {editingId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId === 0 ? 'New Project' : 'Edit Project'}</h3>
              <button onClick={() => setEditingId(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Subtitle</label>
                <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Details (one per line)</label>
                <textarea value={formData.detailsStr} onChange={e => setFormData({...formData, detailsStr: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" rows={4} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tech (comma separated)</label>
                <input value={formData.techStr} onChange={e => setFormData({...formData, techStr: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Image URL</label>
                <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fallback Image URL</label>
                <input value={formData.fallback} onChange={e => setFormData({...formData, fallback: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Year</label>
                <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Type</label>
                <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Color (Hex)</label>
                <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" type="color" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Repo URL</label>
                <input value={formData.repo} onChange={e => setFormData({...formData, repo: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Demo URL</label>
                <input value={formData.demo} onChange={e => setFormData({...formData, demo: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2">
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
