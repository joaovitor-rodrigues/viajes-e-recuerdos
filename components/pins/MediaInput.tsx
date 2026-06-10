'use client'

import { useState, useEffect } from 'react'
import { validateAndParseMediaUrl } from '@/lib/drive'
import { isGPhotosUrl } from '@/lib/googlePhotos'
import { useResolvedMedia } from '@/hooks/useResolvedMedia'
import VideoPlayer from '@/components/ui/VideoPlayer'
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

  const isGPhotos = isGPhotosUrl(value.url)
  const { resolved: gphotosResolved, loading: gphotosLoading } = useResolvedMedia(value.url)

  useEffect(() => {
    if (!value.url)   { setUrlState('idle');    setParsed(null); return }
    if (isGPhotos)    { setUrlState('valid');   setParsed(null); return }
    const result = validateAndParseMediaUrl(value.url)
    if (result) { setUrlState('valid');   setParsed(result) }
    else        { setUrlState('invalid'); setParsed(null) }
  }, [value.url, isGPhotos])

  const INPUT: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 4, fontSize: 12, outline: 'none',
    background: 'rgba(241,233,215,0.5)', color: '#2c1a0e',
    border: `1px solid ${
      urlState === 'valid'   ? 'rgba(78,178,135,0.7)' :
      urlState === 'invalid' ? 'rgba(201,72,91,0.6)'  :
      'rgba(160,120,72,0.2)'}`,
    transition: 'border-color 0.18s',
    fontFamily: 'var(--font-inter,"Inter",sans-serif)',
  }

  const isDrivePicker = value.url.startsWith('https://drive.google.com/') && value.caption

  return (
    <div style={{
      background: 'rgba(160,120,72,0.05)',
      border: '1px solid rgba(160,120,72,0.15)',
      borderRadius: 4, padding: 10, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#a07840', minWidth: 16, flexShrink: 0 }}>
              {value.type === 'image' ? '🖼️' : '🎬'} {index + 1}
            </span>

            {isGPhotos ? (
              <div style={{ ...INPUT, flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,168,83,0.06)', borderColor: 'rgba(52,168,83,0.35)' }}>
                <span style={{ fontSize: 11, color: '#34a853', fontFamily: '"Inter",sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📷 {value.caption || 'Google Fotos'}
                </span>
              </div>
            ) : isDrivePicker ? (
              <div style={{ ...INPUT, flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(66,133,244,0.06)', borderColor: 'rgba(66,133,244,0.3)' }}>
                <span style={{ fontSize: 11, color: '#4285F4', fontFamily: '"Inter",sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📁 {value.caption}
                </span>
              </div>
            ) : (
              <input
                value={value.url}
                onChange={(e) => onChange({ ...value, url: e.target.value })}
                placeholder="URL (Google Drive, link direto…)"
                style={{ ...INPUT, flex: 1 }}
              />
            )}
          </div>

          {urlState === 'invalid' && (
            <p style={{ margin: 0, fontSize: 11, color: '#8b3a30', paddingLeft: 22 }}>
              URL inválida — use um link https://
            </p>
          )}

          {!isGPhotos && (
            <input
              value={isDrivePicker ? '' : value.caption}
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
              placeholder="Legenda (opcional)"
              maxLength={500}
              style={{ ...INPUT, width: '100%', boxSizing: 'border-box', display: isDrivePicker ? 'none' : undefined }}
            />
          )}
        </div>

        <button
          type="button" onClick={onRemove}
          style={{ background: 'transparent', border: '1px solid rgba(160,120,72,0.25)', borderRadius: 4, color: '#9a8068', cursor: 'pointer', padding: '6px 8px', fontSize: 12, flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(201,72,91,0.08)'; b.style.borderColor = 'rgba(201,72,91,0.4)'; b.style.color = '#C9485B' }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.borderColor = 'rgba(160,120,72,0.25)'; b.style.color = '#9a8068' }}
        >
          ✕
        </button>
      </div>

      {/* Preview */}
      {urlState === 'valid' && (
        <div style={{ marginTop: 8 }}>
          {isGPhotos ? (
            gphotosLoading ? (
              <div style={{ fontSize: 11, color: '#a07840', fontFamily: '"Inter",sans-serif', padding: '6px 0' }}>
                Carregando preview…
              </div>
            ) : gphotosResolved ? (
              value.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gphotosResolved.displayUrl} alt={value.caption || 'preview'} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <VideoPlayer src={gphotosResolved.displayUrl} />
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 4, background: 'rgba(52,168,83,0.07)', border: '1px solid rgba(52,168,83,0.3)' }}>
                <span style={{ fontSize: 11, color: '#2a7a50', fontFamily: '"Inter",sans-serif' }}>✓ Google Fotos</span>
              </div>
            )
          ) : parsed ? (
            parsed.fileId ? (
              value.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={parsed.displayUrl} alt={value.caption || 'preview'} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <iframe src={parsed.embedUrl} style={{ width: '100%', height: 200, border: 'none', borderRadius: 4 }} allow="autoplay" title={value.caption || `video-${index}`} />
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', borderRadius: 4, background: 'rgba(78,178,135,0.07)', border: '1px solid rgba(78,178,135,0.3)' }}>
                <span style={{ fontSize: 11, color: '#3a7a60', fontFamily: '"Inter",sans-serif' }}>✓ Link salvo</span>
                <a href={parsed.displayUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#a07840', fontFamily: '"Inter",sans-serif', textDecoration: 'underline', textUnderlineOffset: 3 }}>Abrir ↗</a>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  )
}
