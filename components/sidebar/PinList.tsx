'use client'

import { useState, useMemo } from 'react'
import { formatShortDateRange } from '@/lib/dateRange'
import { usePinsStore } from '@/stores/pinsStore'
import { useMapStore } from '@/stores/mapStore'
import { toIsoCode } from '@/lib/flags'
import type { Pin } from '@/types/database'

function FlagImg({ country }: { country: string }) {
  const iso = toIsoCode(country)
  if (!iso) return <span style={{ fontSize: 10, color: MUTED }}>{country}</span>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/16x12/${iso.toLowerCase()}.png`}
      width={16} height={12}
      alt={country}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 1, flexShrink: 0 }}
    />
  )
}

type GroupMode   = 'nenhum' | 'país' | 'ano'
type SortField   = 'data' | 'país' | 'cidade'
type SortDir     = 'asc' | 'desc'
type ActiveFilter = { type: 'país' | 'ano'; value: string } | null

const TEXT  = '#2c1a0e'
const MUTED = '#9a8068'
const DIV   = 'rgba(160,120,72,0.13)'


function PinItem({ pin }: { pin: Pin }) {
  const selectPin = useMapStore((s) => s.selectPin)
  return (
    <button
      onClick={() => selectPin(pin)}
      style={{
        width: '100%', background: 'none', border: 'none',
        textAlign: 'left', cursor: 'pointer',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${DIV}`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,72,91,0.04)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: pin.color, flexShrink: 0,
        boxShadow: `0 0 6px ${pin.color}88`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: TEXT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pin.title}
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FlagImg country={pin.country} />
            {pin.city} · {formatShortDateRange(pin.start_date, pin.end_date)}
          </span>
        </div>
      </div>
    </button>
  )
}

function GroupHeader({
  label, count, active, onClick,
}: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Remover filtro' : 'Filtrar por este grupo'}
      style={{
        width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer',
        padding: '6px 16px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: active ? 'rgba(160,120,72,0.1)' : 'rgba(241,233,215,0.5)',
        transition: 'background 0.15s',
      } as React.CSSProperties}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(160,120,72,0.1)' : 'rgba(241,233,215,0.5)' }}
    >
      <span style={{ fontSize: 10, color: active ? '#6a4e2a' : MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Inter", sans-serif', fontWeight: active ? 700 : 400 }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: active ? '#C9485B' : 'rgba(160,120,72,0.45)', fontFamily: '"Inter", sans-serif' }}>
        {active ? '✕' : count}
      </span>
    </button>
  )
}

export default function PinList() {
  const pins = usePinsStore((s) => s.pins)

  const [query,     setQuery]     = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('nenhum')
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')
  const [filter,    setFilter]    = useState<ActiveFilter>(null)

  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  function toggleFilter(type: 'país' | 'ano', value: string) {
    setFilter((f) => f?.type === type && f.value === value ? null : { type, value })
  }

  // 1. text search
  const searched = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return pins
    return pins.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    )
  }, [pins, query])

  // 2. active filter
  const filtered = useMemo(() => {
    if (!filter) return searched
    return searched.filter((p) =>
      filter.type === 'país' ? p.country === filter.value
                             : p.start_date.slice(0, 4) === filter.value
    )
  }, [searched, filter])

  // 3. sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const d = sortDir === 'desc' ? -1 : 1
    if (sortField === 'data') {
      arr.sort((a, b) => d * a.start_date.localeCompare(b.start_date))
    } else if (sortField === 'país') {
      arr.sort((a, b) => d * a.country.localeCompare(b.country, 'pt'))
    } else {
      arr.sort((a, b) => d * a.city.localeCompare(b.city, 'pt'))
    }
    return arr
  }, [filtered, sortField, sortDir])

  // 4. group
  const grouped = useMemo((): Record<string, Pin[]> => {
    if (groupMode === 'nenhum') return { '': sorted }
    return sorted.reduce<Record<string, Pin[]>>((acc, pin) => {
      const key = groupMode === 'país' ? pin.country : pin.start_date.slice(0, 4)
      acc[key] = acc[key] ?? []
      acc[key].push(pin)
      return acc
    }, {})
  }, [sorted, groupMode])

  const groupKeys = useMemo(() => {
    const keys = Object.keys(grouped)
    if (groupMode === 'ano') return keys.sort((a, b) => b.localeCompare(a))
    if (groupMode === 'país') {
      const d = sortField === 'país' && sortDir === 'asc' ? 1 : -1
      return keys.sort((a, b) => d * a.localeCompare(b, 'pt'))
    }
    return keys
  }, [grouped, groupMode, sortField, sortDir])

  // sort label helpers
  const sortLabel: Record<SortField, [string, string]> = {
    data:   ['Data ↓', 'Data ↑'],
    país:   ['País A↓', 'País Z↑'],
    cidade: ['Cidade A↓', 'Cidade Z↑'],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Search */}
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${DIV}` }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar memórias..."
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 6, boxSizing: 'border-box',
            border: '1px solid rgba(160,120,72,0.2)',
            background: 'rgba(241,233,215,0.5)', color: TEXT, fontSize: 12, outline: 'none',
            fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          }}
        />
      </div>

      {/* Sort + Group — single compact row */}
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${DIV}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Sort buttons */}
        {(['data', 'país', 'cidade'] as SortField[]).map((f) => {
          const active = sortField === f
          return (
            <button
              key={f}
              onClick={() => handleSort(f)}
              style={{
                flex: 1, padding: '3px 4px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                border: `1px solid ${active ? 'rgba(160,120,72,0.4)' : 'rgba(160,120,72,0.15)'}`,
                background: active ? 'rgba(160,120,72,0.12)' : 'transparent',
                color: active ? '#6a4e2a' : MUTED,
                fontFamily: '"Inter", sans-serif',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {active ? sortLabel[f][sortDir === 'desc' ? 0 : 1] : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'rgba(160,120,72,0.2)', flexShrink: 0 }} />

        {/* Group select */}
        <select
          value={groupMode}
          onChange={(e) => setGroupMode(e.target.value as GroupMode)}
          style={{
            padding: '3px 4px', borderRadius: 4, fontSize: 10,
            border: '1px solid rgba(160,120,72,0.2)',
            background: groupMode !== 'nenhum' ? 'rgba(160,120,72,0.1)' : 'transparent',
            color: groupMode !== 'nenhum' ? '#6a4e2a' : MUTED,
            fontFamily: '"Inter", sans-serif',
            cursor: 'pointer', outline: 'none',
            fontWeight: groupMode !== 'nenhum' ? 600 : 400,
          }}
        >
          <option value="nenhum">Grupo</option>
          <option value="país">País</option>
          <option value="ano">Ano</option>
        </select>
      </div>

      {/* Active filter chip */}
      {filter && (
        <div style={{ padding: '4px 12px', borderBottom: `1px solid ${DIV}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Inter"' }}>Filtro</span>
          <button
            onClick={() => setFilter(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
              background: 'rgba(201,72,91,0.08)', border: '1px solid rgba(201,72,91,0.25)',
              color: '#C9485B', fontFamily: '"Inter"', fontWeight: 500,
            }}
          >
            {filter.type === 'país' ? `País: ${filter.value}` : `Ano: ${filter.value}`}
            <span style={{ fontSize: 12, lineHeight: 1 }}>×</span>
          </button>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div className="pin-list-scroll" style={{ height: '100%', overflowY: 'auto', scrollBehavior: 'smooth' }}>
          {sorted.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
              {pins.length === 0 ? 'Nenhuma memória ainda...' : 'Nenhum resultado.'}
            </div>
          ) : (
            groupKeys.map((key) => (
              <div key={key}>
                {groupMode !== 'nenhum' && (
                  <GroupHeader
                    label={key}
                    count={grouped[key].length}
                    active={filter?.value === key}
                    onClick={() => toggleFilter(groupMode === 'país' ? 'país' : 'ano', key)}
                  />
                )}
                {grouped[key].map((pin) => <PinItem key={pin.id} pin={pin} />)}
              </div>
            ))
          )}
          <div style={{ height: 40 }} />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
          background: 'linear-gradient(to bottom, rgba(253,248,238,0) 0%, rgba(253,248,238,0.96) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(to right, transparent 0%, rgba(160,120,72,0.25) 20%, rgba(160,120,72,0.25) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
