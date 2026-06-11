'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import StatsBar from './StatsBar'
import PinList from './PinList'
import { useMapStore } from '@/stores/mapStore'

const SIDEBAR_W = 300

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

const LABELS: { label: string; slug: string }[] = [
  { label: 'João',    slug: 'joão' },
  { label: 'Jéssica', slug: 'jéssica' },
]

type AccountRow = { label: string; email: string }

function GoogleAccountsBar() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])

  useEffect(() => {
    const refetch = () => {
      fetch('/api/photos/accounts')
        .then(r => r.ok ? r.json() : [])
        .then((rows: AccountRow[]) => setAccounts(rows))
        .catch(() => {})
    }

    refetch()

    const onFocus = () => refetch()
    const onVisible = () => { if (!document.hidden) refetch() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid rgba(160,120,72,0.12)',
      background: 'rgba(241,233,210,0.3)',
    }}>
      <p style={{ margin: '0 0 7px', fontSize: 9, color: '#a07840', fontFamily: '"Inter",sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
        Google Fotos
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        {LABELS.map(({ label, slug }) => {
          const row   = accounts.find(r => r.label === slug)
          const valid = !!row

          const borderColor = valid ? 'rgba(52,168,83,0.45)' : 'rgba(160,120,72,0.25)'
          const bgColor     = valid ? 'rgba(52,168,83,0.07)' : 'rgba(160,120,72,0.05)'
          const textColor   = valid ? '#2a7a50'              : '#9a8068'

          return (
            <a
              key={slug}
              href={!valid ? `/api/auth/google?label=${encodeURIComponent(slug)}` : undefined}
              title={valid ? row?.email ?? label : `Conectar conta de ${label}`}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 6px 5px', borderRadius: 4, textDecoration: 'none',
                fontFamily: '"Inter",sans-serif', letterSpacing: '0.02em',
                border: `1px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                cursor: valid ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {valid ? (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                ) : '+'}
                {label}
              </span>
              {valid && row?.email && (
                <span style={{ fontSize: 9, color: '#5a9a78', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.email.replace(/@.*/, '')}
                </span>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default function FloatingPinPanel() {
  const [open, setOpen] = useState(true)
  const router = useRouter()
  const interactionMode  = useMapStore((s) => s.interactionMode)
  const setInteractionMode = useMapStore((s) => s.setInteractionMode)

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  const btnStyle: React.CSSProperties = {
    flexShrink: 0,
    background: 'rgba(160,120,72,0.07)',
    border: '1px solid rgba(160,120,72,0.22)',
    borderRadius: 4,
    padding: '5px 7px',
    cursor: 'pointer',
    color: '#9a8068',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    fontFamily: '"Inter", sans-serif',
    transition: 'all 0.18s',
  }

  return (
    <motion.div
      animate={{ x: open ? 0 : SIDEBAR_W }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed',
        top: 0, right: 0,
        height: '100vh',
        width: SIDEBAR_W,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(253,248,238,0.97)',
        borderLeft: '2px solid rgba(160,120,72,0.28)',
        boxShadow: '-6px 0 32px rgba(80,50,20,0.14)',
        // overflow visible so the tab sticks out to the left
      }}
    >
      {/* ── Toggle tab ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Recolher' : 'Expandir'}
        style={{
          position: 'absolute',
          left: -33,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 33,
          height: 72,
          background: 'rgba(253,248,238,0.97)',
          border: '2px solid rgba(160,120,72,0.28)',
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          color: '#9a8068',
          boxShadow: '-4px 0 12px rgba(80,50,20,0.1)',
          transition: 'background 0.18s, color 0.18s',
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(241,233,210,0.97)'
          b.style.color = '#6a4e2a'
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(253,248,238,0.97)'
          b.style.color = '#9a8068'
        }}
      >
        <span style={{ fontSize: 7, color: '#a07840', letterSpacing: '0.05em', writingMode: 'vertical-rl', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
          ✦
        </span>
        {open ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {/* ── Header ── */}
      <div style={{
        padding: '18px 16px 12px',
        borderBottom: '1px solid rgba(160,120,72,0.15)',
        background: 'rgba(241,233,210,0.5)',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Corner ornaments */}
        {(['tl','tr'] as const).map((pos) => {
          const C = 'rgba(160,120,72,0.4)'
          return (
            <div key={pos} style={{
              position: 'absolute', width: 12, height: 12, pointerEvents: 'none',
              top: 6, [pos === 'tl' ? 'left' : 'right']: 6,
              borderTop: `2px solid ${C}`,
              [pos === 'tl' ? 'borderLeft' : 'borderRight']: `2px solid ${C}`,
            }} />
          )
        })}

        <div style={{ paddingRight: 44 }}>
          <h1 style={{
            margin: 0, fontSize: 15,
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600, color: '#2c1a0e', letterSpacing: '0.04em',
          }}>
            Viajes e Recuerdos
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 4px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.28)' }} />
            <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.28)' }} />
          </div>
          <p style={{ margin: 0, fontSize: 10, color: '#9a8068', fontFamily: '"Inter", sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            nossas memórias pelo mundo
          </p>

          {/* Interaction mode toggle */}
          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {(['hand', 'pin'] as const).map((mode) => {
              const active = interactionMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setInteractionMode(mode)}
                  title={mode === 'hand' ? 'Arrastar globo (scroll do mouse)' : 'Adicionar pin (scroll do mouse)'}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: `1px solid ${active ? 'rgba(160,120,72,0.55)' : 'rgba(160,120,72,0.2)'}`,
                    background: active ? 'rgba(160,120,72,0.14)' : 'rgba(160,120,72,0.04)',
                    color: active ? '#6a4e2a' : '#9a8068',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: active ? 600 : 400,
                    letterSpacing: '0.04em',
                    transition: 'all 0.18s',
                  }}
                >
                  {mode === 'hand' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                  {mode === 'hand' ? 'Arrastar' : 'Adicionar'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Logout button */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <button
            onClick={handleLogout}
            title="Sair"
            style={btnStyle}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(201,72,91,0.1)'
              b.style.color = '#C9485B'
              b.style.borderColor = 'rgba(201,72,91,0.35)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(160,120,72,0.07)'
              b.style.color = '#9a8068'
              b.style.borderColor = 'rgba(160,120,72,0.22)'
            }}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>

      {/* ── Google accounts ── */}
      <GoogleAccountsBar />

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StatsBar />
        <PinList />
      </div>
    </motion.div>
  )
}
