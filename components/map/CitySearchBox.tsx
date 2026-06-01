'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GeocodingResult } from '@/lib/geocoding'
import { useMapStore } from '@/stores/mapStore'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function SearchIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round"
      style={{ display: 'block' }}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function CitySearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 400)
  const { flyTo, startCreation } = useMapStore()

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

  const isActive = focused || hovered

  return (
    <div
      ref={containerRef}
      className="city-search-box"
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 440,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Search icon */}
        <span style={{
          position: 'absolute',
          left: 16,
          color: isActive ? 'var(--primary-color, #C9485B)' : '#9b8ca0',
          pointerEvents: 'none',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
        }}>
          <SearchIcon />
        </span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar cidade ou país..."
          style={{
            width: '100%',
            padding: '13px 44px',
            borderRadius: 28,
            border: isActive
              ? '1.5px solid rgba(201,72,91,0.4)'
              : '1.5px solid rgba(201,72,91,0.12)',
            background: 'rgba(255,248,250,0.97)',
            backdropFilter: 'blur(24px)',
            color: '#2a1f2e',
            fontSize: 14,
            fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: focused
              ? '0 8px 32px rgba(100,50,80,0.18), 0 0 0 3px rgba(201,72,91,0.08)'
              : hovered
                ? '0 6px 24px rgba(100,50,80,0.14)'
                : '0 4px 16px rgba(100,50,80,0.1)',
            transition: 'all 0.25s ease',
            letterSpacing: '0.01em',
          }}
        />

        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 14,
              background: 'rgba(201,72,91,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9b8ca0',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,72,91,0.15)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,72,91,0.08)' }}
            aria-label="Limpar busca"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {open && (
        <ul
          style={{
            listStyle: 'none',
            margin: '6px 0 0',
            padding: 0,
            background: 'rgba(255,248,250,0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(201,72,91,0.1)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(100,50,80,0.15)',
          }}
        >
          {loading && (
            <li style={{
              padding: '12px 18px',
              color: '#9b8ca0',
              fontSize: 13,
              fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            }}>
              Buscando...
            </li>
          )}
          {!loading && results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '11px 18px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#2a1f2e',
                fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                borderBottom: i < results.length - 1 ? '1px solid rgba(201,72,91,0.07)' : 'none',
                transition: 'background 0.12s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = 'rgba(201,72,91,0.06)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = 'transparent'
              }}
            >
              <span style={{ color: '#9b8ca0', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>{r.city || r.displayName.split(',')[0]}</div>
                <div style={{ fontSize: 11, color: '#9b8ca0', marginTop: 1 }}>
                  {[r.state, r.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
