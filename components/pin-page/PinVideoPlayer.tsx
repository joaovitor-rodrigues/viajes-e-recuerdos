'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getEmbedUrl } from '@/lib/drive'
import { validateAndParseMediaUrl } from '@/lib/drive'
import type { MediaItem } from '@/types/database'

interface Props {
  videos: MediaItem[]
}

export default function PinVideoPlayer({ videos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (videos.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ marginBottom: 40 }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Vídeos
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {videos.map((video, i) => {
          const parsed = validateAndParseMediaUrl(video.url)
          const isOpen = openIndex === i

          return (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: isOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: '#f0ece4', fontSize: 13, textAlign: 'left',
                }}
              >
                <span>🎬 {video.caption || `Vídeo ${i + 1}`}</span>
                <span style={{ color: '#888', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && parsed && (
                <div>
                  <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                    <iframe
                      src={getEmbedUrl(parsed.fileId)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay"
                      title={video.caption || `video-${i}`}
                    />
                  </div>
                  {video.caption && (
                    <p style={{ margin: 0, padding: '8px 16px', fontSize: 12, color: '#888' }}>
                      {video.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
