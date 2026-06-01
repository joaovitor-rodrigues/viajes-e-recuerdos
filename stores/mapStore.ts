import { create } from 'zustand'
import type { Map as LeafletMap } from 'leaflet'
import type { GeocodingResult } from '@/lib/geocoding'

interface CreationPosition {
  lat: number
  lng: number
}

interface MapStore {
  mapRef: LeafletMap | null
  creationMode: boolean
  creationPosition: CreationPosition | null
  prefilledCity: GeocodingResult | null
  setMapRef: (map: LeafletMap) => void
  startCreation: (position: CreationPosition, city: GeocodingResult) => void
  endCreation: () => void
  flyTo: (lat: number, lng: number, zoom?: number) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  mapRef: null,
  creationMode: false,
  creationPosition: null,
  prefilledCity: null,

  setMapRef: (map) => set({ mapRef: map }),

  startCreation: (position, city) =>
    set({ creationMode: true, creationPosition: position, prefilledCity: city }),

  endCreation: () =>
    set({ creationMode: false, creationPosition: null, prefilledCity: null }),

  flyTo: (lat, lng, zoom = 12) => {
    get().mapRef?.flyTo([lat, lng], zoom, { duration: 1.5 })
  },
}))
