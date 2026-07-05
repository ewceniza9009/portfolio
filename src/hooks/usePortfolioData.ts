import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '../utils/api'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(getApiUrl(path))
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchJson<any[]>('/api/projects'),
    select: (data) => {
      if (!Array.isArray(data) || data.length === 0) return []
      return data.map((p: any) => ({
        ...p,
        details: Array.isArray(p.details) ? p.details : (typeof p.details === 'string' ? [p.details] : []),
        tech: Array.isArray(p.tech) ? p.tech : (typeof p.tech === 'string' ? p.tech.split(',').map((s: string) => s.trim()) : []),
      }))
    },
  })
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => fetchJson<{ categories: any[]; skills: any }>('/api/skills'),
    select: (data) => {
      if (!data?.categories || !data?.skills) return []
      return data.categories.map((cat: any) => ({
        id: cat.id,
        label: cat.label,
        image: cat.image,
        items: data.skills[cat.id]?.items || [],
      }))
    },
  })
}

export function useAbout() {
  return useQuery({
    queryKey: ['about'],
    queryFn: () => fetchJson<{ title: string; paragraphs: string[] }>('/api/about'),
    select: (data) => {
      if (data?.paragraphs && data.paragraphs.length > 0) return data
      return { title: 'About Me', paragraphs: [] as string[] }
    },
  })
}

export function useExperience() {
  return useQuery({
    queryKey: ['experience'],
    queryFn: () => fetchJson<any[]>('/api/experience'),
    select: (data) => {
      if (!Array.isArray(data) || data.length === 0) return []
      return data.map((exp: any) => ({
        ...exp,
        descriptions: Array.isArray(exp.descriptions) ? exp.descriptions : (typeof exp.descriptions === 'string' ? [exp.descriptions] : []),
        technologies: Array.isArray(exp.technologies) ? exp.technologies : (typeof exp.technologies === 'string' ? exp.technologies.split(',').map((s: string) => s.trim()) : []),
      }))
    },
  })
}

export function useAwards() {
  return useQuery({
    queryKey: ['awards'],
    queryFn: () => fetchJson<any[]>('/api/awards'),
    select: (data) => (Array.isArray(data) && data.length > 0 ? data : []),
  })
}

export function useBlogs() {
  return useQuery({
    queryKey: ['blogs'],
    queryFn: () => fetchJson<any[]>('/api/blogs'),
  })
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: ['blog', slug],
    queryFn: () => fetchJson<any>(`/api/blogs/${slug}`),
    enabled: !!slug,
  })
}

export function useBlogComments(blogId: string | number) {
  return useQuery({
    queryKey: ['blogComments', blogId],
    queryFn: () => fetchJson<any[]>(`/api/blogs/${blogId}/comments`),
    enabled: !!blogId,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchJson<Record<string, string>>('/api/settings'),
    staleTime: 10 * 60 * 1000, // 10 minutes - settings rarely change
  })
}
