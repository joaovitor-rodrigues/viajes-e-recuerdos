import { create } from 'zustand'
import type { VisualTheme } from '@/types/database'

export const DEFAULT_THEME: VisualTheme = {
  id: 1,
  primary_color: '#C9485B',
  secondary_color: '#4ECDC4',
  background_color: '#0f0f1a',
  text_color: '#f0ece4',
  map_style: 'dark',
  enable_particles: true,
  enable_glow: true,
  enable_animations: true,
  font_family: 'Inter',
  sidebar_position: 'right',
  updated_at: '',
}

interface ThemeStore {
  theme: VisualTheme
  setTheme: (theme: VisualTheme) => void
  updateTheme: (partial: Partial<VisualTheme>) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: DEFAULT_THEME,
  setTheme: (theme) => set({ theme }),
  updateTheme: (partial) => set((state) => ({ theme: { ...state.theme, ...partial } })),
}))
