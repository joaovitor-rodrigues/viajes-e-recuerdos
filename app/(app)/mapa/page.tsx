import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import createServerClient from '@/lib/supabase/server'
import type { Pin, VisualTheme } from '@/types/database'
import MapSkeleton from '@/components/map/MapSkeleton'
import MapErrorBoundary from '@/components/map/MapErrorBoundary'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

export default async function MapaPage() {
  const supabase = await createServerClient()

  const [{ data: pins }, { data: theme }] = await Promise.all([
    supabase.from('pins').select('*').order('start_date', { ascending: false }),
    supabase.from('visual_theme').select('*').eq('id', 1).single(),
  ])

  return (
    <MapErrorBoundary>
      <Suspense fallback={<MapSkeleton />}>
        <MapContainer
          initialPins={(pins as Pin[]) ?? []}
          theme={theme as VisualTheme}
        />
      </Suspense>
    </MapErrorBoundary>
  )
}
