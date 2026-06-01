'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePins } from '@/hooks/usePins'
import type { Pin } from '@/types/database'

interface Props {
  pin: Pin
}

function formatDate(dateStr: string): string {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

function formatLocation(pin: Pin): string {
  return [pin.city, pin.state, pin.country].filter(Boolean).join(', ')
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}

export default function PinHero({ pin }: Props) {
  const router = useRouter()
  const { deletePin } = usePins()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const ok = await deletePin(pin.id)
    if (ok) router.push('/mapa')
    else setDeleting(false)
  }

  const flyToUrl = `/mapa?flyTo=${pin.latitude},${pin.longitude}&zoom=12`

  const linkBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    fontWeight: 500,
    transition: 'all 0.15s',
    ...extra,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: `linear-gradient(135deg, ${pin.color}18 0%, rgba(255,255,255,0.85) 55%)`,
        border: `1.5px solid ${pin.color}30`,
        borderLeft: `4px solid ${pin.color}`,
        borderRadius: '0 16px 16px 0',
        padding: '28px 28px 28px 24px',
        position: 'relative',
        marginBottom: 32,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(120,80,180,0.08)',
      }}
    >
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link
          href={flyToUrl}
          style={linkBtn({
            background: 'rgba(120,80,180,0.08)',
            border: '1px solid rgba(120,80,180,0.2)',
            color: '#5a4a8a',
          })}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(120,80,180,0.14)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(120,80,180,0.08)' }}
        >
          ← Voltar ao mapa
        </Link>
        <Link
          href={`/pin/${pin.id}/editar`}
          style={linkBtn({
            background: 'rgba(78,205,196,0.1)',
            border: '1px solid rgba(78,205,196,0.3)',
            color: '#2a9e98',
          })}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(78,205,196,0.18)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(78,205,196,0.1)' }}
        >
          Editar
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            ...linkBtn({
              background: 'rgba(231,76,60,0.07)',
              border: '1px solid rgba(231,76,60,0.25)',
              color: '#c0392b',
            }),
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(231,76,60,0.14)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(231,76,60,0.07)' }}
        >
          Excluir
        </button>
      </div>

      {/* Icon + Title */}
      <div style={{ paddingRight: 160 }}>
        <div style={{ fontSize: 46, marginBottom: 12, lineHeight: 1 }}>{pin.icon}</div>
        <h1 style={{
          margin: '0 0 10px', fontSize: 30, fontWeight: 700, lineHeight: 1.2,
          fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          color: '#1a1730',
          letterSpacing: '-0.02em',
        }}>
          {pin.title}
        </h1>
        <p style={{ margin: '0 0 5px', fontSize: 13, color: '#9b93b4', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>
          {formatDate(pin.pin_date)}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#7b6fa0', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}>
          <MapPinIcon />
          {formatLocation(pin)}
        </p>
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(20,15,40,0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(231,76,60,0.2)',
              borderRadius: 20,
              padding: '32px 28px',
              maxWidth: 380,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(20,15,40,0.2)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 16, color: '#1a1730', fontWeight: 600 }}>
              Excluir esta memória?
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#9b93b4' }}>
              "{pin.title}" será removida permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 22px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                  background: 'transparent', border: '1px solid rgba(150,120,200,0.3)', color: '#7b6fa0',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 22px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                  background: '#E74C3C', border: 'none', color: '#fff', fontWeight: 600,
                }}
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
