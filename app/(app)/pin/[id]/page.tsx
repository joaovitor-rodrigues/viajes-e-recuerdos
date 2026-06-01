import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import createServerClient from '@/lib/supabase/server'
import type { Pin, VisualTheme } from '@/types/database'
import PinHero from '@/components/pin-page/PinHero'
import PinGallery from '@/components/pin-page/PinGallery'
import PinVideoPlayer from '@/components/pin-page/PinVideoPlayer'

const PinMiniMap = dynamic(() => import('@/components/pin-page/PinMiniMap'), { ssr: false })

export const metadata: Metadata = {
  title: 'Memória — Viajes e Recuerdos',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PinPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: pin } = await supabase
    .from('pins')
    .select('*')
    .eq('id', id)
    .single()

  if (!pin) notFound()

  const [{ data: relatedPins }, { data: theme }] = await Promise.all([
    supabase
      .from('pins')
      .select('*')
      .eq('city', (pin as Pin).city)
      .neq('id', id)
      .limit(4),
    supabase.from('visual_theme').select('*').eq('id', 1).single(),
  ])

  const p = pin as Pin
  const related = (relatedPins ?? []) as Pin[]
  const photos = p.media.filter((m) => m.type === 'image')
  const videos = p.media.filter((m) => m.type === 'video')

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#f0ece4', padding: '40px 16px' }}>
      <main style={{ maxWidth: 800, margin: '0 auto' }}>

        <PinHero pin={p} />

        {photos.length > 0 && <PinGallery photos={photos} />}

        {videos.length > 0 && <PinVideoPlayer videos={videos} />}

        {p.description && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Memória
            </h2>
            <p style={{
              margin: 0, fontSize: 17, lineHeight: 1.85, color: '#d0ccc4',
              fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'pre-wrap',
            }}>
              {p.description}
            </p>
          </section>
        )}

        <PinMiniMap pin={p} theme={theme as VisualTheme | null} />

        {related.length > 0 && (
          <section>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Mais memórias em {p.city}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/pin/${r.id}`}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    padding: '14px 16px',
                    borderRadius: 8,
                    borderLeft: `3px solid ${r.color}`,
                    background: `${r.color}10`,
                    border: `1px solid ${r.color}30`,
                    transition: 'transform 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.transform = 'translateY(-2px)'
                    el.style.background = `${r.color}20`
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.transform = 'translateY(0)'
                    el.style.background = `${r.color}10`
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 13, color: '#f0ece4', fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {format(parse(r.pin_date, 'yyyy-MM-dd', new Date()), "MMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
