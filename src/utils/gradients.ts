const GRADIENTS = [
  'from-rose-500/80 to-orange-500/80',
  'from-emerald-500/80 to-teal-500/80',
  'from-cyan-500/80 to-blue-500/80',
  'from-purple-500/80 to-pink-500/80',
  'from-amber-500/80 to-red-500/80',
  'from-indigo-500/80 to-purple-500/80',
]

export function getGradient(slug: string): string {
  let hash = 0
  for (let i = 0; i < (slug || '').length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % GRADIENTS.length
  return GRADIENTS[index]
}
