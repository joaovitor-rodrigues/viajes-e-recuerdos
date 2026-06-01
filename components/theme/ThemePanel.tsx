'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useThemeStore } from '@/stores/themeStore'
import type { VisualTheme } from '@/types/database'

const MAP_STYLES: { id: VisualTheme['map_style']; label: string; color: string }[] = [
  { id: 'dark',       label: 'Dark',       color: '#1a1a2e' },
  { id: 'light',      label: 'Light',      color: '#e8e0d5' },
  { id: 'watercolor', label: 'Aquarela',   color: '#b8d4e8' },
  { id: 'minimal',    label: 'Minimal',    color: '#f5f5f0' },
  { id: 'osm',        label: 'OSM',        color: '#d0e8c0' },
]

const FONTS = [
  'Cormorant Garamond',
  'Playfair Display',
  'Lato',
  'Roboto',
  'Inter',
]

const LABEL: React.CSSProperties = {
  fontSize: 11, color: '#666', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 8, display: 'block',
}

const SECTION: React.CSSProperties = {
  marginBottom: 20, paddingBottom: 20,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: '#ccc' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: value ? 'var(--primary-color, #C9485B)' : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s',
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
    background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.15)',
    cursor: 'pointer', fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 80,
    [isRight ? 'left' : 'right']: 12,
    zIndex: 600,
    width: 300,
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'rgba(10,10,20,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#f0ece4',
  }

  return (
    <div ref={panelRef}>
      <button style={btnStyle} onClick={() => setOpen((o) => !o)} aria-label="Tema">
        ⚙️
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={panelStyle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                      padding: '6px 4px', borderRadius: 6, border: theme.map_style === s.id
                        ? '2px solid var(--primary-color, #C9485B)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', background: s.color,
                    }}
                    title={s.label}
                  >
                    <div style={{ fontSize: 9, color: theme.map_style === s.id ? '#fff' : '#333', textAlign: 'center', marginTop: 2, textShadow: '0 0 3px rgba(0,0,0,0.5)' }}>
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
                {[
                  { key: 'primary_color', label: 'Cor primária' },
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
                      <div style={{ fontSize: 12, color: '#ccc' }}>{label}</div>
                      <div style={{ fontSize: 10, color: '#555' }}>{theme[key] as string}</div>
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

            {/* D — Typography */}
            <div style={SECTION}>
              <span style={LABEL}>Tipografia</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FONTS.map((font) => (
                  <label key={font} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={theme.font_family === font}
                      onChange={() => updateAndSync({ font_family: font })}
                      style={{ accentColor: 'var(--primary-color, #C9485B)' }}
                    />
                    <span style={{ fontSize: 14, fontFamily: `'${font}', serif`, color: '#ccc' }}>
                      {font}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* E — Layout */}
            <div style={SECTION}>
              <span style={LABEL}>Posição da Sidebar</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  { id: 'left',   label: '← Esquerda' },
                  { id: 'right',  label: 'Direita →' },
                  { id: 'hidden', label: 'Oculta' },
                ] as { id: VisualTheme['sidebar_position']; label: string }[]).map((opt) => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={theme.sidebar_position === opt.id}
                      onChange={() => updateAndSync({ sidebar_position: opt.id })}
                      style={{ accentColor: 'var(--primary-color, #C9485B)' }}
                    />
                    <span style={{ fontSize: 13, color: '#ccc' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* F — Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetToDefault}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888',
                }}
              >
                Restaurar padrão
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: 'var(--primary-color, #C9485B)', border: 'none', color: '#fff', fontWeight: 600,
                }}
              >
                Fechar ✓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
