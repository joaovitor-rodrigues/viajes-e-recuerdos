'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useThemeStore } from '@/stores/themeStore'
import type { VisualTheme } from '@/types/database'

const MAP_STYLES: { id: VisualTheme['map_style']; label: string; color: string }[] = [
  { id: 'dark',       label: 'Escuro',      color: '#1a1a2e' },
  { id: 'light',      label: 'Claro',       color: '#e8e0d5' },
  { id: 'watercolor', label: 'Aquarela',    color: '#b8d4e8' },
  { id: 'minimal',    label: 'Minimalista', color: '#f5f5f0' },
  { id: 'osm',        label: 'Padrão',      color: '#d0e8c0' },
]

const LABEL: React.CSSProperties = {
  fontSize: 10,
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: 8,
  display: 'block',
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

const SECTION: React.CSSProperties = {
  marginBottom: 20,
  paddingBottom: 20,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: '#ccc', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: value ? 'var(--primary-color, #C9485B)' : 'rgba(255,255,255,0.12)',
          position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ThemePanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { theme, updateAndSync, resetToDefault } = useTheme()
  const position = useThemeStore((s) => s.theme.sidebar_position)

  const isRight = position === 'right'

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 20,
    [isRight ? 'left' : 'right']: 20,
    zIndex: 600,
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(10,10,20,0.88)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: open ? 'var(--primary-color, #C9485B)' : '#888',
    transition: 'color 0.2s, border-color 0.2s, background 0.2s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 80,
    [isRight ? 'left' : 'right']: 12,
    zIndex: 600,
    width: 300,
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'rgba(10,10,20,0.97)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    color: '#f0ece4',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  }

  return (
    <div ref={panelRef}>
      <button
        style={btnStyle}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,20,35,0.95)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,10,20,0.88)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'
        }}
        aria-label="Personalizar tema"
      >
        <SettingsIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={panelStyle}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <h3 style={{
              margin: '0 0 18px',
              fontSize: 11,
              color: 'var(--secondary-color, #4ECDC4)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            }}>
              Personalizar
            </h3>

            {/* A — Map Style */}
            <div style={SECTION}>
              <span style={LABEL}>Estilo do Mapa</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {MAP_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateAndSync({ map_style: s.id })}
                    style={{
                      padding: '8px 4px 6px',
                      borderRadius: 8,
                      border: theme.map_style === s.id
                        ? '2px solid var(--primary-color, #C9485B)'
                        : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: s.color,
                      transition: 'border-color 0.15s',
                    }}
                    title={s.label}
                  >
                    <div style={{
                      fontSize: 8,
                      color: s.id === 'dark' ? '#aaa' : '#333',
                      textAlign: 'center',
                      marginTop: 2,
                      fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}>
                      {s.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* B — Colors */}
            <div style={SECTION}>
              <span style={LABEL}>Cores</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { key: 'primary_color',   label: 'Cor primária' },
                  { key: 'secondary_color', label: 'Cor secundária' },
                ] as { key: keyof VisualTheme; label: string }[]).map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={theme[key] as string}
                      onChange={(e) => updateAndSync({ [key]: e.target.value } as Partial<VisualTheme>)}
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'none' }}
                    />
                    <div>
                      <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>{label}</div>
                      <div style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>{theme[key] as string}</div>
                    </div>
                    <div style={{
                      marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%',
                      background: theme[key] as string,
                      boxShadow: `0 0 8px ${theme[key] as string}88`,
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* C — Effects */}
            <div style={SECTION}>
              <span style={LABEL}>Efeitos</span>
              <Toggle value={theme.enable_particles}  onChange={(v) => updateAndSync({ enable_particles: v })}  label="Partículas" />
              <Toggle value={theme.enable_glow}        onChange={(v) => updateAndSync({ enable_glow: v })}        label="Brilho nos pins" />
              <Toggle value={theme.enable_animations}  onChange={(v) => updateAndSync({ enable_animations: v })}  label="Animações" />
            </div>

            {/* D — Layout */}
            <div style={SECTION}>
              <span style={LABEL}>Posição do botão de tema</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  { id: 'left',   label: '← Esquerda' },
                  { id: 'right',  label: 'Direita →' },
                ] as { id: VisualTheme['sidebar_position']; label: string }[]).map((opt) => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={theme.sidebar_position === opt.id}
                      onChange={() => updateAndSync({ sidebar_position: opt.id })}
                      style={{ accentColor: 'var(--primary-color, #C9485B)' }}
                    />
                    <span style={{ fontSize: 13, color: '#ccc', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* F — Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetToDefault}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#777',
                  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#aaa'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#777'
                }}
              >
                Restaurar padrão
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background: 'var(--primary-color, #C9485B)', border: 'none', color: '#fff',
                  fontWeight: 600,
                  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <CheckIcon /> Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
