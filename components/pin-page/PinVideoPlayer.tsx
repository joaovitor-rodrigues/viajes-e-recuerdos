'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { validateAndParseMediaUrl } from '@/lib/drive'
import { isGPhotosUrl } from '@/lib/googlePhotos'
import type { MediaItem } from '@/types/database'

interface Props { videos: MediaItem[] }

function fmt(s: number): string {
  if (!isFinite(s) || s <= 0) return ''
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="16,13 30,20 16,27" fill="currentColor" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="rgba(253,248,238,0.15)" strokeWidth="3" />
      <path
        d="M18 4 A14 14 0 0 1 32 18"
        stroke="rgba(160,120,72,0.85)" strokeWidth="3"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform" type="rotate"
          from="0 18 18" to="360 18 18"
          dur="0.9s" repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

// ── Per-video accordion item (Google Photos) ──────────────────────────────────

interface GPhotosVideoItemProps {
  video:    MediaItem
  index:    number
  isOpen:   boolean
  onToggle: () => void
}

function GPhotosVideoItem({ video, index, isOpen, onToggle }: GPhotosVideoItemProps) {
  const [metaReady, setMetaReady] = useState(false)
  const [duration, setDuration]   = useState<number | undefined>()
  const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(video.url)}`

  useEffect(() => {
    if (!isOpen) setMetaReady(false)
  }, [isOpen])

  function handleMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
    setDuration(e.currentTarget.duration)
    setMetaReady(true)
  }

  return (
    <div style={{
      border: '1px solid rgba(160,120,72,0.2)',
      borderRadius: 6, overflow: 'hidden',
      background: 'rgba(253,248,238,0.6)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '11px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#2c1a0e', fontSize: 13, textAlign: 'left',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🎬</span>
          {video.caption || `Vídeo ${index + 1}`}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {duration != null && (
            <span style={{ fontSize: 11, color: '#a07840', fontFamily: '"Inter",sans-serif' }}>
              {fmt(duration)}
            </span>
          )}
          <span style={{ color: '#a07840', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 0 8px' }}>
          {/* Placeholder visível até os metadados chegarem — o spinner fica aqui,
              não sobreposto ao <video controls> (cujos controles nativos ignoram z-index) */}
          {!metaReady && (
            <div style={{
              aspectRatio: '16/9', background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Spinner />
            </div>
          )}
          <video
            src={proxyUrl}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={handleMeta}
            style={{ width: '100%', display: metaReady ? 'block' : 'none', background: '#000' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PinVideoPlayer({ videos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  // Warm up Supabase URL cache for all Google Photos videos on mount
  useEffect(() => {
    videos.forEach(video => {
      if (!isGPhotosUrl(video.url)) return
      fetch(`/api/photos/resolve?url=${encodeURIComponent(video.url)}`).catch(() => {})
    })
  }, [videos])

  if (videos.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ marginBottom: 40 }}
    >
      <h2 style={{
        margin: '0 0 16px', fontSize: 10, color: '#a07840',
        textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
        fontFamily: '"Inter", sans-serif',
      }}>
        Vídeos
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {videos.map((video, i) => {
          const isOpen = openIndex === i

          // ── Google Photos ─────────────────────────────────────────────────
          if (isGPhotosUrl(video.url)) {
            return (
              <GPhotosVideoItem
                key={i}
                video={video}
                index={i}
                isOpen={isOpen}
                onToggle={() => setOpenIndex(isOpen ? null : i)}
              />
            )
          }

          const parsed  = validateAndParseMediaUrl(video.url)
          const isDrive = !!parsed?.fileId
          if (!parsed) return null

          // ── Google Drive ──────────────────────────────────────────────────
          if (isDrive) {
            return (
              <div key={i} style={{
                border: '1px solid rgba(160,120,72,0.2)',
                borderRadius: 6, overflow: 'hidden',
                background: 'rgba(253,248,238,0.6)',
              }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    color: '#2c1a0e', fontSize: 13, textAlign: 'left',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🎬</span>
                    {video.caption || `Vídeo ${i + 1}`}
                  </span>
                  <span style={{ color: '#a07840', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div>
                    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                      <iframe
                        src={parsed.embedUrl}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="autoplay"
                        title={video.caption || `video-${i}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          }

          // ── URL externa ───────────────────────────────────────────────────
          return (
            <button
              key={i}
              onClick={() => window.open(video.url, '_blank', 'width=1100,height=780,noopener,noreferrer')}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px',
                background: 'rgba(44,26,14,0.88)',
                border: '1px solid rgba(160,120,72,0.2)',
                borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.18s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(44,26,14,0.96)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(44,26,14,0.88)' }}
            >
              <span style={{ color: 'rgba(253,248,238,0.85)', flexShrink: 0 }}><PlayIcon /></span>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(253,248,238,0.95)', fontFamily: '"Inter",sans-serif', fontWeight: 500, marginBottom: 3 }}>
                  {video.caption || `Vídeo ${i + 1}`}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(253,248,238,0.45)', fontFamily: '"Inter",sans-serif' }}>Abre em nova janela ↗</div>
              </div>
            </button>
          )
        })}
      </div>
    </motion.section>
  )
}
