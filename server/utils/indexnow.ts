const INDEXNOW_KEY = '89e86d03dd5eaacd56983cc66c300f05'
const SITE_URL = 'https://erwinwilsonceniza.qzz.io'
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
]

export async function notifyIndexNow(urls: string[]) {
  if (!urls.length) return
  const payload = {
    host: 'erwinwilsonceniza.qzz.io',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      })
    } catch {}
  }
}

export { SITE_URL, INDEXNOW_KEY }
