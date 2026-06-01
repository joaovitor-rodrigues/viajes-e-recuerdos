'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { GlobeMethods } from 'react-globe.gl'
import type { Feature } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
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

// Visual config per map style — no photorealistic textures, purely polygon-based
const MAP_CONFIG = {
  light: {
    ocean:      '#a8cfe8',   // Google Maps–style light blue ocean
    land:       '#e8efdf',   // soft green land
    landSide:   '#ccd8c0',
    border:     '#ffffff',
    atmosphere: 'rgba(100,160,255,0.5)',
    background: 'radial-gradient(ellipse at center, #1a3060 0%, #080818 100%)',
  },
  watercolor: {
    ocean:      '#c8b99a',   // aged parchment ocean
    land:       '#d9c4a0',   // warm tan land
    landSide:   '#c4aa80',
    border:     '#7a5430',   // dark brown borders
    atmosphere: 'rgba(180,140,70,0.4)',
    background: 'radial-gradient(ellipse at center, #2a1a08 0%, #0a0604 100%)',
  },
} as const

type StyleKey = keyof typeof MAP_CONFIG

// Generate a 4×2 solid-color canvas data URI for the globe ocean base
function oceanDataUri(hex: string): string {
  if (typeof document === 'undefined') return ''
  const c = document.createElement('canvas')
  c.width = 4; c.height = 2
  const ctx = c.getContext('2d')!
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, 4, 2)
  return c.toDataURL()
}

interface OrbitControlsLike {
  enablePan: boolean
  minDistance: number
  maxDistance: number
  zoomSpeed: number
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
  const globeEl          = useRef<GlobeMethods | undefined>(undefined)
  const globeInitialized = useRef(false)
  const containerRef     = useRef<HTMLDivElement>(null)
  const [size, setSize]      = useState({ w: 800, h: 600 })
  const [countries, setCountries] = useState<Feature[]>([])

  const setPins = usePinsStore((s) => s.setPins)
  const pins    = usePinsStore((s) => s.pins)
  const { creationMode, creationPosition, setGlobeRef, startCreation } = useMapStore()

  useTheme(serverTheme)
  useRealtimeSync()

  useEffect(() => { setPins(initialPins) }, [initialPins, setPins])

  // Load country polygons once (world-atlas topojson → geojson features)
  useEffect(() => {
    Promise.all([
      import('topojson-client'),
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then((r) => r.json()),
    ]).then(([{ feature }, topo]) => {
      const topology = topo as Topology
      const geo = feature(topology, topology.objects.countries as GeometryCollection)
      setCountries(geo.features)
    })
  }, [])

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(containerRef.current)
    setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight })
    return () => observer.disconnect()
  }, [])

  // Runs after every render until Globe has mounted and ref is populated
  useEffect(() => {
    if (!globeEl.current || globeInitialized.current) return
    globeInitialized.current = true
    const globe = globeEl.current
    setGlobeRef({ pointOfView: (pov, ms) => globe.pointOfView(pov, ms) })
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0)
    const controls = globe.controls() as OrbitControlsLike
    controls.enablePan   = false
    controls.minDistance = 110
    controls.maxDistance = 420
    controls.zoomSpeed   = 2.0
  })

  const liveMapStyle = useThemeStore((s) => s.theme.map_style)
  const liveGlow     = useThemeStore((s) => s.theme.enable_glow)

  const style = MAP_CONFIG[liveMapStyle as StyleKey] ?? MAP_CONFIG.light

  // Solid-color ocean texture (data URI) — only recalculate when style changes
  const oceanTexture = useMemo(() => oceanDataUri(style.ocean), [style.ocean])

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
        <style>@keyframes cp{0%{box-shadow:0 0 0 0 rgba(201,72,91,.7)}70%{box-shadow:0 0 0 14px rgba(201,72,91,0)}100%{box-shadow:0 0 0 0 rgba(201,72,91,0)}}</style>
        <div style="width:44px;height:44px;border-radius:50%;background:#C9485B;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;animation:cp 1.4s ease-out infinite;">📍</div>
      `
      return el
    }

    const pin   = point.pin!
    const color = pin.color ?? '#C9485B'
    const shadow = liveGlow ? `box-shadow:0 0 8px 3px ${color}88,0 0 16px 6px ${color}44;` : ''

    const el = document.createElement('div')
    el.style.cssText = `
      width:36px;height:36px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};
      ${shadow}
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      transition:transform 0.15s ease;
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
          background: style.background,
          overflow: 'hidden',
        }}
      >
        <Globe
          ref={globeEl}
          width={size.w}
          height={size.h}
          globeImageUrl={oceanTexture}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor={style.atmosphere}
          atmosphereAltitude={0.12}
          polygonsData={countries}
          polygonGeoJsonGeometry={(d: object) => (d as Feature).geometry!}
          polygonCapColor={() => style.land}
          polygonSideColor={() => style.landSide}
          polygonStrokeColor={() => style.border}
          polygonAltitude={0.006}
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
