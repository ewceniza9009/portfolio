const ADMIN_TOKEN_KEY = 'admin_token'
const OPT_OUT_KEY = 'visitor_opt_out'

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

export function isVisitorOptOut(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === 'true'
  } catch {
    return false
  }
}

export function setVisitorOptOut(optOut: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (optOut) {
      window.localStorage.setItem(OPT_OUT_KEY, 'true')
    } else {
      window.localStorage.removeItem(OPT_OUT_KEY)
    }
  } catch {}
}

export async function apiFetch(path: string, options?: RequestInit, retries = 2): Promise<Response> {
  const token = getAdminToken()
  const optOut = isVisitorOptOut()
  const fetchOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(optOut ? { 'X-Visitor-Opt-Out': 'true' } : {}),
      ...options?.headers,
    },
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(getApiUrl(path), fetchOptions);
      // If unauthorized or other 4xx client errors, do not retry
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // If 5xx server error, or 429 rate limit, we might retry
      if (!response.ok && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
        continue;
      }
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
    }
  }
  
  // If we exhausted retries and it's a network error
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-fetch-error', { detail: lastError?.message || 'Network error' }));
  }
  
  throw lastError || new Error('API fetch failed');
}
