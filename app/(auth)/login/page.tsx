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
      background: '#0f0f1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial gradient backdrop */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,72,91,0.08) 0%, transparent 70%)',
      }} />

      <motion.form
        onSubmit={handleSubmit}
        variants={container}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}
      >
        {/* Title */}
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 52 }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
            fontWeight: 400,
            color: '#C9485B',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
          }}>
            Viajes e Recuerdos
          </h1>
          <p style={{
            margin: '10px 0 0',
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'rgba(240,236,228,0.5)',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
          }}>
            o nosso mapa
          </p>
        </motion.div>

        {/* Password field */}
        <motion.div variants={fadeUp} style={{ position: 'relative', marginBottom: 40 }}>
          <AnimatePresence>
            {shaking && (
              <motion.div
                key="shake"
                animate={shakeKeyframes}
                style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
              />
            )}
          </AnimatePresence>

          <motion.div animate={shaking ? shakeKeyframes : {}}>
            {/* Floating label */}
            <label style={{
              position: 'absolute',
              left: 0,
              top: floatLabel ? -18 : '50%',
              transform: floatLabel ? 'none' : 'translateY(-50%)',
              fontSize: floatLabel ? 11 : 14,
              color: floatLabel ? '#C9485B' : 'rgba(240,236,228,0.35)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
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
                borderBottom: `1px solid ${focused ? '#C9485B' : 'rgba(240,236,228,0.2)'}`,
                color: '#f0ece4',
                fontSize: 18,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                letterSpacing: '0.15em',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Submit button */}
        <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: 52, height: 52,
              borderRadius: '50%',
              background: loading || !password ? 'rgba(201,72,91,0.3)' : '#C9485B',
              border: 'none',
              cursor: loading || !password ? 'default' : 'pointer',
              fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: password ? '0 0 20px rgba(201,72,91,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
            aria-label="Entrar"
          >
            {loading ? (
              <span style={{ fontSize: 18, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
                ○
              </span>
            ) : '→'}
          </button>
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </motion.form>
    </div>
  )
}
