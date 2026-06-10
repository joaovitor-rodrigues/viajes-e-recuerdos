'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/stores/themeStore'
import StatsBar from './StatsBar'
import PinList from './PinList'

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function Sidebar() {
  const position = useThemeStore((s) => s.theme.sidebar_position)
  const router   = useRouter()

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  if (position === 'hidden') return null
  const isRight = position === 'right'

  return (
    <div
      className="sidebar-panel"
      style={{
        position: 'absolute',
        top: 0, bottom: 0,
        [isRight ? 'right' : 'left']: 0,
        zIndex: 500,
        width: 300,
        background: 'rgba(249,243,232,0.97)',
        backdropFilter: 'blur(20px)',
        borderLeft:  isRight ? '1px solid rgba(160,120,72,0.18)' : 'none',
        borderRight: isRight ? 'none' : '1px solid rgba(160,120,72,0.18)',
        boxShadow: isRight
          ? '-4px 0 24px rgba(80,50,20,0.1)'
          : '4px 0 24px rgba(80,50,20,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(160,120,72,0.14)',
        background: 'rgba(241,233,215,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 16,
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600, color: '#2c1a0e', letterSpacing: '0.04em',
          }}>
            Viajes e Recuerdos
          </h1>
          <p style={{
            margin: '3px 0 0', fontSize: 11,
            color: '#9a8068',
            fontFamily: '"Inter", sans-serif',
          }}>
            suas memórias pelo mundo
          </p>
        </div>

        <button
          onClick={handleLogout}
          title="Sair"
          style={{
            background: 'none',
            border: '1px solid rgba(160,120,72,0.25)',
            borderRadius: 8,
            color: '#9a8068',
            cursor: 'pointer',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontFamily: '"Inter", sans-serif',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget
            b.style.color = '#C9485B'
            b.style.borderColor = 'rgba(201,72,91,0.35)'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget
            b.style.color = '#9a8068'
            b.style.borderColor = 'rgba(160,120,72,0.25)'
          }}
        >
          <LogoutIcon />
          Sair
        </button>
      </div>

      <StatsBar />
      <PinList />
    </div>
  )
}
