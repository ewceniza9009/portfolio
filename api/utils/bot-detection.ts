const BOT_PATTERNS = [
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|teoma|ia_archiver/i,
  /crawler|spider|scraper|bot|curl|wget|python-requests|go-http-client/i,
  /MJ12bot|AhrefsBot|SemrushBot|DotBot|PetalBot|BLEXBot|Ezooms/i,
  /screaming|octopus|inspector|neumarks|ahrefs|seochat/i,
  /facebookexternalhit|twitterbot|linkedinbot|pinterest|whatsapp|telegrambot/i,
  /embedly|quora|buffer|skypeuri|slackbot|discordbot/i,
  /sogou|exabot|facebot|applebot|yandex|mail.ru/i,
  /rogerbot|fenixbot|overflowbot|happyfoxbot|mindspider/i,
  /facebookcatalog|pandalytics|bytespider|baiduboxapp|msnbot/i,
  /chatgpt|gptbot|perplexitybot|anthropic-ai|claudebot/i,
  /anthropic|gemini|bard|gemini-bot|bard-bot/i,
  /paperlib|semanticscholar|core|openai-research/i,
  /archive.org_bot|archive.org_bot|archive.org|waybackmachine/i,
  /semrushbot|seotools|seoanalyzer|siteaudit|ahrefsbot/i,
]

export function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 5) return true
  const uaLower = userAgent.toLowerCase()
  if (uaLower === 'unknown' || uaLower === '-' || uaLower === 'null') return true
  return BOT_PATTERNS.some((pattern) => pattern.test(uaLower))
}
