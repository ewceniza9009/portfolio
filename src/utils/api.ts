const ADMIN_TOKEN_KEY = 'admin_token'

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path
  const baseUrl =
    window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3000'
      : ''
  return `${baseUrl}${path}`
}

export function getAdminToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = getAdminToken()
  return fetch(getApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
}
