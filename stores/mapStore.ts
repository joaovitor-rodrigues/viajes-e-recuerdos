import { create } from 'zustand'
import type { GeocodingResult } from '@/lib/geocoding'
import type { Pin } from '@/types/database'

interface CreationPosition {
  lat: number
  lng: number
}

interface MapInstance {
  flyTo: (opts: { center: [number, number]; zoom: number; duration: number }) => void
}

interface MapStore {
  mapRef: MapInstance | null
  creationMode: boolean
  creationPosition: CreationPosition | null
  prefilledCity: GeocodingResult | null
  selectedPin: Pin | null
  editingPin: Pin | null
  interactionMode: 'hand' | 'pin'

  setMapRef: (map: MapInstance) => void
  startCreation: (position: CreationPosition, city: GeocodingResult) => void
  endCreation: () => void
  flyTo: (lat: number, lng: number, zoom?: number) => void
  selectPin: (pin: Pin | null) => void
  startEditing: (pin: Pin) => void   // detail → edit (atomic: clears selectedPin)
  resumeDetail: () => void            // edit → detail (atomic: restores editingPin as selectedPin)
  stopEditing: () => void             // edit → clean map
  setInteractionMode: (mode: 'hand' | 'pin') => void
  toggleInteractionMode: () => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  mapRef: null,
  creationMode: false,
  creationPosition: null,
  prefilledCity: null,
  selectedPin: null,
  editingPin: null,
  interactionMode: 'hand',

  setMapRef: (map) => set({ mapRef: map }),

  startCreation: (position, city) =>
    set({ creationMode: true, creationPosition: position, prefilledCity: city }),

  endCreation: () =>
    set({ creationMode: false, creationPosition: null, prefilledCity: null }),

  flyTo: (lat, lng, zoom = 5) => {
    get().mapRef?.flyTo({ center: [lng, lat], zoom, duration: 1500 })
  },

  selectPin: (pin) => set({ selectedPin: pin }),

  startEditing: (pin) => set({ editingPin: pin, selectedPin: null }),

  resumeDetail: () => set((s) => ({ selectedPin: s.editingPin, editingPin: null })),

  stopEditing: () => set({ editingPin: null }),

  setInteractionMode: (mode) => set({ interactionMode: mode }),
  toggleInteractionMode: () =>
    set((s) => ({ interactionMode: s.interactionMode === 'hand' ? 'pin' : 'hand' })),
}))
