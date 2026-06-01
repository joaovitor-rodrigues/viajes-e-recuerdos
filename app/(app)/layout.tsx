'use client'

import { useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useThemeStore } from '@/stores/themeStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useTheme()

  const bgColor   = useThemeStore((s) => s.theme.background_color)
  const textColor = useThemeStore((s) => s.theme.text_color)

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      color: textColor,
      fontFamily: 'var(--font-family)',
    }}>
      {children}
    </div>
  )
}
