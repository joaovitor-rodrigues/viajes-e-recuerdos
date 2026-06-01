'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getDirectImageUrl, validateAndParseMediaUrl } from '@/lib/drive'
import type { MediaItem } from '@/types/database'

interface Props {
  photos: MediaItem[]
}

function Skeleton() {
  return (
    <div style={{
      aspectRatio: '4/3', borderRadius: 8,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

interface LightboxProps {
  photos: { src: string; caption: string }[]
  startIndex: number
  onClose: () => void
}

function Lightbox({ photos, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex)

  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'none', border: 'none', color: '#f0ece4',
          fontSize: 28, cursor: 'pointer', padding: 8,
        }}
      >
        ✕
      </button>

      {/* Counter */}
      <span style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: '#888', fontSize: 12 }}>
        {index + 1} / {photos.length}
      </span>

      {/* Image */}
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#f0ece4', fontSize: 20, cursor: 'pointer', padding: '12px 16px', flexShrink: 0 }}
        >
          ‹
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <img
            src={photos[index].src}
            alt={photos[index].caption}
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }}
          />
          {photos[index].caption && (
            <p style={{ margin: '12px 0 0', color: '#aaa', fontSize: 13 }}>{photos[index].caption}</p>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#f0ece4', fontSize: 20, cursor: 'pointer', padding: '12px 16px', flexShrink: 0 }}
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default function PinGallery({ photos }: Props) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  const parsedPhotos = photos.map((p) => {
    const result = validateAndParseMediaUrl(p.url)
    return { src: result ? getDirectImageUrl(result.fileId) : '', caption: p.caption }
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ marginBottom: 40 }}
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (min-width: 600px) { .pin-gallery-grid { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>

      <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Fotos
      </h2>

      <div
        className="pin-gallery-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}
      >
        {parsedPhotos.map((photo, i) => (
          <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setLightboxIndex(i)}>
            {!loaded[i] && <Skeleton />}
            {photo.src && (
              <img
                src={photo.src}
                alt={photo.caption || `foto ${i + 1}`}
                onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                style={{
                  width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                  borderRadius: 8, display: loaded[i] ? 'block' : 'none',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.02)' }}
                onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
              />
            )}
            {photo.caption && loaded[i] && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666', textAlign: 'center' }}>
                {photo.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={parsedPhotos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </motion.section>
  )
}
