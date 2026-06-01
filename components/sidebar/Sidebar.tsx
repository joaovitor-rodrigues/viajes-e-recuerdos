'use client'

import { useThemeStore } from '@/stores/themeStore'
import StatsBar from './StatsBar'
import PinList from './PinList'

export default function Sidebar() {
  const position = useThemeStore((s) => s.theme.sidebar_position)

  if (position === 'hidden') return null

  const isRight = position === 'right'

  return (
    <div
      className="sidebar-panel"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [isRight ? 'right' : 'left']: 0,
        zIndex: 500,
        width: 320,
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(16px)',
        borderLeft: isRight ? '1px solid rgba(255,255,255,0.07)' : 'none',
        borderRight: isRight ? 'none' : '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <h1 style={{
          margin: 0, fontSize: 16,
          fontFamily: 'var(--font-family, "Cormorant Garamond", serif)',
          fontWeight: 400, color: '#f0ece4', letterSpacing: '0.05em',
        }}>
          Viajes e Recuerdos
        </h1>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#555' }}>
          suas memórias pelo mundo
        </p>
      </div>

      <StatsBar />
      <PinList />
    </div>
  )
}
