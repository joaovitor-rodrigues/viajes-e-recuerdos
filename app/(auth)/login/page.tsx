'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const shakeKeyframes = {
  x: [-10, 10, -8, 8, -5, 5, -2, 2, 0],
  transition: { duration: 0.45, ease: 'easeInOut' as const },
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(false)
  const [shaking, setShaking]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/mapa')
    } else {
      setLoading(false)
      setPassword('')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      inputRef.current?.focus()
    }
  }

  const floatLabel = focused || password.length > 0

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
      {/* Decorative blobs — warm sepia tones */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(180,130,70,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 45% at 80% 70%, rgba(201,72,91,0.08) 0%, transparent 70%)',
      }} />

      <motion.form
        onSubmit={handleSubmit}
        variants={container}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}
      >
        {/* Card */}
        <motion.div
          variants={fadeUp}
          style={{
            background: 'rgba(253,248,238,0.96)',
            border: '2px solid rgba(160,120,72,0.25)',
            borderRadius: 6,
            padding: '48px 40px 40px',
            boxShadow: '0 6px 32px rgba(80,50,20,0.13), inset 0 1px 0 rgba(255,255,255,0.8)',
            position: 'relative',
          }}
        >
          {/* Corner ornaments */}
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

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(1.7rem, 7vw, 2.4rem)',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 600,
              color: '#2c1a0e',
              letterSpacing: '0.02em',
              lineHeight: 1.15,
            }}>
              Viajes e Recuerdos
            </h1>
            {/* Ornamental divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.3)' }} />
              <span style={{ fontSize: 13, color: '#a07840', letterSpacing: '0.1em' }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.3)' }} />
            </div>
            <p style={{
              margin: '10px 0 0', fontSize: '0.82rem',
              color: '#9a8068', fontFamily: '"Inter", sans-serif',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              o nosso mapa
            </p>
          </div>

          {/* Password field */}
          <motion.div variants={fadeUp} style={{ position: 'relative', marginBottom: 36 }}>
            <motion.div animate={shaking ? shakeKeyframes : {}}>
              <label style={{
                position: 'absolute',
                left: 0,
                top: floatLabel ? -18 : '50%',
                transform: floatLabel ? 'none' : 'translateY(-50%)',
                fontSize: floatLabel ? 10 : 13,
                color: floatLabel ? '#C9485B' : '#b0956e',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
              }}>
                senha
              </label>

              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1.5px solid ${focused ? '#C9485B' : 'rgba(160,120,72,0.35)'}`,
                  color: '#2c1a0e',
                  fontSize: 18,
                  outline: 'none',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'border-color 0.2s',
                  letterSpacing: '0.18em',
                }}
              />
            </motion.div>
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: 52, height: 52,
                borderRadius: '50%',
                background: loading || !password ? 'rgba(201,72,91,0.25)' : '#C9485B',
                border: 'none',
                cursor: loading || !password ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: password && !loading ? '0 4px 20px rgba(201,72,91,0.35)' : 'none',
                transition: 'all 0.22s',
              }}
              aria-label="Entrar"
            >
              {loading ? <SpinnerIcon /> : <ArrowIcon />}
            </button>
          </motion.div>
        </motion.div>
      </motion.form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
