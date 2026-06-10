'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function RetryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
    </svg>
  )
}

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f7f0e0 0%, #ede0c8 40%, #f2e8d5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(180,130,70,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 45% at 80% 70%, rgba(201,72,91,0.08) 0%, transparent 70%)',
      }} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        <motion.div
          variants={fadeUp}
          style={{
            background: 'rgba(253,248,238,0.96)',
            border: '2px solid rgba(160,120,72,0.25)',
            borderRadius: 6,
            padding: '48px 40px 40px',
            boxShadow: '0 6px 32px rgba(80,50,20,0.13), inset 0 1px 0 rgba(255,255,255,0.8)',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          {['topleft','topright','bottomleft','bottomright'].map((pos) => (
            <div key={pos} style={{
              position: 'absolute',
              width: 18, height: 18,
              [pos.includes('top') ? 'top' : 'bottom']: 6,
              [pos.includes('left') ? 'left' : 'right']: 6,
              borderTop:    pos.includes('top')    ? '2px solid rgba(160,120,72,0.4)' : 'none',
              borderBottom: pos.includes('bottom') ? '2px solid rgba(160,120,72,0.4)' : 'none',
              borderLeft:   pos.includes('left')   ? '2px solid rgba(160,120,72,0.4)' : 'none',
              borderRight:  pos.includes('right')  ? '2px solid rgba(160,120,72,0.4)' : 'none',
            }} />
          ))}

          <motion.div variants={fadeUp}>
            <h1 style={{
              margin: '0 0 0',
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 600,
              color: '#2c1a0e',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}>
              Algo correu mal
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.3)' }} />
              <span style={{ fontSize: 13, color: '#a07840', letterSpacing: '0.1em' }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.3)' }} />
            </div>

            <p style={{
              margin: '0 0 36px',
              fontSize: '0.88rem',
              color: '#9a8068',
              fontFamily: '"Inter", sans-serif',
              lineHeight: 1.6,
            }}>
              Ocorreu um erro inesperado. Podes tentar novamente ou regressar ao mapa.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              onClick={reset}
              style={{
                width: 52, height: 52,
                borderRadius: '50%',
                background: '#C9485B',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(201,72,91,0.35)',
                transition: 'all 0.22s',
              }}
              aria-label="Tentar novamente"
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <RetryIcon />
            </button>
          </motion.div>

          <motion.div variants={fadeUp}>
            <p style={{
              margin: '20px 0 0',
              fontSize: '0.75rem',
              color: '#b0956e',
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              tentar novamente
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
