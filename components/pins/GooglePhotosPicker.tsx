'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { encodeGPhotosUrl, type AccountLabel, type PickerMediaItem } from '@/lib/googlePhotos'

export interface GPhotosPickedItem {
  url:      string   // gphotos://label/sessionId/itemId
  mimeType: string
  filename: string
  thumbUrl: string   // baseUrl=w400, temporária — só para preview
}

interface Props {
  label:     AccountLabel
  filter?:   'image' | 'video' | 'all'
  onConfirm: (items: GPhotosPickedItem[]) => void
  onClose:   () => void
}

// ── Estados da máquina de estados ─────────────────────────────────────────
type State =
  | { step: 'creating' }
  | { step: 'waiting';  sessionId: string; pickerUri: string }
  | { step: 'loading' }
  | { step: 'confirm';  sessionId: string; items: PickerMediaItem[] }
  | { step: 'error';    message: string }

export default function GooglePhotosPicker({ label, filter = 'all', onConfirm, onClose }: Props) {
  const [state,    setState]    = useState<State>({ step: 'creating' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const pickerWindowRef = useRef<Window | null>(null)
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cria a sessão na montagem do componente
  useEffect(() => {
    let cancelled = false
    fetch('/api/photos/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
      .then(async r => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`)
        return body as { sessionId: string; pickerUri: string }
      })
      .then(({ sessionId, pickerUri }) => {
        if (cancelled) return
        pickerWindowRef.current = window.open(pickerUri, '_blank', 'width=960,height=720,noopener')
        setState({ step: 'waiting', sessionId, pickerUri })
      })
      .catch(e => { if (!cancelled) setState({ step: 'error', message: String(e) }) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling enquanto aguarda seleção
  useEffect(() => {
    if (state.step !== 'waiting') return
    const { sessionId } = state

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/photos/session?sessionId=${encodeURIComponent(sessionId)}&label=${encodeURIComponent(label)}`,
        )
        if (!r.ok) return
        const data = await r.json() as { mediaItemsSet: boolean }
        if (!data.mediaItemsSet) return

        clearInterval(pollRef.current!)
        pickerWindowRef.current?.close()
        setState({ step: 'loading' })

        const itemsRes = await fetch(
          `/api/photos/session/items?sessionId=${encodeURIComponent(sessionId)}&label=${encodeURIComponent(label)}`,
        )
        const { items } = await itemsRes.json() as { items: PickerMediaItem[] }

        const filtered =
          filter === 'all'   ? items :
          filter === 'image' ? items.filter(i => i.mediaFile.mimeType.startsWith('image/')) :
          items.filter(i => i.mediaFile.mimeType.startsWith('video/'))

        setState({ step: 'confirm', sessionId, items: filtered })
        setSelected(new Set(filtered.map(i => i.id)))
      } catch { /* silently retry */ }
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

  const reopenPicker = useCallback(() => {
    if (state.step !== 'waiting') return
    pickerWindowRef.current = window.open(state.pickerUri, '_blank', 'width=960,height=720,noopener')
  }, [state])

  function toggleItem(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleConfirm() {
    if (state.step !== 'confirm') return
    const picked: GPhotosPickedItem[] = state.items
      .filter(i => selected.has(i.id))
      .map(i => ({
        url:      encodeGPhotosUrl(label, state.sessionId, i.id),
        mimeType: i.mediaFile.mimeType,
        filename: i.mediaFile.filename,
        thumbUrl: `${i.mediaFile.baseUrl}=w400`,
      }))
    onConfirm(picked)
  }

  // ── Estilos comuns ────────────────────────────────────────────────────────
  const btn: React.CSSProperties = {
    padding: '6px 16px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
    fontFamily: '"Inter", sans-serif', fontWeight: 500, transition: 'all 0.15s',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.97, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'rgba(253,248,238,0.99)',
          border: '2px solid rgba(160,120,72,0.28)',
          borderRadius: 6, width: '100%', maxWidth: 560,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(80,50,20,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(160,120,72,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: '"Cormorant Garamond",serif', color: '#2c1a0e', fontWeight: 600 }}>
              Google Fotos
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#a07840', fontFamily: '"Inter",sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {state.step === 'confirm'
                ? `${selected.size} de ${state.items.length} selecionado${selected.size !== 1 ? 's' : ''}`
                : label}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid rgba(160,120,72,0.25)', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', color: '#a07840', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 24 }}>
          <AnimatePresence mode="wait">
            {state.step === 'creating' && (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '24px 0' }}>
                <Spinner />
                <p style={{ marginTop: 14, fontSize: 13, color: '#6a4e2a', fontFamily: '"Inter",sans-serif' }}>
                  Criando sessão…
                </p>
              </motion.div>
            )}

            {state.step === 'waiting' && (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                <p style={{ margin: '0 0 6px', fontSize: 14, color: '#2c1a0e', fontFamily: '"Inter",sans-serif', fontWeight: 600 }}>
                  Selecione as fotos no Google Fotos
                </p>
                <p style={{ margin: '0 0 20px', fontSize: 12, color: '#9a8068', fontFamily: '"Inter",sans-serif' }}>
                  Uma aba foi aberta. Escolha as fotos e clique em <strong>Concluído</strong>.
                </p>
                <Spinner />
                <p style={{ marginTop: 10, fontSize: 11, color: '#b0a090', fontFamily: '"Inter",sans-serif' }}>
                  Aguardando seleção…
                </p>
                <button
                  onClick={reopenPicker}
                  style={{ marginTop: 16, ...btn, background: 'rgba(160,120,72,0.07)', border: '1px solid rgba(160,120,72,0.3)', color: '#6a4e2a' }}
                >
                  Abrir novamente ↗
                </button>
              </motion.div>
            )}

            {state.step === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '24px 0' }}>
                <Spinner />
                <p style={{ marginTop: 14, fontSize: 13, color: '#6a4e2a', fontFamily: '"Inter",sans-serif' }}>
                  Carregando itens selecionados…
                </p>
              </motion.div>
            )}

            {state.step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {state.items.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#9a8068', fontFamily: '"Inter",sans-serif', padding: '24px 0' }}>
                    Nenhum item encontrado com esse filtro.
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 6, maxHeight: 320, overflowY: 'auto',
                  }}>
                    {state.items.map(item => {
                      const isSel   = selected.has(item.id)
                      const isVideo = item.mediaFile.mimeType.startsWith('video/')
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          style={{
                            position: 'relative', padding: 0,
                            border: `2px solid ${isSel ? '#C9485B' : 'transparent'}`,
                            borderRadius: 4, cursor: 'pointer', overflow: 'hidden',
                            background: 'none', transition: 'border-color 0.12s',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${item.mediaFile.baseUrl}=w220-h220-c`}
                            alt={item.mediaFile.filename}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                            loading="lazy"
                          />
                          {isVideo && (
                            <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 3, padding: '1px 5px', fontSize: 9, color: '#fff', fontFamily: '"Inter",sans-serif' }}>
                              ▶
                            </div>
                          )}
                          {isSel && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,72,91,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#C9485B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {state.step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 13, color: '#8b3a30', fontFamily: '"Inter",sans-serif' }}>
                  {state.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(160,120,72,0.18)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          background: 'rgba(241,233,210,0.3)',
        }}>
          <button
            onClick={onClose}
            style={{ ...btn, background: 'transparent', border: '1px solid rgba(160,120,72,0.3)', color: '#7a6050' }}
          >
            Cancelar
          </button>
          {state.step === 'confirm' && (
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              style={{
                ...btn,
                background: selected.size === 0 ? 'rgba(201,72,91,0.35)' : '#C9485B',
                border: 'none', color: '#fff', fontWeight: 600,
                boxShadow: selected.size > 0 ? '0 3px 10px rgba(201,72,91,0.3)' : 'none',
                cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Adicionar {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Spinner() {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="rgba(160,120,72,0.6)" strokeWidth="2.5" strokeLinecap="round"
      style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}
