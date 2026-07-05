interface FormatDateOptions {
  month?: 'short' | 'long' | 'numeric'
  day?: boolean
  time?: boolean
}

export function formatDate(dateStr: string, options: FormatDateOptions = {}): string {
  const { month = 'short', day = true, time = false } = options
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month,
    ...(day ? { day: 'numeric' } : {}),
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }
  return new Date(dateStr).toLocaleDateString('en-US', opts)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
