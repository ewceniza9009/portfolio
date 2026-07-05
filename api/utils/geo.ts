export async function geoLookup(ip: string): Promise<{ country: string; region: string; city: string; loc: string }> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: '', region: '', city: '', loc: '' }
  }
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,lat,lon`)
    const data = await resp.json() as any
    if (data && data.country) {
      return {
        country: data.country || '',
        region: data.regionName || '',
        city: data.city || '',
        loc: data.lat && data.lon ? `${data.lat},${data.lon}` : '',
      }
    }
  } catch {}
  return { country: '', region: '', city: '', loc: '' }
}
