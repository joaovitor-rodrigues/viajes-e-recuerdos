'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl/maplibre'
import type { MapRef, MapMouseEvent } from 'react-map-gl/maplibre'
import { formatShortDateRange } from '@/lib/dateRange'
import { motion, AnimatePresence } from 'framer-motion'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Pin, MediaItem, VisualTheme } from '@/types/database'
import { usePinsStore } from '@/stores/pinsStore'
import { useMapStore } from '@/stores/mapStore'
import { useTheme } from '@/hooks/useTheme'
import { useRealtimeSync } from '@/hooks/usePins'
import { isGPhotosUrl } from '@/lib/googlePhotos'
import { validateAndParseMediaUrl } from '@/lib/drive'
import CitySearchBox from './CitySearchBox'
import PinCreateModal from '@/components/pins/PinCreateModal'
import FloatingPinPanel from '@/components/sidebar/FloatingPinPanel'
import PinDetailOverlay from './PinDetailOverlay'
import PinEditOverlay from './PinEditOverlay'

function mediaSrc(item: MediaItem): string {
  if (isGPhotosUrl(item.url)) return `/api/photos/proxy?url=${encodeURIComponent(item.url)}`
  return validateAndParseMediaUrl(item.url)?.displayUrl ?? item.url
}

const MAP_STYLE_URL  = 'https://tiles.openfreemap.org/styles/liberty'
const VINTAGE_FILTER = 'sepia(0.48) saturate(0.62) brightness(1.04) hue-rotate(-4deg)'

function toXYZ(lat: number, lng: number): [number, number, number] {
  const φ = (lat * Math.PI) / 180
  const λ = (lng * Math.PI) / 180
  return [Math.cos(φ) * Math.cos(λ), Math.sin(φ), Math.cos(φ) * Math.sin(λ)]
}

function dotXYZ(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

interface HoveredPin {
  pin: Pin
  x: number
  y: number
}

interface Props {
  initialPins: Pin[]
  theme: VisualTheme | null
}

export default function MapContainer({ initialPins, theme: serverTheme }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [mapVisible, setMapVisible] = useState(true)

  const pinElemsRef   = useRef<Record<string, HTMLDivElement | null>>({})
  const hoveredPinRef = useRef<HoveredPin | null>(null)
  const [hoveredPin, setHoveredPin] = useState<HoveredPin | null>(null)

  const setPins = usePinsStore((s) => s.setPins)
  const pins    = usePinsStore((s) => s.pins)
  const { creationMode, creationPosition, setMapRef, startCreation, selectedPin, selectPin, editingPin, interactionMode, flyTo } = useMapStore()

  useTheme(serverTheme)
  useRealtimeSync()

  useEffect(() => { setPins(initialPins) }, [initialPins, setPins])

  // Hide map whenever any overlay is active
  useEffect(() => {
    if (selectedPin || editingPin) setMapVisible(false)
  }, [selectedPin, editingPin])

  const handleMapLoad = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    setMapRef({ flyTo: (opts) => map.flyTo({ center: opts.center, zoom: opts.zoom, duration: opts.duration }) })
    try { map.setProjection({ type: 'globe' }) } catch { /* not supported */ }
    map.on('mousedown', (e) => {
      if (e.originalEvent.button === 1) {
        e.originalEvent.preventDefault()
        useMapStore.getState().toggleInteractionMode()
      }
    })
    map.resize()
    setGlobeReady(true)
  }, [setMapRef])

  const projectPins = useCallback(() => {
    if (!mapRef.current) return
    const map    = mapRef.current.getMap()
    const canvas = map.getCanvas()
    const dpr    = window.devicePixelRatio || 1
    const W      = canvas.width  / dpr
    const H      = canvas.height / dpr
    const zoom   = map.getZoom()

    const center  = map.getCenter()
    const camVec  = toXYZ(center.lat, center.lng)
    const isGlobe = zoom < 6.5

    const bounds = map.getBounds()
    const west   = bounds.getWest()
    const east   = bounds.getEast()
    const south  = bounds.getSouth()
    const north  = bounds.getNorth()

    pins.forEach((pin) => {
      const el = pinElemsRef.current[pin.id]
      if (!el) return
      const pt = map.project([pin.longitude, pin.latitude])
      const onFrontSide = !isGlobe || dotXYZ(camVec, toXYZ(pin.latitude, pin.longitude)) > 0
      // Normalise pin longitude into [west, west+360) to handle world-wrapping
      const normLng     = ((pin.longitude - west) % 360 + 360) % 360 + west
      const inGeoBounds = pin.latitude >= south && pin.latitude <= north && normLng <= east
      const inViewport  = pt.x > -30 && pt.x < W + 30 && pt.y > -30 && pt.y < H + 30
      const visible = onFrontSide && inGeoBounds && inViewport
      el.style.visibility = visible ? 'visible' : 'hidden'
      if (!visible && hoveredPinRef.current?.pin.id === pin.id) {
        hoveredPinRef.current = null
        setHoveredPin(null)
      }
      el.style.transform = `translate(${pt.x - 9}px, ${pt.y - 9}px)`
    })
  }, [pins])

  useEffect(() => { if (globeReady) projectPins() }, [globeReady, projectPins])

  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    if (creationMode || interactionMode !== 'pin') return
    const { lat, lng } = e.lngLat
    try {
      const res = await fetch(`/api/geocoding/reverse?lat=${lat}&lng=${lng}`)
      const city = await res.json()
      if (city) startCreation({ lat, lng }, city)
    } catch {
      startCreation({ lat, lng }, { displayName: '', city: '', state: null, country: '', lat, lng })
    }
  }, [creationMode, interactionMode, startCreation])

  // Only restore the map when ALL overlays have finished exiting
  const handleDetailExitComplete = useCallback(() => {
    if (!useMapStore.getState().editingPin) setMapVisible(true)
  }, [])

  const handleEditExitComplete = useCallback(() => {
    if (!useMapStore.getState().selectedPin) setMapVisible(true)
  }, [])

  return (
    <div style={{
      position: 'relative', height: '100vh', width: '100%',
      backgroundColor: '#ddd0b0',
      backgroundImage: [
        'repeating-linear-gradient(0deg,   transparent, transparent 39px, rgba(120,85,35,0.09) 39px, rgba(120,85,35,0.09) 40px)',
        'repeating-linear-gradient(90deg,  transparent, transparent 39px, rgba(120,85,35,0.09) 39px, rgba(120,85,35,0.09) 40px)',
        'repeating-linear-gradient(45deg,  rgba(120,85,35,0.025) 0, rgba(120,85,35,0.025) 1px, transparent 0, transparent 50%)',
        'repeating-linear-gradient(-45deg, rgba(120,85,35,0.025) 0, rgba(120,85,35,0.025) 1px, transparent 0, transparent 50%)',
      ].join(', '),
      backgroundSize: '40px 40px, 40px 40px, 10px 10px, 10px 10px',
    }}>
      {/* ── Map layer ── */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: mapVisible && globeReady ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: mapVisible ? 'auto' : 'none',
      }}>
        <div style={{ position: 'absolute', inset: 0, filter: VINTAGE_FILTER, overflow: 'hidden' }}>
          <Map
            ref={mapRef}
            initialViewState={{ latitude: 20, longitude: 0, zoom: 2 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE_URL}
            cursor={creationMode ? 'crosshair' : interactionMode === 'pin' ? 'cell' : undefined}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
            onMove={projectPins}
          >
            <NavigationControl position="bottom-right" />
            <ScaleControl position="bottom-left" unit="metric" />
            {creationMode && creationPosition && (
              <Marker latitude={creationPosition.lat} longitude={creationPosition.lng} anchor="center">
                <CreationMarker />
              </Marker>
            )}
          </Map>
        </div>

        {globeReady && (
          <button
            onClick={() => flyTo(20, 0, 2)}
            title="Ver globo inteiro"
            style={{
              position: 'absolute', bottom: 116, right: 10, zIndex: 5,
              width: 29, height: 29,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(253,248,238,0.95)',
              border: '1px solid rgba(160,120,72,0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              color: '#7a6050',
              boxShadow: '0 2px 8px rgba(80,50,20,0.14)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(241,233,210,0.97)'; (e.currentTarget as HTMLButtonElement).style.color = '#4a3520' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(253,248,238,0.95)'; (e.currentTarget as HTMLButtonElement).style.color = '#7a6050' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>
        )}

        {globeReady && (
          <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}
            onMouseLeave={() => { hoveredPinRef.current = null; setHoveredPin(null) }}
          >
            {pins.map((pin) => (
              <div
                key={pin.id}
                ref={(el) => { pinElemsRef.current[pin.id] = el }}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto', cursor: 'pointer', visibility: 'hidden' }}
                onClick={() => selectPin(pin)}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                  const state: HoveredPin = { pin, x: rect.left + 9, y: rect.top + 9 }
                  hoveredPinRef.current = state
                  setHoveredPin(state)
                }}
                onMouseLeave={() => { hoveredPinRef.current = null; setHoveredPin(null) }}
              >
                <PinDot color={pin.color ?? '#C9485B'} />
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {hoveredPin && (
            <PinTooltip key={hoveredPin.pin.id} pin={hoveredPin.pin} anchorX={hoveredPin.x} anchorY={hoveredPin.y} />
          )}
        </AnimatePresence>

        <CitySearchBox />
        <FloatingPinPanel />
        <PinCreateModal />
      </div>

      {/* ── Pin detail overlay ── */}
      <AnimatePresence onExitComplete={handleDetailExitComplete}>
        {selectedPin && (
          <PinDetailOverlay
            key={selectedPin.id}
            pin={selectedPin}
            onClose={() => selectPin(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Pin edit overlay ── */}
      <AnimatePresence onExitComplete={handleEditExitComplete}>
        {editingPin && (
          <PinEditOverlay
            key={editingPin.id}
            pin={editingPin}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PinDot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 18, height: 18,
        borderRadius: '50%',
        background: color,
        border: '3px solid #fff',
        boxShadow: `0 2px 8px rgba(0,0,0,0.45), 0 0 0 1px ${color}66`,
        transition: 'transform 0.12s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.5)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
    />
  )
}

function PinTooltip({ pin, anchorX, anchorY }: { pin: Pin; anchorX: number; anchorY: number }) {
  const photos = (pin.media ?? []).filter((m) => m.type === 'image').slice(0, 2)
  const W = 224

  const spaceRight = typeof window !== 'undefined' ? window.innerWidth - anchorX : 999
  const left = spaceRight >= W + 24 ? anchorX + 14 : anchorX - W - 10
  const top  = Math.max(8, anchorY - 72)

  const formattedDate = formatShortDateRange(pin.start_date, pin.end_date)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      style={{
        position: 'fixed',
        left, top,
        width: W,
        zIndex: 1000,
        pointerEvents: 'none',
        background: 'rgba(253,248,238,0.98)',
        border: '1px solid rgba(160,120,72,0.28)',
        borderLeft: `3px solid ${pin.color ?? '#C9485B'}`,
        borderRadius: 6,
        padding: '10px 12px',
        boxShadow: '0 4px 20px rgba(80,50,20,0.22)',
      }}
    >
      <p style={{
        margin: '0 0 3px', fontSize: 14, fontWeight: 600,
        fontFamily: '"Cormorant Garamond", serif',
        color: '#2c1a0e', lineHeight: 1.25,
      }}>
        {pin.title}
      </p>
      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#7a6050', fontFamily: '"Inter", sans-serif' }}>
        {[pin.city, pin.country].filter(Boolean).join(' · ')}
      </p>
      <p style={{ margin: photos.length ? '0 0 8px' : 0, fontSize: 10, color: '#a07840', fontFamily: '"Inter", sans-serif', fontStyle: 'italic' }}>
        {formattedDate}
      </p>
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 5 }}>
          {photos.map((photo, i) => (
            <div
              key={i}
              style={{
                flex: 1, minWidth: 0, height: 64, borderRadius: 3, overflow: 'hidden',
                border: '1px solid rgba(160,120,72,0.15)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaSrc(photo)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function CreationMarker() {
  return (
    <>
      <style>{`@keyframes vr-pulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.4);opacity:0}}`}</style>
      <div style={{ position: 'relative', width: 20, height: 20 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: '#C9485B',
          animation: 'vr-pulse 1.2s ease-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 4, borderRadius: '50%',
          background: '#C9485B', border: '2px solid #fff',
        }} />
      </div>
    </>
  )
}
