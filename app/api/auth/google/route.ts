import { NextRequest, NextResponse } from 'next/server'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
  'email',
  'profile',
].join(' ')

// Google rejeita state com caracteres não-ASCII — usar slugs ASCII
const LABEL_TO_SLUG: Record<string, string> = {
  'joão':    'joao',
  'jéssica': 'jessica',
}

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get('label') ?? 'joão'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',     process.env.GOOGLE_CLIENT_ID!)
  url.searchParams.set('redirect_uri',  `${appUrl}/api/auth/google/callback`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope',         SCOPES)
  url.searchParams.set('access_type',   'offline')
  url.searchParams.set('prompt',        'consent')
  url.searchParams.set('state',         LABEL_TO_SLUG[label] ?? label)

  return NextResponse.redirect(url.toString())
}
