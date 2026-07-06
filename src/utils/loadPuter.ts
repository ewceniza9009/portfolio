let loadingPromise: Promise<void> | null = null

export function loadPuter(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).puter) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.puter.com/v2/'
    script.async = true
    script.onload = () => {
      if ((window as any).puter) {
        (window as any).puter.quiet = true
      }
      resolve()
    }
    script.onerror = () => {
      loadingPromise = null
      reject(new Error('Failed to load Puter AI script'))
    }
    document.body.appendChild(script)
  })

  return loadingPromise
}
