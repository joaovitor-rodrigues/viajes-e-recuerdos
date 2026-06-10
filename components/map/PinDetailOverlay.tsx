'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapStore } from '@/stores/mapStore'
import { formatDateRange } from '@/lib/dateRange'
import { validateAndParseMediaUrl } from '@/lib/drive'
import { isGPhotosUrl } from '@/lib/googlePhotos'

import { usePins } from '@/hooks/usePins'
import VideoPlayer from '@/components/ui/VideoPlayer'
import type { Pin, MediaItem } from '@/types/database'

const PinMiniMap = dynamic(() => import('@/components/pin-page/PinMiniMap'), { ssr: false })

function mediaSrc(item: MediaItem): string {
  if (isGPhotosUrl(item.url)) return `/api/photos/proxy?url=${encodeURIComponent(item.url)}`
  return validateAndParseMediaUrl(item.url)?.displayUrl ?? item.url
}

function PhotoCell({ src, caption, onClick }: { src: string; caption: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 4, overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', position: 'relative' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src} alt={caption}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: hovered
          ? 'linear-gradient(to top, rgba(44,26,14,0.72) 0%, rgba(44,26,14,0.18) 55%, transparent 100%)'
          : 'linear-gradient(to top, rgba(44,26,14,0) 0%, transparent 100%)',
        transition: 'background 0.3s ease',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 10,
      }}>
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="rgba(253,248,238,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.8)',
            transition: 'opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))',
          }}
        >
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ srcs, captions, startIndex, onClose }: {
  srcs: string[]
  captions: string[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const prev = useCallback(() => setIndex((i) => (i - 1 + srcs.length) % srcs.length), [srcs.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % srcs.length), [srcs.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'none', border: 'none', color: '#f0ece4',
        fontSize: 28, cursor: 'pointer', padding: 8, lineHeight: 1,
      }}>✕</button>

      <span style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', color: '#666', fontSize: 12, fontFamily: '"Inter",sans-serif' }}>
        {index + 1} / {srcs.length}
      </span>

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', gap: 16 }}>
        {srcs.length > 1 && (
          <button onClick={prev} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#f0ece4', fontSize: 22, cursor: 'pointer', padding: '12px 16px', flexShrink: 0 }}>‹</button>
        )}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={srcs[index]} alt={captions[index]} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} />
          {captions[index] && (
            <p style={{ margin: '10px 0 0', color: '#aaa', fontSize: 13, fontFamily: '"Inter",sans-serif' }}>{captions[index]}</p>
          )}
        </div>
        {srcs.length > 1 && (
          <button onClick={next} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#f0ece4', fontSize: 22, cursor: 'pointer', padding: '12px 16px', flexShrink: 0 }}>›</button>
        )}
      </div>
    </motion.div>
  )
}

interface Props {
  pin: Pin
  onClose: () => void
}


function formatLoc(pin: Pin) {
  return [pin.city, pin.state, pin.country].filter(Boolean).join(', ')
}

// ─── corner ornament shared across all cards ─────────────────────────────────
function Corners({ size = 12, opacity = 0.4 }: { size?: number; opacity?: number }) {
  const c = `rgba(160,120,72,${opacity})`
  const s = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', width: size, height: size, pointerEvents: 'none',
    borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', ...extra,
  })
  return (
    <>
      <div style={s({ top: 5, left: 5,     borderTop: `2px solid ${c}`, borderLeft:  `2px solid ${c}` })} />
      <div style={s({ top: 5, right: 5,    borderTop: `2px solid ${c}`, borderRight: `2px solid ${c}` })} />
      <div style={s({ bottom: 5, left: 5,  borderBottom: `2px solid ${c}`, borderLeft:  `2px solid ${c}` })} />
      <div style={s({ bottom: 5, right: 5, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` })} />
    </>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
      <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
    </div>
  )
}

export default function PinDetailOverlay({ pin, onClose }: Props) {
  const { startEditing } = useMapStore()
  const { deletePin } = usePins()
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const photos = pin.media.filter((m) => m.type === 'image')
  const videos = pin.media.filter((m) => m.type === 'video')
  const photoSrcs     = photos.map(mediaSrc)
  const photoCaptions = photos.map((p) => p.caption)

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    const ok = await deletePin(pin.id)
    if (ok) onClose()
    else setDeleting(false)
  }, [deletePin, pin.id, onClose])

  const btnBase: React.CSSProperties = {
    padding: '5px 14px', borderRadius: 3, fontSize: 11,
    fontFamily: '"Inter", sans-serif', fontWeight: 500,
    letterSpacing: '0.05em', cursor: 'pointer',
    border: '1px solid rgba(160,120,72,0.35)',
    background: 'rgba(160,120,72,0.07)',
    color: '#6a4e2a', transition: 'background 0.15s',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
      transition={{ duration: 0.38, delay: 0.25 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 10,
        overflowY: 'auto',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '40px 16px 120px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          onClick={onClose}
          style={{
            ...btnBase,
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 20, background: 'rgba(253,248,238,0.85)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(253,248,238,0.97)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(253,248,238,0.85)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar ao mapa
        </motion.button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.35 }}
          style={{
            background: 'rgba(253,248,238,0.97)',
            border: '2px solid rgba(160,120,72,0.28)',
            borderRadius: 6, padding: '28px 28px 24px',
            boxShadow: '0 4px 28px rgba(80,50,20,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
            position: 'relative', marginBottom: 16,
          }}
        >
          <Corners />

          {/* Action buttons */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
            <button
              onClick={() => startEditing(pin)}
              style={btnBase}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.14)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
            >Editar</button>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ ...btnBase, color: '#8b3a30', borderColor: 'rgba(180,60,50,0.35)', background: 'rgba(180,60,50,0.07)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,60,50,0.14)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,60,50,0.07)' }}
            >Excluir</button>
          </div>

          <div style={{ paddingRight: 120 }}>
            <div style={{ width: 32, height: 3, background: pin.color ?? '#C9485B', borderRadius: 2, marginBottom: 12 }} />
            <h1 style={{
              margin: '0 0 4px', fontSize: 26, fontWeight: 600, lineHeight: 1.2,
              fontFamily: '"Cormorant Garamond", serif', color: '#2c1a0e', letterSpacing: '0.01em',
            }}>
              {pin.title}
            </h1>
            <Divider />
            <p style={{ margin: '0 0 3px', fontSize: 12, color: '#9a8068', fontFamily: '"Inter", sans-serif' }}>
              {formatDateRange(pin.start_date, pin.end_date)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#7a6050', fontFamily: '"Inter", sans-serif' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {formatLoc(pin)}
            </p>
          </div>
        </motion.div>

        {/* Description */}
        {pin.description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.45 }}
            style={{
              background: 'rgba(253,248,238,0.95)',
              border: '2px solid rgba(160,120,72,0.22)',
              borderRadius: 6, padding: '22px 24px',
              boxShadow: '0 2px 16px rgba(80,50,20,0.08)', position: 'relative',
              marginBottom: 16,
            }}
          >
            <Corners size={10} opacity={0.3} />
            <SectionLabel>Memória</SectionLabel>
            <p style={{
              margin: 0, fontSize: 15, lineHeight: 1.9,
              color: '#3a2a1a', fontFamily: '"Inter", sans-serif', whiteSpace: 'pre-wrap',
            }}>
              {pin.description}
            </p>
          </motion.div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.52 }}
            style={{
              background: 'rgba(253,248,238,0.95)',
              border: '2px solid rgba(160,120,72,0.22)',
              borderRadius: 6, padding: '22px 24px',
              boxShadow: '0 2px 16px rgba(80,50,20,0.08)', position: 'relative',
              marginBottom: 16,
            }}
          >
            <Corners size={10} opacity={0.3} />
            <SectionLabel>Fotos</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(photos.length, 3)}, 1fr)`,
              gap: 8,
            }}>
              {photos.map((m, i) => (
                <PhotoCell
                  key={i}
                  src={photoSrcs[i]}
                  caption={m.caption}
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.58 }}
            style={{
              background: 'rgba(253,248,238,0.95)',
              border: '2px solid rgba(160,120,72,0.22)',
              borderRadius: 6, padding: '22px 24px',
              boxShadow: '0 2px 16px rgba(80,50,20,0.08)', position: 'relative',
              marginBottom: 16,
            }}
          >
            <Corners size={10} opacity={0.3} />
            <SectionLabel>Vídeos</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {videos.map((m, i) => {
                // Google Photos video
                if (isGPhotosUrl(m.url)) {
                  const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(m.url)}`
                  return <VideoPlayer key={i} src={proxyUrl} caption={m.caption} />
                }

                const parsed = validateAndParseMediaUrl(m.url)
                if (!parsed) return null
                return (
                  <div key={i}>
                    {parsed.fileId ? (
                      <VideoPlayer src={parsed.embedUrl} caption={m.caption} />
                    ) : (
                      <button
                        onClick={() => window.open(m.url, '_blank', 'width=1100,height=780,noopener,noreferrer')}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                          padding: '12px 16px', borderRadius: 4, cursor: 'pointer',
                          background: 'rgba(44,26,14,0.88)', border: '1px solid rgba(160,120,72,0.2)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(44,26,14,0.97)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(44,26,14,0.88)' }}
                      >
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0, color: 'rgba(253,248,238,0.8)' }}>
                          <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1.5"/>
                          <polygon points="14,11 26,17 14,23" fill="currentColor"/>
                        </svg>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 12, color: 'rgba(253,248,238,0.95)', fontFamily: '"Inter",sans-serif', fontWeight: 500 }}>
                            {m.caption || `Vídeo ${i + 1}`}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(253,248,238,0.4)', fontFamily: '"Inter",sans-serif', marginTop: 2 }}>
                            Abre em nova janela ↗
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Location mini map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.64 }}
        >
          <PinMiniMap pin={pin} onNavigate={onClose} />
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            srcs={photoSrcs}
            captions={photoCaptions}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 20,
              background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(253,248,238,0.98)', border: '2px solid rgba(160,120,72,0.28)',
                borderRadius: 6, padding: '32px 28px', maxWidth: 340, width: '90%',
                textAlign: 'center', position: 'relative',
              }}
            >
              <Corners />
              <p style={{ margin: '0 0 6px', fontSize: 15, fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, color: '#2c1a0e' }}>
                Excluir esta memória?
              </p>
              <Divider />
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#7a6050', fontFamily: '"Inter", sans-serif' }}>
                &ldquo;{pin.title}&rdquo; será removida permanentemente.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button style={btnBase} onClick={() => setShowConfirm(false)}>Cancelar</button>
                <button
                  onClick={handleDelete} disabled={deleting}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{
        fontSize: 10, color: '#a07840', textTransform: 'uppercase',
        letterSpacing: '0.12em', fontWeight: 600, fontFamily: '"Inter", sans-serif',
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.2)' }} />
    </div>
  )
}
