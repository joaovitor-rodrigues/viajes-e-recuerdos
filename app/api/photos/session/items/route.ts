import { NextRequest, NextResponse } from 'next/server'
import { listPickerSessionItems, type AccountLabel } from '@/lib/googlePhotos'

// GET /api/photos/session/items?sessionId=X&label=Y — retorna mídias selecionadas na sessão
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const label     = (searchParams.get('label') ?? 'joão') as AccountLabel
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  try {
    const items = await listPickerSessionItems(label, sessionId)
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
