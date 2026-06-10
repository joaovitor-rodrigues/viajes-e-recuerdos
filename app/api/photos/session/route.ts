import { NextRequest, NextResponse } from 'next/server'
import {
  createPickerSession,
  getPickerSession,
  type AccountLabel,
} from '@/lib/googlePhotos'

// POST /api/photos/session — cria nova sessão do Google Photos Picker
export async function POST(request: NextRequest) {
  const { label } = await request.json() as { label: AccountLabel }
  try {
    const session = await createPickerSession(label)
    return NextResponse.json({ sessionId: session.id, pickerUri: session.pickerUri })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET /api/photos/session?sessionId=X&label=Y — consulta status da sessão (polling)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const label     = (searchParams.get('label') ?? 'joão') as AccountLabel
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  try {
    const session = await getPickerSession(label, sessionId)
    return NextResponse.json({ mediaItemsSet: session.mediaItemsSet })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
