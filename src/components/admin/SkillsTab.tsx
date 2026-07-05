import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function SkillsTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [skills, setSkills] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingSkill, setEditingSkill] = useState<any>(null)

  // Drag state for categories
  const [dragCatIndex, setDragCatIndex] = useState<number | null>(null)
  const [dragOverCatIndex, setDragOverCatIndex] = useState<number | null>(null)

  // Drag state for skills
  const [dragSkill, setDragSkill] = useState<{ catId: string; index: number } | null>(null)
  const [dragOverSkill, setDragOverSkill] = useState<{ catId: string; index: number } | null>(null)

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

  // --- Category CRUD ---
  const handleEditCategory = (c: any) => setEditingCategory(c)

  const handleCreateCategory = () => {
    setEditingCategory({ id: '', label: '', image: '', display_order: categories.length })
  }

  const handleSaveCategory = async () => {
    try {
      const existing = categories.find(c => c.id === editingCategory.id)
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

  // --- Skill CRUD ---
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

  // --- Category Drag & Drop ---
  const handleCatDragStart = (index: number) => {
    setDragCatIndex(index)
  }

  const handleCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverCatIndex(index)
  }

  const handleCatDrop = async (index: number) => {
    if (dragCatIndex === null || dragCatIndex === index) {
      setDragCatIndex(null)
      setDragOverCatIndex(null)
      return
    }

    const newCats = [...categories]
    const [moved] = newCats.splice(dragCatIndex, 1)
    newCats.splice(index, 0, moved)

    const updatedItems = newCats.map((c, i) => ({ id: c.id, display_order: i }))
    setCategories(newCats.map((c, i) => ({ ...c, display_order: i })))
    setDragCatIndex(null)
    setDragOverCatIndex(null)

    try {
      await apiFetch('/api/skill-categories/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: updatedItems })
      })
    } catch {
      fetchData()
    }
  }

  // --- Skill Drag & Drop ---
  const handleSkillDragStart = (catId: string, index: number) => {
    setDragSkill({ catId, index })
  }

  const handleSkillDragOver = (e: React.DragEvent, catId: string, index: number) => {
    e.preventDefault()
    setDragOverSkill({ catId, index })
  }

  const handleSkillDrop = async (catId: string, index: number) => {
    if (!dragSkill || (dragSkill.catId === catId && dragSkill.index === index)) {
      setDragSkill(null)
      setDragOverSkill(null)
      return
    }

    // Only allow reorder within the same category
    if (dragSkill.catId !== catId) {
      setDragSkill(null)
      setDragOverSkill(null)
      return
    }

    const catSkills = [...(skills[catId]?.items || [])]
    const [moved] = catSkills.splice(dragSkill.index, 1)
    catSkills.splice(index, 0, moved)

    const updatedItems = catSkills.map((s, i) => ({ id: s.id, display_order: i }))

    setSkills({
      ...skills,
      [catId]: {
        ...skills[catId],
        items: catSkills.map((s, i) => ({ ...s, display_order: i }))
      }
    })
    setDragSkill(null)
    setDragOverSkill(null)

    try {
      await apiFetch('/api/skills/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: updatedItems })
      })
    } catch {
      fetchData()
    }
  }

  if (loading) return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="col-span-12 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Skills &amp; Categories</h3>
        <button
          onClick={handleCreateCategory}
          className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((cat, catIdx) => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => handleCatDragStart(catIdx)}
            onDragOver={(e) => handleCatDragOver(e, catIdx)}
            onDrop={() => handleCatDrop(catIdx)}
            onDragEnd={() => { setDragCatIndex(null); setDragOverCatIndex(null) }}
            className="rounded-xl border transition-all duration-200"
            style={{
              borderColor: dragOverCatIndex === catIdx && dragCatIndex !== catIdx
                ? 'var(--accent)'
                : 'var(--border-color)',
              background: 'var(--glass-bg)',
              opacity: dragCatIndex === catIdx ? 0.5 : 1,
              transform: dragOverCatIndex === catIdx && dragCatIndex !== catIdx ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            {/* Category Header */}
            <div
              className="flex justify-between items-center p-4 border-b"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-3">
                <div className="cursor-grab active:cursor-grabbing" style={{ color: 'var(--text-muted)' }}>
                  <GripVertical size={16} />
                </div>
                <img src={cat.image} alt={cat.label} className="w-9 h-9 rounded-lg object-cover" style={{ background: 'var(--bg-secondary)' }} />
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {cat.label}
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({cat.id})</span>
                  </h4>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {skills[cat.id]?.items?.length || 0} skills
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCreateSkill(cat.id)}
                  className="px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors"
                  style={{ background: 'var(--accent)', color: '#fff', opacity: 0.85 }}
                >
                  <Plus size={12} /> Skill
                </button>
                <button
                  onClick={() => handleEditCategory(cat)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="p-4 flex flex-wrap gap-2">
              {skills[cat.id]?.items?.map((s: any, sIdx: number) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); handleSkillDragStart(cat.id, sIdx) }}
                  onDragOver={(e) => { e.stopPropagation(); handleSkillDragOver(e, cat.id, sIdx) }}
                  onDrop={(e) => { e.stopPropagation(); handleSkillDrop(cat.id, sIdx) }}
                  onDragEnd={() => { setDragSkill(null); setDragOverSkill(null) }}
                  className="group flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border text-xs cursor-grab active:cursor-grabbing select-none transition-all duration-150"
                  style={{
                    borderColor: dragOverSkill?.catId === cat.id && dragOverSkill?.index === sIdx && dragSkill?.index !== sIdx
                      ? 'var(--accent)'
                      : 'var(--border-color)',
                    background: dragSkill?.catId === cat.id && dragSkill?.index === sIdx
                      ? 'transparent'
                      : 'var(--bg-secondary)',
                    opacity: dragSkill?.catId === cat.id && dragSkill?.index === sIdx ? 0.4 : 1,
                    color: 'var(--text-primary)',
                  }}
                >
                  <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: s.level === 'core' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                      color: s.level === 'core' ? '#60a5fa' : '#a78bfa',
                    }}
                  >
                    {s.level}
                  </span>
                  <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditSkill(s, cat.id) }}
                      className="p-0.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSkill(s.id) }}
                      className="p-0.5 rounded text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {(!skills[cat.id]?.items || skills[cat.id].items.length === 0) && (
                <div className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No skills in this category yet.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Category Edit Modal */}
      {editingCategory !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl w-full max-w-md p-6 border"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {!categories.find(c => c.id === editingCategory.id) ? 'New Category' : 'Edit Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>ID (used in code, e.g., 'frontend')</label>
                <input
                  value={editingCategory.id}
                  onChange={e => setEditingCategory({ ...editingCategory, id: e.target.value })}
                  disabled={!!categories.find(c => c.id === editingCategory.id)}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Label (Display Name)</label>
                <input
                  value={editingCategory.label}
                  onChange={e => setEditingCategory({ ...editingCategory, label: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Image URL</label>
                <input
                  value={editingCategory.image}
                  onChange={e => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Edit Modal */}
      {editingSkill !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl w-full max-w-md p-6 border"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingSkill.id === 0 ? 'New Skill' : 'Edit Skill'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input
                  value={editingSkill.name}
                  onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Icon Name (e.g. SiReact, SiPython)</label>
                <input
                  value={editingSkill.icon || ''}
                  onChange={e => setEditingSkill({ ...editingSkill, icon: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Level</label>
                <select
                  value={editingSkill.level}
                  onChange={e => setEditingSkill({ ...editingSkill, level: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="core">Core</option>
                  <option value="familiar">Familiar</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSkill(null)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkill}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
