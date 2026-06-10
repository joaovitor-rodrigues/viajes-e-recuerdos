// Photon (photon.komoot.io) — OSM-based, fast, no rate limits
// Supported lang values: de | en | fr | it  (NOT pt — falls back to English)
const PHOTON_BASE = 'https://photon.komoot.io/api'

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

interface PhotonFeature {
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    countrycode?: string
    osm_key?: string
    osm_value?: string
    type?: string
  }
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

function mapPhotonResult(f: PhotonFeature): GeocodingResult {
  const p = f.properties
  const city    = p.city || p.name || ''
  const state   = p.state || null
  const country = p.country || ''
  const parts   = [city, state, country].filter(Boolean)
  return {
    displayName: parts.join(', '),
    city,
    state,
    country,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }
}

function mapNominatimResult(item: NominatimResult): GeocodingResult {
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
  // 1. Try Photon (fast, sub-100ms)
  try {
    const url = new URL(`${PHOTON_BASE}/`)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', '5')
    url.searchParams.set('lang', 'en')

    const res = await fetch(url.toString())
    if (res.ok) {
      const data: { features?: PhotonFeature[] } = await res.json()
      const features = data.features ?? []
      if (features.length > 0) return features.map(mapPhotonResult)
    }
  } catch { /* fall through */ }

  // 2. Fallback to Nominatim (slower but reliable)
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '5')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
    if (!res.ok) return []
    const data: NominatimResult[] = await res.json()
    return data.map(mapNominatimResult)
  } catch {
    return []
  }
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
    return mapNominatimResult(data)
  } catch {
    return null
  }
}
