const NOMINATIM_HEADERS = {
  'User-Agent': 'viajes.joaovrodrigues.com.br',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}

export interface GeocodingResult {
  displayName: string
  city: string
  state: string | null
  country: string
  lat: number
  lng: number
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
  }
}

function mapResult(item: NominatimResult): GeocodingResult {
  const addr = item.address
  return {
    displayName: item.display_name,
    city: addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '',
    state: addr.state ?? null,
    country: addr.country ?? '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }
}

export async function searchCity(query: string): Promise<GeocodingResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
  if (!res.ok) return []

  const data: NominatimResult[] = await res.json()
  return data.map(mapResult)
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')

  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
    if (!res.ok) return null

    const data: NominatimResult = await res.json()
    return mapResult(data)
  } catch {
    return null
  }
}
