export interface MediaItem {
  url: string
  caption: string
  type: 'image' | 'video'
}

export interface Pin {
  id: string
  latitude: number
  longitude: number
  city: string
  state: string | null
  country: string
  title: string
  description: string | null
  pin_date: string
  media: MediaItem[]
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface VisualTheme {
  id: number
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  map_style: 'dark' | 'light' | 'watercolor' | 'minimal' | 'osm'
  enable_particles: boolean
  enable_glow: boolean
  enable_animations: boolean
  font_family: string
  sidebar_position: 'left' | 'right' | 'hidden'
  updated_at: string
}

export type PinInsert = Omit<Pin, 'id' | 'created_at' | 'updated_at'>
export type PinUpdate = Partial<PinInsert>
