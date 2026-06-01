import { create } from 'zustand'
import type { Pin } from '@/types/database'

interface PinsStore {
  pins: Pin[]
  isLoading: boolean
  error: string | null
  setPins: (pins: Pin[]) => void
  addPin: (pin: Pin) => void
  updatePin: (id: string, pin: Partial<Pin>) => void
  removePin: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const usePinsStore = create<PinsStore>((set) => ({
  pins: [],
  isLoading: false,
  error: null,

  setPins: (pins) => set({ pins }),

  addPin: (pin) => set((state) => ({ pins: [pin, ...state.pins] })),

  updatePin: (id, updated) =>
    set((state) => ({
      pins: state.pins.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    })),

  removePin: (id) =>
    set((state) => ({ pins: state.pins.filter((p) => p.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),
}))
