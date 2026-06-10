'use client'

import Map, { Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion } from 'framer-motion'
import { useMapStore } from '@/stores/mapStore'
import type { Pin } from '@/types/database'

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

interface Props {
  pin: Pin
  onNavigate?: () => void
  theme?: unknown
}

export default function PinMiniMap({ pin, onNavigate }: Props) {
  const { flyTo } = useMapStore()

  function handleClick() {
    flyTo(pin.latitude, pin.longitude, 13)
    onNavigate?.()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ marginBottom: 40 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          fontSize: 10, color: '#a07840', textTransform: 'uppercase',
          letterSpacing: '0.12em', fontWeight: 600, fontFamily: '"Inter", sans-serif',
        }}>
          Localização
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.25)' }} />
        <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
      </div>

      <div
        onClick={handleClick}
        title="Ver no mapa"
        style={{
          height: 280,
          borderRadius: 4,
          overflow: 'hidden',
          border: '2px solid rgba(160,120,72,0.28)',
          boxShadow: '0 3px 16px rgba(80,50,20,0.1)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <Map
          initialViewState={{ latitude: pin.latitude, longitude: pin.longitude, zoom: 13 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE_URL}
          interactive={false}
          attributionControl={false}
        >
          <Marker latitude={pin.latitude} longitude={pin.longitude} anchor="center">
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: pin.color ?? '#C9485B',
              border: '2.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 2px 6px rgba(44,26,14,0.4)',
            }} />
          </Marker>
        </Map>

        <div style={{
          position: 'absolute', bottom: 8, right: 8, pointerEvents: 'none',
          background: 'rgba(253,248,238,0.88)',
          border: '1px solid rgba(160,120,72,0.3)',
          borderRadius: 3, padding: '3px 8px',
          fontSize: 10, color: '#6a4e2a',
          fontFamily: '"Inter", sans-serif', letterSpacing: '0.04em',
        }}>
          Ver no globo →
        </div>
      </div>
    </motion.section>
  )
}
