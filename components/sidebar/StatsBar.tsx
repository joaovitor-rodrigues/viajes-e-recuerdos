'use client'

import { useState, useEffect, useRef } from 'react'
import { usePinsStore } from '@/stores/pinsStore'

function useCountUp(target: number, duration = 800): number {
  const [count, setCount] = useState(0)
  const start = useRef<number | null>(null)
  useEffect(() => {
    if (target === 0) return
    start.current = null
    function step(ts: number) {
      if (!start.current) start.current = ts
      const progress = Math.min((ts - start.current) / duration, 1)
      setCount(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return count
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  )
}

function CityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z" />
    </svg>
  )
}

export default function StatsBar() {
  const pins = usePinsStore((s) => s.pins)

  const totalPins       = pins.length
  const uniqueCountries = new Set(pins.map((p) => p.country)).size
  const uniqueCities    = new Set(pins.map((p) => p.city)).size

  const animPins      = useCountUp(totalPins)
  const animCountries = useCountUp(uniqueCountries)
  const animCities    = useCountUp(uniqueCities)

  const stats = [
    { icon: <PinIcon />,   value: animPins,      label: 'memórias' },
    { icon: <GlobeIcon />, value: animCountries, label: 'países' },
    { icon: <CityIcon />,  value: animCities,    label: 'cidades' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      padding: '14px 14px 12px',
      borderBottom: '1px solid rgba(160,120,72,0.12)',
      background: 'rgba(241,233,215,0.3)',
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#a07840', opacity: 0.8 }}>
            {s.icon}
          </div>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#C9485B',
            lineHeight: 1, fontFamily: '"Inter", sans-serif',
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize: 9, color: '#9a8068',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginTop: 3, fontFamily: '"Inter", sans-serif',
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
