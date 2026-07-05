const BOT_PATTERNS = [
  // Search engine crawlers
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|teoma|ia_archiver/i,
  // Generic bot identifiers
  /crawler|spider|scraper|bot|curl|wget|python-requests|go-http-client/i,
  // SEO tools
  /MJ12bot|AhrefsBot|SemrushBot|DotBot|PetalBot|BLEXBot|Ezooms/i,
  /screaming|octopus|inspector|neumarks|ahrefs|seochat/i,
  // Social media bots
  /facebookexternalhit|twitterbot|linkedinbot|pinterest|whatsapp|telegrambot/i,
  /embedly|quora|buffer|skypeuri|slackbot|discordbot/i,
  // Regional / niche crawlers
  /sogou|exabot|facebot|applebot|yandex|mail.ru/i,
  /rogerbot|fenixbot|overflowbot|happyfoxbot|mindspider/i,
  /facebookcatalog|pandalytics|bytespider|baiduboxapp|msnbot/i,
  // AI crawlers
  /chatgpt|gptbot|perplexitybot|anthropic-ai|claudebot/i,
  /anthropic|gemini-bot|bard-bot/i,
  /paperlib|semanticscholar|openai-research/i,
  // Archive bots
  /archive.org_bot|waybackmachine/i,
  /semrushbot|seotools|seoanalyzer|siteaudit/i,
  // HTTP libraries & headless tools
  /axios|node-fetch|http-client|java\/|libwww|lwp-|okhttp|jersey/i,
  /phantomjs|headless|puppeteer|playwright|selenium|webdriver/i,
  // Monitoring & uptime
  /uptime|monitor|pingdom|statuspage|newrelic|datadog|site24x7|gtmetrix/i,
  // Feed readers
  /feedly|feedparser|rss|newsblur|inoreader/i,
]

// Private/local IP ranges that should not be tracked
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^::1$/,
  /^localhost$/i,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
]

export function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 5) return true
  const uaLower = userAgent.toLowerCase()
  if (uaLower === 'unknown' || uaLower === '-' || uaLower === 'null') return true
  return BOT_PATTERNS.some((pattern) => pattern.test(uaLower))
}

/**
 * Enhanced bot detection using server-side request signals.
 * Catches headless browsers and spoofed user-agents by inspecting
 * request headers that real browsers always send.
 */
export function isSuspiciousRequest(headers: Record<string, string | string[] | undefined>): boolean {
  // Real browsers always send Accept-Language
  const acceptLang = headers['accept-language']
  if (!acceptLang) return true

  // Real browsers always send Accept with text/html or */*
  const accept = headers['accept']
  if (!accept) return true

  // Real browsers send Sec-Fetch-* headers (modern Chrome, Firefox, Edge)
  // Missing these in combination with a modern UA is suspicious
  const secFetchMode = headers['sec-fetch-mode']
  const ua = (headers['user-agent'] || '') as string

  // If the UA claims to be a modern browser but has no Sec-Fetch headers, suspicious
  const claimsModernBrowser = /chrome\/[89]\d|chrome\/1[0-9]\d|firefox\/1[0-9]\d|edg\//i.test(ua)
  if (claimsModernBrowser && !secFetchMode) return true

  return false
}

/**
 * Check if an IP is a private/local address (dev traffic).
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return true
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip))
}
