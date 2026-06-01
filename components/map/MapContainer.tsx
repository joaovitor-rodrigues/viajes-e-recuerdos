'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Pin, VisualTheme } from '@/types/database'
import { usePinsStore } from '@/stores/pinsStore'
import { useMapStore } from '@/stores/mapStore'
import { useTheme } from '@/hooks/useTheme'
import { useRealtimeSync } from '@/hooks/usePins'
import { useThemeStore } from '@/stores/themeStore'
import CitySearchBox from './CitySearchBox'
import PinCreateModal from '@/components/pins/PinCreateModal'
import FloatingPinPanel from '@/components/sidebar/FloatingPinPanel'
import ThemePanel from '@/components/theme/ThemePanel'
import ParticleCanvas from '@/components/theme/ParticleCanvas'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })

const GLOBE_TEXTURES: Record<string, string> = {
  light:      '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  watercolor: '//unpkg.com/three-globe/example/img/earth-topology.png',
  // fallbacks for legacy DB values
  dark:       '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  minimal:    '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  osm:        '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
}

const GLOBE_ATMOSPHERE: Record<string, string> = {
  light:      'rgba(100,160,255,0.55)',
  watercolor: 'rgba(200,150,80,0.5)',
}

interface GlobePoint {
  _type: 'pin' | 'creation'
  lat: number
  lng: number
  pin?: Pin
}

interface Props {
  initialPins: Pin[]
  theme: VisualTheme | null
}

export default function MapContainer({ initialPins, theme: serverTheme }: Props) {
  const router = useRouter()
  const globeEl = useRef<any>(null)
  const globeInitialized = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  const setPins = usePinsStore((s) => s.setPins)
  const pins    = usePinsStore((s) => s.pins)
  const { creationMode, creationPosition, setGlobeRef, startCreation } = useMapStore()

  useTheme(serverTheme)
  useRealtimeSync()

  useEffect(() => { setPins(initialPins) }, [initialPins, setPins])

  // Track container size for Globe dimensions
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    observer.observe(containerRef.current)
    setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight })
    return () => observer.disconnect()
  }, [])

  // Callback ref: fires once when the Globe element mounts
  const onGlobeRef = useCallback((el: any) => {
    if (!el || globeInitialized.current) return
    globeInitialized.current = true
    globeEl.current = el
    setGlobeRef(el)
    el.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0)

    // Configure OrbitControls
    const controls = el.controls()
    controls.enablePan  = false        // no panning off-axis
    controls.minDistance = 110         // close zoom limit
    controls.maxDistance = 420         // max zoom out (~altitude 3.2)
    controls.zoomSpeed   = 2.0         // 2× more sensitive
  }, [setGlobeRef])

  const liveMapStyle    = useThemeStore((s) => s.theme.map_style)
  const liveGlow        = useThemeStore((s) => s.theme.enable_glow)
  const textureUrl      = GLOBE_TEXTURES[liveMapStyle] ?? GLOBE_TEXTURES.light
  const atmosphereColor = GLOBE_ATMOSPHERE[liveMapStyle] ?? GLOBE_ATMOSPHERE.light

  const globeData = useMemo<GlobePoint[]>(() => [
    ...pins.map((p) => ({ _type: 'pin' as const, lat: p.latitude, lng: p.longitude, pin: p })),
    ...(creationMode && creationPosition
      ? [{ _type: 'creation' as const, lat: creationPosition.lat, lng: creationPosition.lng }]
      : []),
  ], [pins, creationMode, creationPosition])

  const getHtmlElement = useCallback((d: object): HTMLElement => {
    const point = d as GlobePoint

    if (point._type === 'creation') {
      const el = document.createElement('div')
      el.style.cssText = 'pointer-events: none;'
      el.innerHTML = `
        <style>@keyframes cp { 0%{box-shadow:0 0 0 0 rgba(201,72,91,.7)} 70%{box-shadow:0 0 0 14px rgba(201,72,91,0)} 100%{box-shadow:0 0 0 0 rgba(201,72,91,0)} }</style>
        <div style="width:44px;height:44px;border-radius:50%;background:#C9485B;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;animation:cp 1.4s ease-out infinite;">📍</div>
      `
      return el
    }

    const pin = point.pin!
    const color = pin.color ?? '#C9485B'
    const shadow = liveGlow
      ? `box-shadow: 0 0 8px 3px ${color}88, 0 0 16px 6px ${color}44;`
      : ''

    const el = document.createElement('div')
    el.style.cssText = `
      width: 36px; height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: ${color};
      ${shadow}
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
    `
    el.innerHTML = `<span style="transform:rotate(45deg);font-size:16px;line-height:1;display:block;">${pin.icon ?? '📍'}</span>`
    el.addEventListener('click', () => router.push(`/pin/${pin.id}`))
    el.addEventListener('mouseenter', () => { el.style.transform = 'rotate(-45deg) scale(1.2)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'rotate(-45deg)' })
    return el
  }, [liveGlow, router])

  const handleGlobeClick = useCallback(async (coords: { lat: number; lng: number }) => {
    if (creationMode) return
    try {
      const res = await fetch(`/api/geocoding/reverse?lat=${coords.lat}&lng=${coords.lng}`)
      const city = await res.json()
      if (city) startCreation({ lat: coords.lat, lng: coords.lng }, city)
    } catch {
      startCreation(
        { lat: coords.lat, lng: coords.lng },
        { displayName: '', city: '', state: null, country: '', lat: coords.lat, lng: coords.lng },
      )
    }
  }, [creationMode, startCreation])

  return (
    <>
      <ParticleCanvas />
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          background: 'radial-gradient(ellipse at center, #1a1040 0%, #080812 100%)',
          overflow: 'hidden',
        }}
      >
        <Globe
          ref={onGlobeRef}
          width={size.w}
          height={size.h}
          globeImageUrl={textureUrl}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor={atmosphereColor}
          atmosphereAltitude={0.12}
          htmlElementsData={globeData}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.01}
          htmlElement={getHtmlElement}
          onGlobeClick={handleGlobeClick}
        />

        <CitySearchBox />
        <FloatingPinPanel />
        <ThemePanel />
        <PinCreateModal />
      </div>
    </>
  )
}
