import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function SkillsTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [skills, setSkills] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingSkill, setEditingSkill] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await apiFetch('/api/skills')
      const data = await res.json()
      setCategories(data.categories)
      setSkills(data.skills)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Categories
  const handleEditCategory = (c: any) => {
    setEditingCategory(c)
  }

  const handleCreateCategory = () => {
    setEditingCategory({ id: '', label: '', image: '', display_order: categories.length })
  }

  const handleSaveCategory = async () => {
    try {
      const existing = categories.find(c => c.id === editingCategory.id)
      if (!existing && !editingCategory.id) {
         // handle creation with an ID generated or user typed. 
         // Assuming editingCategory.id is filled.
      }
      
      if (!existing) {
        await apiFetch('/api/skill-categories', { method: 'POST', body: JSON.stringify(editingCategory) })
      } else {
        await apiFetch(`/api/skill-categories/${editingCategory.id}`, { method: 'PUT', body: JSON.stringify(editingCategory) })
      }
      setEditingCategory(null)
      fetchData()
    } catch (err) {
      alert('Failed to save category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its skills?')) return
    await apiFetch(`/api/skill-categories/${id}`, { method: 'DELETE' })
    fetchData()
  }

  // Skills
  const handleEditSkill = (s: any, catId: string) => {
    setEditingSkill({ ...s, category_id: catId })
  }

  const handleCreateSkill = (catId: string) => {
    setEditingSkill({ id: 0, category_id: catId, name: '', icon: '', level: 'familiar', display_order: skills[catId]?.items?.length || 0 })
  }

  const handleSaveSkill = async () => {
    try {
      if (editingSkill.id === 0) {
        await apiFetch('/api/skills', { method: 'POST', body: JSON.stringify(editingSkill) })
      } else {
        await apiFetch(`/api/skills/${editingSkill.id}`, { method: 'PUT', body: JSON.stringify(editingSkill) })
      }
      setEditingSkill(null)
      fetchData()
    } catch (err) {
      alert('Failed to save skill')
    }
  }

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Delete this skill?')) return
    await apiFetch(`/api/skills/${id}`, { method: 'DELETE' })
    fetchData()
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Skills & Categories</h3>
        <button onClick={handleCreateCategory} className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 flex items-center gap-1">
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <img src={cat.image} alt={cat.label} className="w-10 h-10 rounded object-cover bg-black/20" />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{cat.label} <span className="text-xs font-normal text-gray-500">({cat.id})</span></h4>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCreateSkill(cat.id)} className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-white flex items-center gap-1"><Plus size={12}/> Skill</button>
                <button onClick={() => handleEditCategory(cat)} className="p-1.5 rounded hover:bg-white/10 text-gray-400"><Edit2 size={14} /></button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills[cat.id]?.items?.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/20 border text-xs" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-gray-300">{s.name}</span>
                  <span className="text-gray-500 text-[10px]">{s.level}</span>
                  <div className="flex gap-1 ml-2 border-l pl-2" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => handleEditSkill(s, cat.id)} className="text-gray-400 hover:text-white"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteSkill(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {(!skills[cat.id]?.items || skills[cat.id].items.length === 0) && (
                <div className="text-xs text-gray-500">No skills in this category.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {editingCategory !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{!categories.find(c => c.id === editingCategory.id) ? 'New Category' : 'Edit Category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID (used in code, e.g., 'frontend')</label>
                <input value={editingCategory.id} onChange={e => setEditingCategory({...editingCategory, id: e.target.value})} disabled={!!categories.find(c => c.id === editingCategory.id)} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Label (Display Name)</label>
                <input value={editingCategory.label} onChange={e => setEditingCategory({...editingCategory, label: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Image URL</label>
                <input value={editingCategory.image} onChange={e => setEditingCategory({...editingCategory, image: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {editingSkill !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingSkill.id === 0 ? 'New Skill' : 'Edit Skill'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input value={editingSkill.name} onChange={e => setEditingSkill({...editingSkill, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Icon Name (e.g. SiReact, SiPython)</label>
                <input value={editingSkill.icon || ''} onChange={e => setEditingSkill({...editingSkill, icon: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Level</label>
                <select value={editingSkill.level} onChange={e => setEditingSkill({...editingSkill, level: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm">
                  <option value="core">Core</option>
                  <option value="familiar">Familiar</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingSkill(null)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveSkill} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
