'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import StatsBar from './StatsBar'
import PinList from './PinList'

const PANEL_W = 300
const MARGIN = 16
const NAT_TOP = 80   // CSS top offset (below searchbox)

/* ── Icons ─────────────────────────────────────────────── */
function LockClosedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  )
}

function LockOpenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M12 1C9.24 1 7 3.24 7 6v1H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3h2c0-2.76-2.24-5-5-5zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity={0.3} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="9" cy="6"  r="1.5" /><circle cx="15" cy="6"  r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', transform: up ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

/* ── Component ──────────────────────────────────────────── */
export default function FloatingPinPanel() {
  const [locked, setLocked] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  /* When user releases, panel snaps to nearest screen corner */
  const snapToCorner = useCallback(() => {
    const panel = panelRef.current
    if (!panel) return

    const rect = panel.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pH = rect.height

    // Determine nearest corner based on panel center
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const goRight  = cx > vw / 2
    const goBottom = cy > vh / 2

    // Natural CSS position (right: MARGIN, top: NAT_TOP → left = vw - PANEL_W - MARGIN)
    const natLeft = vw - PANEL_W - MARGIN
    const natTop  = NAT_TOP

    let targetLeft: number
    let targetTop: number

    if ( goRight && !goBottom) { targetLeft = vw - PANEL_W - MARGIN; targetTop = MARGIN }
    if (!goRight && !goBottom) { targetLeft = MARGIN;                 targetTop = MARGIN }
    if ( goRight &&  goBottom) { targetLeft = vw - PANEL_W - MARGIN; targetTop = vh - pH - MARGIN }
    if (!goRight &&  goBottom) { targetLeft = MARGIN;                 targetTop = vh - pH - MARGIN }

    animate(x, targetLeft! - natLeft, { type: 'spring', stiffness: 320, damping: 28 })
    animate(y, targetTop!  - natTop,  { type: 'spring', stiffness: 320, damping: 28 })
  }, [x, y])

  const iconBtnStyle = (active?: boolean): React.CSSProperties => ({
    flexShrink: 0,
    background: active ? 'rgba(201,72,91,0.1)' : 'rgba(201,72,91,0.04)',
    border: `1px solid ${active ? 'rgba(201,72,91,0.3)' : 'rgba(201,72,91,0.1)'}`,
    borderRadius: 7,
    padding: '5px 7px',
    cursor: 'pointer',
    color: active ? 'var(--primary-color, #C9485B)' : '#9b8ca0',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    transition: 'all 0.18s',
  })

  return (
    <motion.div
      ref={panelRef}
      drag={!locked}
      dragMomentum={false}
      onDragEnd={snapToCorner}
      style={{
        position: 'absolute',
        top: NAT_TOP,
        right: MARGIN,
        zIndex: 500,
        width: PANEL_W,
        x,
        y,
        background: 'rgba(255,248,250,0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(201,72,91,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(100,50,80,0.14)',
        cursor: locked ? 'default' : 'grab',
        userSelect: 'none',
      }}
      whileDrag={{ scale: 1.015, boxShadow: '0 18px 50px rgba(100,50,80,0.22)', cursor: 'grabbing' }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 12px 10px',
        borderBottom: minimized ? 'none' : '1px solid rgba(201,72,91,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {!locked && <GripIcon />}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: 13,
            fontFamily: 'var(--font-family, "Cormorant Garamond", serif)',
            fontWeight: 400, color: '#2a1f2e', letterSpacing: '0.05em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Viajes e Recuerdos
          </h1>
          {!minimized && (
            <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9b8ca0', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>
              suas memórias pelo mundo
            </p>
          )}
        </div>

        {/* Minimize */}
        <button
          onClick={() => setMinimized((m) => !m)}
          title={minimized ? 'Expandir' : 'Minimizar'}
          style={iconBtnStyle()}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
        >
          <ChevronIcon up={!minimized} />
        </button>

        {/* Lock */}
        <button
          onClick={() => setLocked((l) => !l)}
          title={locked ? 'Liberar painel' : 'Fixar painel'}
          style={iconBtnStyle(locked)}
          onMouseEnter={(e) => {
            if (!locked) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            if (!locked) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
          }}
        >
          {locked ? <LockClosedIcon /> : <LockOpenIcon />}
          <span>{locked ? 'Fixo' : 'Livre'}</span>
        </button>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <StatsBar />
            <PinList />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
