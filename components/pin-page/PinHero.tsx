'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { formatDateRange } from '@/lib/dateRange'
import { usePins } from '@/hooks/usePins'
import type { Pin } from '@/types/database'

interface Props { pin: Pin }


function formatLocation(pin: Pin): string {
  return [pin.city, pin.state, pin.country].filter(Boolean).join(', ')
}

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
      style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}

function VintageBtn({ href, children, danger, onClick }: {
  href?: string
  children: React.ReactNode
  danger?: boolean
  onClick?: () => void
}) {
  const base: React.CSSProperties = {
    padding: '5px 14px', borderRadius: 3, fontSize: 11,
    fontFamily: '"Inter", sans-serif', fontWeight: 500,
    letterSpacing: '0.05em', whiteSpace: 'nowrap',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'all 0.15s', display: 'inline-block',
    border: danger
      ? '1px solid rgba(180,60,50,0.35)'
      : '1px solid rgba(160,120,72,0.35)',
    background: danger
      ? 'rgba(180,60,50,0.07)'
      : 'rgba(160,120,72,0.07)',
    color: danger ? '#8b3a30' : '#6a4e2a',
  }

  const hover = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.background = danger ? 'rgba(180,60,50,0.14)' : 'rgba(160,120,72,0.14)'
  }
  const leave = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.background = danger ? 'rgba(180,60,50,0.07)' : 'rgba(160,120,72,0.07)'
  }

  if (href) return <Link href={href} style={base} onMouseEnter={hover} onMouseLeave={leave}>{children}</Link>
  return <button style={{ ...base, border: base.border as string }} onClick={onClick} onMouseEnter={hover} onMouseLeave={leave}>{children}</button>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'rgba(253,248,238,0.97)',
        border: '2px solid rgba(160,120,72,0.28)',
        borderRadius: 6,
        padding: '32px 28px 28px',
        position: 'relative',
        marginBottom: 32,
        boxShadow: '0 4px 24px rgba(80,50,20,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Corner ornaments */}
      {[
        { top: 6, left: 6,  bt: true,  bl: true },
        { top: 6, right: 6, bt: true,  br: true },
        { bottom: 6, left: 6,  bb: true, bl: true },
        { bottom: 6, right: 6, bb: true, br: true },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 14, height: 14, pointerEvents: 'none',
          ...(c.top    !== undefined ? { top:    c.top    } : {}),
          ...(c.bottom !== undefined ? { bottom: c.bottom } : {}),
          ...(c.left   !== undefined ? { left:   c.left   } : {}),
          ...(c.right  !== undefined ? { right:  c.right  } : {}),
          borderTop:    c.bt ? '2px solid rgba(160,120,72,0.4)' : 'none',
          borderBottom: c.bb ? '2px solid rgba(160,120,72,0.4)' : 'none',
          borderLeft:   c.bl ? '2px solid rgba(160,120,72,0.4)' : 'none',
          borderRight:  c.br ? '2px solid rgba(160,120,72,0.4)' : 'none',
        }} />
      ))}

      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <VintageBtn href="/mapa">← Mapa</VintageBtn>
        <VintageBtn href={`/pin/${pin.id}/editar`}>Editar</VintageBtn>
        <VintageBtn danger onClick={() => setShowConfirm(true)}>Excluir</VintageBtn>
      </div>

      {/* Title block */}
      <div style={{ paddingRight: 160 }}>
        {/* Colour accent line */}
        <div style={{ width: 36, height: 3, background: pin.color ?? '#C9485B', borderRadius: 2, marginBottom: 14 }} />

        <h1 style={{
          margin: '0 0 8px', fontSize: 28, fontWeight: 600, lineHeight: 1.2,
          fontFamily: '"Cormorant Garamond", serif',
          color: '#2c1a0e', letterSpacing: '0.01em',
        }}>
          {pin.title}
        </h1>

        {/* Ornamental divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 10px' }}>
          <div style={{ width: 24, height: 1, background: 'rgba(160,120,72,0.3)' }} />
          <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.15)' }} />
        </div>

        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9a8068', fontFamily: '"Inter", sans-serif', letterSpacing: '0.03em' }}>
          {formatDateRange(pin.start_date, pin.end_date)}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#7a6050', fontFamily: '"Inter", sans-serif' }}>
          <MapPinIcon />{formatLocation(pin)}
        </p>
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(253,248,238,0.98)',
              border: '2px solid rgba(160,120,72,0.28)',
              borderRadius: 6,
              padding: '36px 32px',
              maxWidth: 360, width: '90%',
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(44,26,14,0.18)',
              position: 'relative',
            }}
          >
            {/* Corner ornaments on confirm dialog */}
            {[{t:6,l:6,bt:true,bl:true},{t:6,r:6,bt:true,br:true},{b:6,l:6,bb:true,bl:true},{b:6,r:6,bb:true,br:true}].map((c,i)=>(
              <div key={i} style={{
                position:'absolute',width:12,height:12,pointerEvents:'none',
                ...(c.t!==undefined?{top:c.t}:{}),
                ...(c.b!==undefined?{bottom:c.b}:{}),
                ...(c.l!==undefined?{left:c.l}:{}),
                ...(c.r!==undefined?{right:c.r}:{}),
                borderTop:   c.bt?'2px solid rgba(160,120,72,0.4)':'none',
                borderBottom:c.bb?'2px solid rgba(160,120,72,0.4)':'none',
                borderLeft:  c.bl?'2px solid rgba(160,120,72,0.4)':'none',
                borderRight: c.br?'2px solid rgba(160,120,72,0.4)':'none',
              }}/>
            ))}
            <p style={{ margin: '0 0 6px', fontSize: 15, color: '#2c1a0e', fontWeight: 600, fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.02em' }}>
              Excluir esta memória?
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0 14px' }}>
              <div style={{flex:1,height:1,background:'rgba(160,120,72,0.25)'}}/>
              <span style={{fontSize:10,color:'#a07840'}}>✦</span>
              <div style={{flex:1,height:1,background:'rgba(160,120,72,0.25)'}}/>
            </div>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#7a6050', fontFamily: '"Inter", sans-serif' }}>
              &ldquo;{pin.title}&rdquo; será removida permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <VintageBtn onClick={() => setShowConfirm(false)}>Cancelar</VintageBtn>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '6px 20px', borderRadius: 3, cursor: 'pointer', fontSize: 11,
                  background: '#8b3a30', border: '1px solid #6a2a20', color: '#fff',
                  fontWeight: 600, fontFamily: '"Inter", sans-serif', letterSpacing: '0.05em',
                  opacity: deleting ? 0.6 : 1,
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
