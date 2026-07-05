const getSafeItem = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
}

const setSafeItem = (key: string, value: string): void => {
  try { localStorage.setItem(key, value) } catch {}
}

const removeSafeItem = (key: string): void => {
  try { localStorage.removeItem(key) } catch {}
}

export { getSafeItem, setSafeItem, removeSafeItem }
