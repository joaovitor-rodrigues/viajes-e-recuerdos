'use client'

import { useEffect } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pin, VisualTheme } from '@/types/database'
import { usePinsStore } from '@/stores/pinsStore'
import { useMapStore } from '@/stores/mapStore'
import { useTheme } from '@/hooks/useTheme'
import { useRealtimeSync } from '@/hooks/usePins'
import { useThemeStore } from '@/stores/themeStore'
import MapPin from './MapPin'
import CitySearchBox from './CitySearchBox'
import PinCreationMarker from './PinCreationMarker'
import PinCreateModal from '@/components/pins/PinCreateModal'
import FloatingPinPanel from '@/components/sidebar/FloatingPinPanel'
import ThemePanel from '@/components/theme/ThemePanel'
import ParticleCanvas from '@/components/theme/ParticleCanvas'

// Stadia tiles use OSM data → names appear in each country's local language
// (e.g. Brazilian cities in Portuguese, French cities in French, etc.)
const TILE_URLS: Record<string, string> = {
  dark:       'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
  light:      'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
  watercolor: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
  minimal:    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  osm:        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}

function MapRefCapture() {
  const map = useMap()
  const setMapRef = useMapStore((s) => s.setMapRef)
  useEffect(() => { setMapRef(map) }, [map, setMapRef])
  return null
}

interface Props {
  initialPins: Pin[]
  theme: VisualTheme | null
}

export default function MapContainer({ initialPins, theme: serverTheme }: Props) {
  const setPins = usePinsStore((s) => s.setPins)
  const pins    = usePinsStore((s) => s.pins)
  const { creationMode, creationPosition } = useMapStore()

  useTheme(serverTheme)
  useRealtimeSync()

  useEffect(() => { setPins(initialPins) }, [initialPins, setPins])

  const liveMapStyle = useThemeStore((s) => s.theme.map_style)
  const liveGlow     = useThemeStore((s) => s.theme.enable_glow)
  const tileUrl      = TILE_URLS[liveMapStyle] ?? TILE_URLS.dark

  return (
    <>
      <ParticleCanvas />

      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <LeafletMapContainer
          center={[20, 0]}
          zoom={2.5}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
          zoomControl={false}
        >
          <MapRefCapture />
          <TileLayer url={tileUrl} />

          {pins.map((pin) => (
            <MapPin key={pin.id} pin={pin} enableGlow={liveGlow} />
          ))}

          {creationMode && creationPosition && (
            <PinCreationMarker position={creationPosition} />
          )}
        </LeafletMapContainer>

        <CitySearchBox />
        <FloatingPinPanel />
        <ThemePanel />
        <PinCreateModal />
      </div>
    </>
  )
}
