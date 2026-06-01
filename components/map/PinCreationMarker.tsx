'use client'

import { useEffect, useRef } from 'react'
import { Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/stores/mapStore'

const CREATION_ICON = L.divIcon({
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  html: `
    <style>
      @keyframes pin-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(201,72,91,0.7); }
        70%  { box-shadow: 0 0 0 14px rgba(201,72,91,0); }
        100% { box-shadow: 0 0 0 0 rgba(201,72,91,0); }
      }
    </style>
    <div style="
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #C9485B;
      border: 3px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      animation: pin-pulse 1.4s ease-out infinite;
      cursor: grab;
    ">📍</div>
  `,
})

interface Props {
  position: { lat: number; lng: number }
}

export default function PinCreationMarker({ position }: Props) {
  const map = useMap()
  const store = useMapStore()
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng()
      store.startCreation({ lat, lng }, store.prefilledCity!)
    })
  }, [store])

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={CREATION_ICON}
      draggable
      ref={markerRef}
    >
      <Tooltip permanent direction="top" offset={[0, -52]}>
        Arraste para ajustar a posição
      </Tooltip>
    </Marker>
  )
}
