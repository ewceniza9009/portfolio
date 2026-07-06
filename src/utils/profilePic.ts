import { useEffect, useState, useCallback } from 'react'
import { getApiUrl, getAdminToken } from './api'

const DEFAULT_PIC = '/img/profile-pic.png'

interface ProfilePicState {
  url: string
  loaded: boolean
  refresh: () => Promise<void>
}

const FALLBACK_URL = DEFAULT_PIC
const CACHE_KEY = 'cached_profile_pic_url'

let cachedUrl: string | null = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null
let inflight: Promise<string> | null = null
const subscribers = new Set<(url: string) => void>()

async function loadProfilePic(): Promise<string> {
  if (cachedUrl && !inflight) {
    // We have a cached URL, but we still want to fetch in the background to ensure it's up to date
    // if a request isn't already inflight. We don't return early here if there is no inflight, 
    // we let it fetch, but the initial render will use cachedUrl.
  }
  
  if (inflight) return inflight

  const url = getApiUrl('/api/settings')
  const promise = fetch(url, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const u = (data && data.profile_pic_url) || FALLBACK_URL
      cachedUrl = u
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, u)
      }
      inflight = null
      subscribers.forEach((s) => s(u))
      return u
    })
    .catch(() => {
      inflight = null
      const fallback = FALLBACK_URL
      if (!cachedUrl) {
        cachedUrl = fallback
        subscribers.forEach((s) => s(fallback))
      }
      return cachedUrl || fallback
    })
  inflight = promise
  return promise
}

export async function uploadProfilePic(file: File): Promise<string> {
  const url = getApiUrl('/api/admin/upload-profile-pic')
  const form = new FormData()
  form.append('file', file)
  const token = getAdminToken()
  const res = await fetch(url, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Upload failed: ${res.status}`)
  }
  const data = await res.json()
  const newUrl = data.url as string
  cachedUrl = newUrl
  subscribers.forEach((s) => s(newUrl))
  return newUrl
}

export async function resetProfilePic(): Promise<string> {
  const url = getApiUrl('/api/admin/reset-profile-pic')
  const token = getAdminToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`)
  const data = await res.json()
  const newUrl = data.url as string
  cachedUrl = newUrl
  subscribers.forEach((s) => s(newUrl))
  return newUrl
}

export function useProfilePic(): ProfilePicState {
  const [url, setUrl] = useState<string>(cachedUrl || FALLBACK_URL)
  const [loaded, setLoaded] = useState<boolean>(!!cachedUrl)

  useEffect(() => {
    if (typeof window === 'undefined') return
    loadProfilePic().then((u) => {
      setUrl(u)
      setLoaded(true)
    })
    const cb = (u: string) => setUrl(u)
    subscribers.add(cb)
    return () => {
      subscribers.delete(cb)
    }
  }, [])

  const refresh = useCallback(async () => {
    cachedUrl = null
    const u = await loadProfilePic()
    setUrl(u)
    setLoaded(true)
  }, [])

  return { url, loaded, refresh }
}

export const DEFAULT_PROFILE_PIC = FALLBACK_URL
export const PROFILE_PIC_EVENT = 'profile-pic-updated'

export function emitProfilePicChange(newUrl: string) {
  cachedUrl = newUrl
  subscribers.forEach((s) => s(newUrl))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROFILE_PIC_EVENT, { detail: { url: newUrl } }))
  }
}
