import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode, type GeocodingResult } from '@/lib/geocoding'

interface CacheEntry {
  data: GeocodingResult | null
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
let lastRequestAt = 0

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat e lng são obrigatórios' }, { status: 400 })
  }

  const key = `${lat},${lng}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed))
  }
  lastRequestAt = Date.now()

  const result = await reverseGeocode(parseFloat(lat), parseFloat(lng))
  cache.set(key, { data: result, timestamp: Date.now() })

  return NextResponse.json(result)
}
