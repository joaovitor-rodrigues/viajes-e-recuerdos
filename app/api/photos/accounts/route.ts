import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Returns which Google accounts are connected (without exposing tokens)
export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('google_tokens').select('label, email, expires_at')
  return NextResponse.json(data ?? [])
}
