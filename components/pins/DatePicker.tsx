'use client'

import { useState, useEffect, useRef } from 'react'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

interface Props {
  value: string        // YYYY-MM-DD
  onChange: (v: string) => void
  min?: string         // YYYY-MM-DD
  max?: string         // YYYY-MM-DD
}

function parseYMD(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TRIGGER: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 4,
  border: '1px solid rgba(160,120,72,0.2)',
  background: 'rgba(241,233,215,0.5)',
  color: '#2c1a0e', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', cursor: 'pointer',
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  userSelect: 'none',
}

export default function DatePicker({ value, onChange, min, max }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const [open, setOpen]         = useState(false)
  const today                   = new Date()
  const minDate                 = min ? parseYMD(min) : null
  const maxDate                 = max ? parseYMD(max) : today
  const selected                = parseYMD(value)

  const [viewYear,  setViewYear]  = useState(selected?.getFullYear()  ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth()      ?? today.getMonth())

  useEffect(() => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    function down(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function key(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) {
      document.addEventListener('mousedown', down)
      document.addEventListener('keydown', key)
    }
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])

  // ── Calendar grid ────────────────────────────────────────────────────────
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev   = new Date(viewYear, viewMonth, 0).getDate()

  type Cell = { date: Date; current: boolean }
  const cells: Cell[] = []
  for (let i = firstWeekday - 1; i >= 0; i--)
    cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrev - i), current: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(viewYear, viewMonth, d), current: true })
  let fill = 1
  while (cells.length % 7 !== 0)
    cells.push({ date: new Date(viewYear, viewMonth + 1, fill++), current: false })

  const todayStr    = toYMD(today)
  const selectedStr = value

  const canPrev = (!minDate
    || viewYear > minDate.getFullYear()
    || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth()))
    && (viewYear > 1900 || viewMonth > 0)
  const canNext = !maxDate
    || viewYear < maxDate.getFullYear()
    || (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth())

  function goPrev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function goNext() {
    if (!canNext) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function pick(cell: Cell) {
    if (maxDate && cell.date > maxDate) return
    onChange(toYMD(cell.date))
    setOpen(false)
  }

  const displayValue = selected
    ? selected.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  // ── Nav button ───────────────────────────────────────────────────────────
  const NavBtn = ({ dir, disabled, onClick }: { dir: '‹' | '›'; disabled: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26, height: 26, borderRadius: 4, border: '1px solid rgba(160,120,72,0.22)',
        background: 'transparent', cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: disabled ? 'rgba(160,120,72,0.3)' : '#7a6050', fontSize: 16, lineHeight: 1,
        transition: 'background 0.15s',
        padding: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.09)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {dir}
    </button>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>

      {/* ── Trigger ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        style={{
          ...TRIGGER,
          borderColor: open ? 'rgba(160,120,72,0.5)' : 'rgba(160,120,72,0.2)',
          boxShadow:   open ? '0 0 0 3px rgba(160,120,72,0.1)' : 'none',
        }}
      >
        <span style={{ color: displayValue ? '#2c1a0e' : '#b0a090' }}>
          {displayValue || 'Selecionar data'}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, color: '#a07840' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {/* ── Calendar popup ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          zIndex: 200,
          background: 'rgba(253,248,238,0.99)',
          border: '1px solid rgba(160,120,72,0.28)',
          borderRadius: 6,
          boxShadow: '0 8px 32px rgba(80,50,20,0.18)',
          padding: '14px 12px 12px',
        }}>

          {/* Month / year header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <NavBtn dir="‹" disabled={!canPrev} onClick={goPrev} />
            <span style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 15, fontWeight: 600, color: '#2c1a0e', letterSpacing: '0.02em',
            }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <NavBtn dir="›" disabled={!canNext} onClick={goNext} />
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 9, color: '#a07840',
                fontFamily: '"Inter", sans-serif', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 0 4px',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(160,120,72,0.15)', marginBottom: 6 }} />

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map(({ date, current }, i) => {
              const ymd        = toYMD(date)
              const isSelected = ymd === selectedStr
              const isToday    = ymd === todayStr
              const isDisabled = (!!maxDate && date > maxDate) || (!!minDate && date < minDate)
              const dimmed     = !current || isDisabled

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !isDisabled && pick({ date, current })}
                  disabled={isDisabled}
                  style={{
                    padding: '5px 2px', borderRadius: 4, textAlign: 'center',
                    fontSize: 12, fontFamily: '"Inter", sans-serif',
                    border: isToday && !isSelected ? '1px solid rgba(160,120,72,0.45)' : '1px solid transparent',
                    background: isSelected ? '#C9485B' : 'transparent',
                    color: isSelected ? '#fff' : dimmed ? 'rgba(44,26,14,0.25)' : '#2c1a0e',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    cursor: isDisabled ? 'default' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          {(!maxDate || today <= maxDate) && (!minDate || today >= minDate) && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(160,120,72,0.12)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => pick({ date: today, current: true })}
                style={{
                  fontSize: 10, fontFamily: '"Inter", sans-serif', color: '#a07840',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                Hoje
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
