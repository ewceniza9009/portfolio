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

export async function apiFetch(path: string, options?: RequestInit, retries = 2): Promise<Response> {
  const token = getAdminToken()
  const fetchOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
