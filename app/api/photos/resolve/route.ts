import { NextRequest, NextResponse } from 'next/server'
import { resolveGPhotosUrl } from '@/lib/googlePhotos'

// GET /api/photos/resolve?url=gphotos://joao/ITEM_ID
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    const resolved = await resolveGPhotosUrl(url)
    if (!resolved) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(resolved, {
      headers: { 'Cache-Control': 's-maxage=3000, stale-while-revalidate=300' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
