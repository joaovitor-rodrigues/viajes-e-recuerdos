'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const shakeKeyframes = {
  x: [-10, 10, -8, 8, -5, 5, -2, 2, 0],
  transition: { duration: 0.45, ease: 'easeInOut' },
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
      background: 'linear-gradient(145deg, #f3eeff 0%, #fde8ef 45%, #eef4ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Soft radial blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 45% at 30% 35%, rgba(180,150,230,0.18) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 45% 40% at 75% 65%, rgba(201,72,91,0.1) 0%, transparent 65%)',
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
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(180,150,220,0.2)',
            borderRadius: 24,
            padding: '48px 40px 40px',
            boxShadow: '0 8px 40px rgba(120,80,180,0.1)',
          }}
        >
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(1.9rem, 8vw, 2.8rem)',
              fontFamily: 'var(--font-inter, "Inter", sans-serif)',
              fontWeight: 700,
              color: '#C9485B',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Viajes e Recuerdos
            </h1>
            <p style={{
              margin: '10px 0 0',
              fontSize: '0.9rem',
              color: '#a090c0',
              fontFamily: 'var(--font-inter, "Inter", sans-serif)',
              letterSpacing: '0.01em',
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
                fontSize: floatLabel ? 11 : 14,
                color: floatLabel ? '#C9485B' : '#c0b8d8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                fontWeight: floatLabel ? 600 : 400,
              }}>
                nossa senha
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
                  borderBottom: `1.5px solid ${focused ? '#C9485B' : 'rgba(150,120,200,0.3)'}`,
                  color: '#1a1730',
                  fontSize: 18,
                  outline: 'none',
                  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
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
                background: loading || !password
                  ? 'rgba(201,72,91,0.25)'
                  : '#C9485B',
                border: 'none',
                cursor: loading || !password ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: password && !loading ? '0 4px 20px rgba(201,72,91,0.4)' : 'none',
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
