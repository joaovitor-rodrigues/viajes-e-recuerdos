import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken, type AccountLabel } from '@/lib/googlePhotos'

export async function GET(request: NextRequest) {
  const label = (request.nextUrl.searchParams.get('label') ?? 'joão') as AccountLabel
  try {
    const token = await getValidAccessToken(label)
    if (!token) return NextResponse.json({ error: 'Conta não conectada' }, { status: 401 })
    return NextResponse.json({ token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
