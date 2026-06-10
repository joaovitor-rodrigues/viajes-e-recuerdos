import { NextRequest, NextResponse } from 'next/server'
import { searchCity, type GeocodingResult } from '@/lib/geocoding'

interface CacheEntry {
  data: GeocodingResult[]
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
let lastRequestAt = 0

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  const cached = cache.get(q)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  // Light throttle — Photon is fast, but protect the Nominatim fallback
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < 200) {
    await new Promise((r) => setTimeout(r, 200 - elapsed))
  }
  lastRequestAt = Date.now()

  const results = await searchCity(q)
  cache.set(q, { data: results, timestamp: Date.now() })

  return NextResponse.json(results)
}
