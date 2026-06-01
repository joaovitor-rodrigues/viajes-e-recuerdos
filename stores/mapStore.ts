import { create } from 'zustand'
import type { GeocodingResult } from '@/lib/geocoding'

interface CreationPosition {
  lat: number
  lng: number
}

interface GlobeInstance {
  pointOfView: (pov: { lat: number; lng: number; altitude?: number }, ms?: number) => void
  camera: () => { position: { x: number; y: number; z: number } }
}

interface MapStore {
  globeRef: GlobeInstance | null
  creationMode: boolean
  creationPosition: CreationPosition | null
  prefilledCity: GeocodingResult | null
  setGlobeRef: (globe: GlobeInstance) => void
  startCreation: (position: CreationPosition, city: GeocodingResult) => void
  endCreation: () => void
  flyTo: (lat: number, lng: number, zoom?: number) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  globeRef: null,
  creationMode: false,
  creationPosition: null,
  prefilledCity: null,

  setGlobeRef: (globe) => set({ globeRef: globe }),

  startCreation: (position, city) =>
    set({ creationMode: true, creationPosition: position, prefilledCity: city }),

  endCreation: () =>
    set({ creationMode: false, creationPosition: null, prefilledCity: null }),

  flyTo: (lat, lng, zoom = 5) => {
    const altitude = zoom >= 10 ? 0.5 : 2.0
    get().globeRef?.pointOfView({ lat, lng, altitude }, 1500)
  },
}))
