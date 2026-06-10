import { create } from 'zustand'
import type { VisualTheme } from '@/types/database'

export const DEFAULT_THEME: VisualTheme = {
  id: 1,
  primary_color:    '#C9485B',
  secondary_color:  '#8a6030',
  background_color: '#f5ede0',
  text_color:       '#2c1a0e',
  map_style:        'watercolor',
  enable_particles: false,
  enable_glow:      false,
  enable_animations: true,
  font_family:      'Cormorant Garamond',
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
