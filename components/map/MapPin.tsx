'use client'

import { useRouter } from 'next/navigation'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { Pin } from '@/types/database'

interface Props {
  pin: Pin
  enableGlow: boolean
}

function createPinIcon(color: string, icon: string, glow: boolean): L.DivIcon {
  const shadow = glow
    ? `box-shadow: 0 0 8px 3px ${color}88, 0 0 16px 6px ${color}44;`
    : ''

  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${color};
        ${shadow}
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      " class="map-pin-inner">
        <span style="
          transform: rotate(45deg);
          font-size: 18px;
          line-height: 1;
          display: block;
          text-align: center;
        ">${icon}</span>
      </div>
    `,
  })
}

export default function MapPin({ pin, enableGlow }: Props) {
  const router = useRouter()
  const icon = createPinIcon(pin.color, pin.icon ?? '', enableGlow)

  return (
    <Marker
      position={[pin.latitude, pin.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => router.push(`/pin/${pin.id}`),
      }}
    />
  )
}
