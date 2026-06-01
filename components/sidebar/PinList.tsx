'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePinsStore } from '@/stores/pinsStore'
import { useMapStore } from '@/stores/mapStore'
import type { Pin } from '@/types/database'

type GroupMode = 'nenhum' | 'país' | 'ano'

function formatShortDate(dateStr: string): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), "MMM 'de' yyyy", { locale: ptBR })
}

function PinItem({ pin }: { pin: Pin }) {
  const router = useRouter()
  const flyTo = useMapStore((s) => s.flyTo)

  return (
    <button
      onClick={() => { flyTo(pin.latitude, pin.longitude, 12); router.push(`/pin/${pin.id}`) }}
      style={{
        width: '100%', background: 'none', border: 'none',
        textAlign: 'left', cursor: 'pointer',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: pin.color, flexShrink: 0,
        boxShadow: `0 0 6px ${pin.color}88`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#f0ece4', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pin.icon} {pin.title}
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
          {pin.city}{pin.state ? `, ${pin.state}` : ''} — {formatShortDate(pin.pin_date)}
        </div>
      </div>
    </button>
  )
}

export default function PinList() {
  const pins = usePinsStore((s) => s.pins)
  const [query, setQuery] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('nenhum')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return pins
    return pins.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    )
  }, [pins, query])

  const grouped = useMemo((): Record<string, Pin[]> => {
    if (groupMode === 'nenhum') return { '': filtered }
    return filtered.reduce<Record<string, Pin[]>>((acc, pin) => {
      const key = groupMode === 'país' ? pin.country : pin.pin_date.slice(0, 4)
      acc[key] = acc[key] ?? []
      acc[key].push(pin)
      return acc
    }, {})
  }, [filtered, groupMode])

  const sortedGroupKeys = useMemo(() => {
    const keys = Object.keys(grouped)
    if (groupMode === 'ano') return keys.sort((a, b) => b.localeCompare(a))
    return keys.sort()
  }, [grouped, groupMode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar memórias..."
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 6, boxSizing: 'border-box',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#f0ece4', fontSize: 12, outline: 'none',
          }}
        />
      </div>

      {/* Group toggle */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {(['nenhum', 'país', 'ano'] as GroupMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setGroupMode(m)}
            style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: 'none',
              background: groupMode === m ? 'var(--primary-color, #C9485B)' : 'rgba(255,255,255,0.07)',
              color: groupMode === m ? '#fff' : '#888',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 13, lineHeight: 1.6 }}>
            {pins.length === 0
              ? 'Nenhuma memória ainda...\nClique em uma cidade para começar 💕'
              : 'Nenhum resultado para essa busca.'}
          </div>
        ) : (
          sortedGroupKeys.map((key) => (
            <div key={key}>
              {groupMode !== 'nenhum' && (
                <div style={{
                  padding: '6px 16px 4px', fontSize: 10, color: '#555',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  {key}
                </div>
              )}
              {grouped[key].map((pin) => <PinItem key={pin.id} pin={pin} />)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
