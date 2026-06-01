'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import type { Pin, VisualTheme } from '@/types/database'

const TILE_URLS: Record<string, string> = {
  dark:       'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  watercolor: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
  minimal:    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  osm:        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}

interface Props {
  pin: Pin
  theme: VisualTheme | null
}

export default function PinMiniMap({ pin, theme }: Props) {
  const tileUrl = TILE_URLS[theme?.map_style ?? 'dark'] ?? TILE_URLS.dark

  const icon = L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    html: `
      <div style="
        width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${pin.color};display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 8px 3px ${pin.color}88;
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${pin.icon}</span>
      </div>
    `,
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ marginBottom: 40 }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Localização no mapa
      </h2>
      <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <MapContainer
          center={[pin.latitude, pin.longitude]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={tileUrl} />
          <Marker position={[pin.latitude, pin.longitude]} icon={icon} />
        </MapContainer>
      </div>
    </motion.section>
  )
}
