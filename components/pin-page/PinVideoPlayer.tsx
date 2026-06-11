'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { validateAndParseMediaUrl } from '@/lib/drive'
import { isGPhotosUrl } from '@/lib/googlePhotos'
import type { MediaItem } from '@/types/database'

interface Props { videos: MediaItem[] }

function PlayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="16,13 30,20 16,27" fill="currentColor" />
    </svg>
  )
}

export default function PinVideoPlayer({ videos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  // Warm up the Supabase URL cache for Google Photos videos on mount.
  useEffect(() => {
    const gphotosVideos = videos.filter(v => isGPhotosUrl(v.url))
    if (gphotosVideos.length === 0) return
    gphotosVideos.forEach(v => {
      fetch(`/api/photos/resolve?url=${encodeURIComponent(v.url)}`).catch(() => {})
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
          const isOpen  = openIndex === i

          // ── Google Photos — inline video player ────────────────────────
          if (isGPhotosUrl(video.url)) {
            const videoSrc = `/api/photos/proxy?url=${encodeURIComponent(video.url)}`
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
                  <div style={{ padding: '0 0 8px' }}>
                    <video
                      src={videoSrc}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', display: 'block', background: '#000' }}
                    />
                  </div>
                )}
              </div>
            )
          }

          const parsed = validateAndParseMediaUrl(video.url)
          const isDrive = !!parsed?.fileId

          if (!parsed) return null

          // ── Google Drive — inline accordion player ─────────────────────
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

          // ── External URL — popup player ──────────────────────────────────
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

