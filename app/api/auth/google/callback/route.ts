import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const SLUG_TO_LABEL: Record<string, string> = {
  'joao':    'joão',
  'jessica': 'jéssica',
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code  = searchParams.get('code')
  const slug  = searchParams.get('state') ?? 'joao'
  const label = SLUG_TO_LABEL[slug] ?? slug
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code) {
    return NextResponse.redirect(`${appUrl}/mapa?google_error=no_code`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${appUrl}/api/auth/google/callback`,
      grant_type:    'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/mapa?google_error=token_exchange`)
  }

  const tokens = await tokenRes.json()

  // Fetch user email
  let email: string | null = null
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (profileRes.ok) {
      const profile = await profileRes.json()
      email = profile.email ?? null
    }
  } catch { /* non-fatal */ }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const db = createServiceClient()
  await db.from('google_tokens').upsert({
    label,
    email,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at:    expiresAt,
  }, { onConflict: 'label' })

  return NextResponse.redirect(`${appUrl}/mapa?google_connected=${encodeURIComponent(label)}`)
}
