'use client'

import { useState, useEffect } from 'react'
import { validateAndParseMediaUrl, getDirectImageUrl, getEmbedUrl } from '@/lib/drive'
import type { MediaItem } from '@/types/database'

type ValidationState = 'idle' | 'valid' | 'invalid'

interface Props {
  value: MediaItem
  onChange: (v: MediaItem) => void
  onRemove: () => void
  index: number
}

export default function MediaInput({ value, onChange, onRemove, index }: Props) {
  const [urlState, setUrlState] = useState<ValidationState>('idle')
  const [parsed, setParsed] = useState<ReturnType<typeof validateAndParseMediaUrl>>(null)

  useEffect(() => {
    if (!value.url) {
      setUrlState('idle')
      setParsed(null)
      return
    }
    const result = validateAndParseMediaUrl(value.url)
    if (result) {
      setUrlState('valid')
      setParsed(result)
    } else {
      setUrlState('invalid')
      setParsed(null)
    }
  }, [value.url])

  const borderColor = urlState === 'valid' ? '#4ECDC4' : urlState === 'invalid' ? '#E74C3C' : 'rgba(255,255,255,0.15)'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#888', minWidth: 16 }}>
              {value.type === 'image' ? '🖼️' : '🎬'} {index + 1}
            </span>
            <input
              value={value.url}
              onChange={(e) => onChange({ ...value, url: e.target.value })}
              placeholder="URL do Google Drive..."
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 6,
                border: `1px solid ${borderColor}`,
                background: 'rgba(255,255,255,0.05)', color: '#f0ece4', fontSize: 12,
                outline: 'none', transition: 'border-color 0.2s',
              }}
            />
          </div>

          {urlState === 'invalid' && (
            <p style={{ margin: 0, fontSize: 11, color: '#E74C3C', paddingLeft: 22 }}>
              URL inválida — use um link do Google Drive
            </p>
          )}

          <input
            value={value.caption}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            placeholder="Legenda (opcional)"
            maxLength={500}
            style={{
              padding: '6px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#f0ece4', fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: 6, color: '#E74C3C', cursor: 'pointer',
            padding: '6px 10px', fontSize: 12, flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {urlState === 'valid' && parsed && (
        <div style={{ marginTop: 8 }}>
          {value.type === 'image' ? (
            <img
              src={getDirectImageUrl(parsed.fileId)}
              alt={value.caption || 'preview'}
              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <iframe
              src={getEmbedUrl(parsed.fileId)}
              style={{ width: '100%', height: 200, border: 'none', borderRadius: 6 }}
              allow="autoplay"
              title={value.caption || `video-${index}`}
            />
          )}
        </div>
      )}
    </div>
  )
}
