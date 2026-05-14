interface GeoResult {
  city: string | null
  country: string | null
  country_code: string | null
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'RunningQuest/1.0 (adam01see@gmail.com)',
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      }
    )
    clearTimeout(timer)
    if (!res.ok) return { city: null, country: null, country_code: null }

    const data = await res.json()
    const addr = data.address ?? {}
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.county ?? null
    const country = addr.country ?? null
    const country_code = addr.country_code?.toUpperCase() ?? null

    return { city, country, country_code }
  } catch {
    clearTimeout(timer)
    return { city: null, country: null, country_code: null }
  }
}
