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

export default function StatsBar() {
  const pins = usePinsStore((s) => s.pins)

  const totalPins      = pins.length
  const uniqueCountries = new Set(pins.map((p) => p.country)).size
  const uniqueCities    = new Set(pins.map((p) => p.city)).size

  const animPins      = useCountUp(totalPins)
  const animCountries = useCountUp(uniqueCountries)
  const animCities    = useCountUp(uniqueCities)

  const stats = [
    { icon: '📍', value: animPins,      label: 'memórias' },
    { icon: '✈️',  value: animCountries, label: 'países' },
    { icon: '🏙️', value: animCities,    label: 'cidades' },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8, padding: '16px 16px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-color, #C9485B)', lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
