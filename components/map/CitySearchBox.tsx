'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VisualTheme } from '@/types/database'
import type { GeocodingResult } from '@/lib/geocoding'
import { useMapStore } from '@/stores/mapStore'

interface Props {
  theme: VisualTheme | null
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CitySearchBox({ theme }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 400)
  const { flyTo, startCreation } = useMapStore()

  const isRight = theme?.sidebar_position !== 'left'
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    ...(isRight ? { right: 16 } : { left: 16 }),
    zIndex: 1000,
    width: 320,
  }

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    fetch(`/api/geocoding/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: GeocodingResult[]) => {
        setResults(data)
        setOpen(data.length > 0)
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (city: GeocodingResult) => {
      setQuery(city.displayName)
      setOpen(false)
      flyTo(city.lat, city.lng, 12)
      startCreation({ lat: city.lat, lng: city.lng }, city)
    },
    [flyTo, startCreation]
  )

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} style={boxStyle}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cidade..."
          style={{
            width: '100%',
            padding: '10px 40px 10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(15,15,26,0.85)',
            backdropFilter: 'blur(12px)',
            color: '#f0ece4',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 10,
              background: 'none',
              border: 'none',
              color: '#f0ece4',
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul
          style={{
            listStyle: 'none',
            margin: '4px 0 0',
            padding: 0,
            background: 'rgba(15,15,26,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {loading && (
            <li style={{ padding: '10px 14px', color: '#888', fontSize: 13 }}>
              Buscando...
            </li>
          )}
          {!loading && results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#f0ece4',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = 'rgba(201,72,91,0.2)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = 'transparent'
              }}
            >
              <div style={{ fontWeight: 500 }}>{r.city || r.displayName.split(',')[0]}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                {[r.state, r.country].filter(Boolean).join(', ')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
