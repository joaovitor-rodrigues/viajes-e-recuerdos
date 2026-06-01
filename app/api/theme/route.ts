import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import createServerClient from '@/lib/supabase/server'

const ThemeUpdateSchema = z.object({
  primary_color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text_color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  map_style:        z.enum(['dark', 'light', 'watercolor', 'minimal', 'osm']).optional(),
  enable_particles: z.boolean().optional(),
  enable_glow:      z.boolean().optional(),
  enable_animations:z.boolean().optional(),
  font_family:      z.string().min(1).max(100).optional(),
  sidebar_position: z.enum(['left', 'right', 'hidden']).optional(),
})

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('visual_theme').select('*').eq('id', 1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const parsed = ThemeUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('visual_theme')
    .update(parsed.data)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
