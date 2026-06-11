'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  src:      string
  caption?: string
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <polygon points="2,1 13,7 2,13" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="2" y="1" width="4" height="12" rx="1" />
      <rect x="8" y="1" width="4" height="12" rx="1" />
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function MuteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

// ── Control button ────────────────────────────────────────────────────────────

function CtrlBtn({ onClick, children }: { onClick: React.MouseEventHandler<HTMLButtonElement>; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:  hov ? 'rgba(253,248,238,0.14)' : 'transparent',
        border:      'none',
        borderRadius: 3,
        cursor:      'pointer',
        padding:     '4px 5px',
        color:       hov ? 'rgba(253,248,238,1)' : 'rgba(253,248,238,0.72)',
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        flexShrink:  0,
        transition:  'color 0.15s, background 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Seek bar ──────────────────────────────────────────────────────────────────

function SeekBar({ progress, onSeek }: { progress: number; onSeek: (ratio: number) => void }) {
  const [hov, setHov] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height:       hov ? 5 : 3,
        borderRadius: 3,
        background:   'rgba(253,248,238,0.16)',
        marginBottom: 10,
        cursor:       'pointer',
        position:     'relative',
        transition:   'height 0.15s ease',
      }}
    >
      {/* Filled */}
      <div style={{
        position:    'absolute',
        left: 0, top: 0, bottom: 0,
        width:       `${progress * 100}%`,
        background:  'linear-gradient(to right, #a07840, #c9a060)',
        borderRadius: 3,
      }} />
      {/* Thumb */}
      <div style={{
        position:   'absolute',
        left:       `${progress * 100}%`,
        top:        '50%',
        width:      hov ? 12 : 0,
        height:     hov ? 12 : 0,
        borderRadius: '50%',
        background: '#c9a060',
        transform:  'translate(-50%, -50%)',
        boxShadow:  '0 1px 4px rgba(0,0,0,0.55)',
        transition: 'width 0.15s ease, height 0.15s ease',
      }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoPlayer({ src, caption }: Props) {
  const videoRef                  = useRef<HTMLVideoElement>(null)
  const containerRef              = useRef<HTMLDivElement>(null)
  const [playing, setPlaying]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [current, setCurrent]     = useState(0)
  const [duration, setDuration]   = useState(0)
  const [muted, setMuted]           = useState(false)
  const [hovered, setHovered]       = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const showControls = hovered || !playing

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay           = () => setPlaying(true)
    const onPause          = () => setPlaying(false)
    const onEnded          = () => setPlaying(false)
    const onTimeUpdate     = () => {
      setCurrent(v.currentTime)
      setProgress(v.duration ? v.currentTime / v.duration : 0)
    }
    const onLoadedMetadata = () => setDuration(v.duration)

    const onFsChange = () => setFullscreen(!!document.fullscreenElement)

    v.addEventListener('play',            onPlay)
    v.addEventListener('pause',           onPause)
    v.addEventListener('ended',           onEnded)
    v.addEventListener('timeupdate',      onTimeUpdate)
    v.addEventListener('loadedmetadata',  onLoadedMetadata)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      v.removeEventListener('play',           onPlay)
      v.removeEventListener('pause',          onPause)
      v.removeEventListener('ended',          onEnded)
      v.removeEventListener('timeupdate',     onTimeUpdate)
      v.removeEventListener('loadedmetadata', onLoadedMetadata)
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play() } else { v.pause() }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) { document.exitFullscreen() } else { el.requestFullscreen?.() }
  }, [])

  const seek = useCallback((ratio: number) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    v.currentTime = ratio * v.duration
  }, [])

  return (
    <div style={{ borderRadius: 6, overflow: 'hidden' }}>
      {/* Viewport */}
      <div
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:    'relative',
          background:  '#150e06',
          aspectRatio: fullscreen ? undefined : '16/9',
          width:       '100%',
          height:      fullscreen ? '100%' : undefined,
          cursor:      'pointer',
          userSelect:  'none',
        }}
      >
        <video
          ref={videoRef}
          src={src}
          playsInline
          preload="metadata"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        />

        {/* Click-to-play overlay */}
        <div
          onClick={togglePlay}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Center play button */}
          <div style={{
            width:         56,
            height:        56,
            borderRadius:  '50%',
            background:    'rgba(253,248,238,0.13)',
            backdropFilter: 'blur(8px)',
            border:        '1.5px solid rgba(253,248,238,0.28)',
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'center',
            opacity:        !playing ? 1 : 0,
            transform:      !playing ? 'scale(1)' : 'scale(0.75)',
            transition:     'opacity 0.25s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents:  'none',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="rgba(253,248,238,0.95)">
              <polygon points="7,3 19,11 7,19" />
            </svg>
          </div>

          {/* Brief pause flash */}
          <div style={{
            position:       'absolute',
            width:          56,
            height:         56,
            borderRadius:   '50%',
            background:     'rgba(253,248,238,0.13)',
            backdropFilter: 'blur(8px)',
            border:         '1.5px solid rgba(253,248,238,0.28)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            opacity:         playing && hovered ? 0.7 : 0,
            transition:     'opacity 0.2s ease',
            pointerEvents:  'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="rgba(253,248,238,0.95)">
              <rect x="3" y="2" width="4" height="14" rx="1.5" />
              <rect x="11" y="2" width="4" height="14" rx="1.5" />
            </svg>
          </div>
        </div>

        {/* Controls bar */}
        <div style={{
          position:       'absolute',
          bottom: 0, left: 0, right: 0,
          padding:        '36px 14px 12px',
          background:     'linear-gradient(to top, rgba(21,14,6,0.94) 0%, rgba(21,14,6,0.55) 55%, transparent 100%)',
          opacity:         showControls ? 1 : 0,
          transform:       showControls ? 'translateY(0)' : 'translateY(8px)',
          transition:      'opacity 0.28s ease, transform 0.28s ease',
          pointerEvents:   showControls ? 'auto' : 'none',
        }}>
          <SeekBar progress={progress} onSeek={seek} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CtrlBtn onClick={(e) => { e.stopPropagation(); togglePlay() }}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </CtrlBtn>

            <CtrlBtn onClick={(e) => { e.stopPropagation(); toggleMute() }}>
              {muted ? <MuteIcon /> : <VolumeIcon />}
            </CtrlBtn>

            <span style={{
              fontSize:    10,
              color:       'rgba(253,248,238,0.55)',
              fontFamily:  '"Inter",sans-serif',
              letterSpacing: '0.04em',
              paddingLeft: 4,
              flex: 1,
            }}>
              {fmt(current)} / {fmt(duration)}
            </span>

            <CtrlBtn onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}>
              <FullscreenIcon />
            </CtrlBtn>
          </div>
        </div>

        {/* Vignette top */}
        <div style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     60,
          background: 'linear-gradient(to bottom, rgba(21,14,6,0.35) 0%, transparent 100%)',
          pointerEvents: 'none',
          opacity:    showControls ? 1 : 0,
          transition: 'opacity 0.28s ease',
        }} />
      </div>

      {caption && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9a8068', fontFamily: '"Inter",sans-serif' }}>
          {caption}
        </p>
      )}
    </div>
  )
}
