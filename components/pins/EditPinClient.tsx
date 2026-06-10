'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import PinEditForm from './PinEditForm'
import type { Pin } from '@/types/database'
import type { PinInput } from '@/lib/validations'

function Corners() {
  const c = 'rgba(160,120,72,0.4)'
  const s = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', width: 12, height: 12, pointerEvents: 'none',
    borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', ...extra,
  })
  return (
    <>
      <div style={s({ top: 5, left: 5,     borderTop: `2px solid ${c}`, borderLeft:  `2px solid ${c}` })} />
      <div style={s({ top: 5, right: 5,    borderTop: `2px solid ${c}`, borderRight: `2px solid ${c}` })} />
      <div style={s({ bottom: 5, left: 5,  borderBottom: `2px solid ${c}`, borderLeft:  `2px solid ${c}` })} />
      <div style={s({ bottom: 5, right: 5, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` })} />
    </>
  )
}

interface Props {
  pin: Pin
}

export default function EditPinClient({ pin }: Props) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  const initialValues: Partial<PinInput> = {
    latitude:    pin.latitude,
    longitude:   pin.longitude,
    city:        pin.city,
    state:       pin.state ?? '',
    country:     pin.country,
    title:       pin.title,
    description: pin.description ?? '',
    start_date:  pin.start_date,
    end_date:    pin.end_date,
    media:       pin.media,
  }

  function navigate(href: string) {
    setExiting(true)
    setTimeout(() => router.push(href), 320)
  }

  const btnBack: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 14px', borderRadius: 3, fontSize: 11,
    fontFamily: '"Inter", sans-serif', fontWeight: 500, letterSpacing: '0.05em',
    cursor: 'pointer', border: '1px solid rgba(160,120,72,0.35)',
    background: 'rgba(253,248,238,0.85)', color: '#6a4e2a',
    transition: 'background 0.15s', marginBottom: 20,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: exiting ? 0 : 1, y: exiting ? 0 : 0, transition: { duration: 0.32 } }}
      transition={{ duration: 0.38 }}
      style={{
        minHeight: '100vh',
        backgroundColor: '#ece4d0',
        backgroundImage: [
          'repeating-linear-gradient(0deg,   transparent, transparent 39px, rgba(120,85,35,0.07) 39px, rgba(120,85,35,0.07) 40px)',
          'repeating-linear-gradient(90deg,  transparent, transparent 39px, rgba(120,85,35,0.07) 39px, rgba(120,85,35,0.07) 40px)',
          'repeating-linear-gradient(45deg,  rgba(120,85,35,0.02) 0, rgba(120,85,35,0.02) 1px, transparent 0, transparent 50%)',
          'repeating-linear-gradient(-45deg, rgba(120,85,35,0.02) 0, rgba(120,85,35,0.02) 1px, transparent 0, transparent 50%)',
        ].join(', '),
        backgroundSize: '40px 40px, 40px 40px, 10px 10px, 10px 10px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px 60px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>

        <button
          onClick={() => navigate('/mapa')}
          style={btnBack}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(253,248,238,0.97)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(253,248,238,0.85)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar ao mapa
        </button>

        <div style={{
          background: 'rgba(253,248,238,0.97)',
          border: '2px solid rgba(160,120,72,0.28)',
          borderRadius: 6, padding: '28px 28px 24px',
          boxShadow: '0 4px 28px rgba(80,50,20,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          position: 'relative',
        }}>
          <Corners />

          <div style={{ width: 32, height: 3, background: pin.color ?? '#C9485B', borderRadius: 2, marginBottom: 12 }} />
          <h1 style={{
            margin: '0 0 12px', fontSize: 22, fontWeight: 600, lineHeight: 1.2,
            fontFamily: '"Cormorant Garamond", serif', color: '#2c1a0e', letterSpacing: '0.01em',
          }}>
            Editar memória
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
            <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
          </div>

          <PinEditForm
            mode="edit"
            pinId={pin.id}
            initialValues={initialValues}
            onCancel={() => navigate(`/mapa?pin=${pin.id}`)}
          />
        </div>

      </div>
    </motion.div>
  )
}
