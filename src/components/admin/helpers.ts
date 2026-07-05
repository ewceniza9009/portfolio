export function parseUA(ua: string) {
  const isMobile =
    /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isTablet = /Tablet|iPad|PlayBook|Silk/i.test(ua) && !isMobile
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
  let browser = 'Other'
  if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Safari/i.test(ua) && !/Chrome|Edg/i.test(ua)) browser = 'Safari'
  else if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/OPR/i.test(ua)) browser = 'Opera'
  let os = 'Other'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS|macOS/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua))
    os = 'macOS'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'
  return { device, browser, os }
}

export function processUAStats(visitors: any[]) {
  const deviceCount: Record<string, number> = {}
  const browserCount: Record<string, number> = {}
  const osCount: Record<string, number> = {}
  visitors.forEach((v: any) => {
    const parsed = parseUA(v.user_agent || '')
    deviceCount[parsed.device] =
      (deviceCount[parsed.device] || 0) + Number(v.visit_count || 1)
    browserCount[parsed.browser] =
      (browserCount[parsed.browser] || 0) + Number(v.visit_count || 1)
    osCount[parsed.os] = (osCount[parsed.os] || 0) + Number(v.visit_count || 1)
  })
  return { deviceCount, browserCount, osCount }
}

export function processCountryStats(visitors: any[]) {
  const countryCount: Record<string, number> = {}
  visitors.forEach((v: any) => {
    const country = v.country || 'Unknown'
    countryCount[country] =
      (countryCount[country] || 0) + Number(v.visit_count || 1)
  })
  return Object.entries(countryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export const VISITOR_TABLE_COLUMNS = [
  { key: 'country', label: 'Location', align: 'left' as const },
  { key: 'ip', label: 'IP', align: 'left' as const },
  { key: 'visit_count', label: 'Visits', align: 'right' as const },
  { key: null, label: 'Referrer', align: 'left' as const },
  { key: null, label: 'Ref', align: 'left' as const },
  { key: 'first_visit', label: 'First Visit', align: 'left' as const },
  { key: 'last_visit', label: 'Last Visit', align: 'left' as const },
]

export const AI_PRESETS = [
  {
    label: 'Accept Offer',
    prompt:
      'Draft a warm, professional acceptance email. Express enthusiasm about the opportunity to collaborate, thank them for the offer, and ask about next onboarding steps.',
  },
  {
    label: 'Polite Decline',
    prompt:
      'Draft a professional decline email. Polite and appreciative tone. State that I am currently at capacity and cannot take on new work, but thank them for reaching out.',
  },
  {
    label: 'Request Call',
    prompt:
      'Draft a reply thanking them for their message. Express interest and ask if they are free to schedule a brief 15-minute Google Meet next week to discuss in detail.',
  },
  {
    label: 'General Thanks',
    prompt:
      'Draft a brief, friendly reply thanking them for reaching out and writing such a thoughtful message. Let them know I will review their comments shortly.',
  },
]
