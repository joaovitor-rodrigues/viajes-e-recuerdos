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
  const parts = [pin.city, pin.state, pin.country].filter(Boolean)
  return parts.join(', ')
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderLeft: `4px solid ${pin.color}`,
        background: `linear-gradient(135deg, ${pin.color}14 0%, transparent 60%)`,
        borderRadius: '0 12px 12px 0',
        padding: '28px 28px 28px 24px',
        position: 'relative',
        marginBottom: 32,
      }}
    >
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <Link
          href={flyToUrl}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#f0ece4', textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          ← Voltar ao mapa
        </Link>
        <Link
          href={`/pin/${pin.id}/editar`}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12,
            background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)',
            color: '#4ECDC4', textDecoration: 'none',
          }}
        >
          Editar
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
            color: '#E74C3C',
          }}
        >
          Excluir
        </button>
      </div>

      {/* Icon + Title */}
      <div style={{ paddingRight: 160 }}>
        <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>{pin.icon}</div>
        <h1 style={{
          margin: '0 0 10px', fontSize: 32, fontWeight: 400, lineHeight: 1.2,
          fontFamily: 'Cormorant Garamond, serif', color: '#f0ece4',
        }}>
          {pin.title}
        </h1>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#888' }}>
          {formatDate(pin.pin_date)}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>
          📍 {formatLocation(pin)}
        </p>
      </div>

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f0f1a', border: '1px solid rgba(231,76,60,0.3)',
              borderRadius: 12, padding: 28, maxWidth: 380, textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 16, color: '#f0ece4' }}>
              Excluir esta memória?
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#888' }}>
              "{pin.title}" será removida permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
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
