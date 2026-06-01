'use client'

import { useEffect } from 'react'
import { useThemeStore, DEFAULT_THEME } from '@/stores/themeStore'
import type { VisualTheme } from '@/types/database'
import createClient from '@/lib/supabase/client'

function applyCSSVars(theme: VisualTheme) {
  const root = document.documentElement
  root.style.setProperty('--primary-color',   theme.primary_color)
  root.style.setProperty('--secondary-color', theme.secondary_color)
  root.style.setProperty('--bg-color',        theme.background_color)
  root.style.setProperty('--text-color',      theme.text_color)
  root.style.setProperty('--font-family',     `'${theme.font_family}', serif`)
}

export function useTheme(initialTheme?: VisualTheme | null) {
  const { theme, setTheme, updateTheme } = useThemeStore()

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyCSSVars(theme)
  }, [theme])

  // Realtime subscription for visual_theme updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('visual_theme')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visual_theme', filter: 'id=eq.1' },
        (payload) => {
          updateTheme(payload.new as Partial<VisualTheme>)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateAndSync(partial: Partial<VisualTheme>) {
    updateTheme(partial)
    await fetch('/api/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    })
  }

  async function resetToDefault() {
    const defaults = { ...DEFAULT_THEME }
    delete (defaults as Partial<VisualTheme>).id
    delete (defaults as Partial<VisualTheme>).updated_at
    updateTheme(DEFAULT_THEME)
    await fetch('/api/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaults),
    })
  }

  return { theme, updateAndSync, resetToDefault }
}
