'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapStore } from '@/stores/mapStore'
import { getFlagColor } from '@/lib/flagColors'
import PinEditForm, { type PinEditFormHandle } from './PinEditForm'

const DRAFT_KEY = 'pin-creation-draft'

function Corners() {
  const c = 'rgba(160,120,72,0.4)'
  const s = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', width: 12, height: 12, pointerEvents: 'none',
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

export default function PinCreateModal() {
  const { creationMode, creationPosition, prefilledCity, endCreation } = useMapStore()
  const formRef = useRef<PinEditFormHandle>(null)
  const [showDiscard, setShowDiscard] = useState(false)
  const [hasDraft, setHasDraft]       = useState(false)

  // Check for existing draft whenever modal opens
  useEffect(() => {
    if (creationMode && creationPosition && prefilledCity) {
      setShowDiscard(false)
      setHasDraft(!!localStorage.getItem(DRAFT_KEY))
    }
  }, [creationMode, creationPosition, prefilledCity])

  const handleCloseAttempt = useCallback(() => {
    if (formRef.current?.isDirty) {
      setShowDiscard(true)
    } else {
      endCreation()
    }
  }, [endCreation])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (showDiscard) { setShowDiscard(false); return }
      handleCloseAttempt()
    }
    if (creationMode) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [creationMode, showDiscard, handleCloseAttempt])

  const handleSaveDraft = useCallback(() => {
    const values = formRef.current?.getValues()
    if (values) localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    setShowDiscard(false)
    endCreation()
  }, [endCreation])

  const handleDiscard = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setShowDiscard(false)
    endCreation()
  }, [endCreation])

  const handleRestoreDraft = useCallback(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw)
      // migrate drafts saved before the date-range change
      if (draft.pin_date && !draft.start_date) {
        draft.start_date = draft.pin_date
        draft.end_date   = draft.pin_date
        delete draft.pin_date
      }
      formRef.current?.reset(draft)
    } catch { /* ignore malformed draft */ }
    setHasDraft(false)
  }, [])

  const handleDismissDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
  }, [])

  const handleSuccess = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    endCreation()
  }, [endCreation])

  const btnClose: React.CSSProperties = {
    marginTop: 2, flexShrink: 0,
    background: 'transparent',
    border: '1px solid rgba(160,120,72,0.25)',
    borderRadius: 4, width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#a07840', transition: 'background 0.15s',
  }

  return (
    <AnimatePresence>
      {creationMode && creationPosition && prefilledCity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(44,26,14,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'relative',
              background: 'rgba(253,248,238,0.98)',
              border: '2px solid rgba(160,120,72,0.28)',
              borderRadius: 6,
              width: '100%', maxWidth: 580,
              maxHeight: '90vh', overflowY: 'auto',
              padding: '28px 28px 24px',
              boxShadow: '0 8px 40px rgba(80,50,20,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <Corners />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ width: 28, height: 3, background: '#C9485B', borderRadius: 2, marginBottom: 10 }} />
                <h2 style={{
                  margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.2,
                  fontFamily: '"Cormorant Garamond", serif',
                  color: '#2c1a0e', letterSpacing: '0.01em',
                }}>
                  Nova memória
                </h2>
              </div>
              <button
                onClick={handleCloseAttempt}
                aria-label="Fechar"
                style={btnClose}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.08)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'block' }}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: hasDraft ? 14 : 22 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
              <span style={{ fontSize: 10, color: '#a07840' }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(160,120,72,0.22)' }} />
            </div>

            {/* Draft restore banner */}
            {hasDraft && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                marginBottom: 18, padding: '8px 12px',
                background: 'rgba(160,120,72,0.08)',
                border: '1px solid rgba(160,120,72,0.28)',
                borderLeft: '3px solid #a07840',
                borderRadius: 4,
              }}>
                <span style={{ fontSize: 11, color: '#6a4e2a', fontFamily: '"Inter", sans-serif', lineHeight: 1.4 }}>
                  Rascunho encontrado. Deseja restaurar?
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={handleRestoreDraft}
                    style={{
                      padding: '4px 10px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                      background: '#a07840', border: 'none', color: '#fff',
                      fontFamily: '"Inter", sans-serif', fontWeight: 600,
                    }}
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={handleDismissDraft}
                    style={{
                      padding: '4px 8px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(160,120,72,0.3)',
                      color: '#9a8068', fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <PinEditForm
              ref={formRef}
              mode="create"
              initialValues={{
                latitude: creationPosition.lat,
                longitude: creationPosition.lng,
                city:    prefilledCity.city,
                state:   prefilledCity.state ?? '',
                country: prefilledCity.country,
                color:   getFlagColor(prefilledCity.country),
              }}
              onCancel={handleCloseAttempt}
              onSuccess={handleSuccess}
            />

          </motion.div>

          {/* Discard confirmation — outside the scrollable card, always centered */}
          <AnimatePresence>
            {showDiscard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 16,
                }}
              >
                <motion.div
                  initial={{ scale: 0.96, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.96, y: 8 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    background: 'rgba(253,248,238,0.99)',
                    border: '2px solid rgba(160,120,72,0.28)',
                    borderRadius: 6,
                    padding: '32px 28px',
                    width: '100%', maxWidth: 360,
                    boxShadow: '0 8px 40px rgba(80,50,20,0.22)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 18, color: '#a07840', marginBottom: 12 }}>✦</div>
                  <h3 style={{
                    margin: '0 0 10px', fontSize: 21, fontWeight: 600,
                    fontFamily: '"Cormorant Garamond", serif', color: '#2c1a0e',
                  }}>
                    Salvar progresso?
                  </h3>
                  <p style={{
                    margin: '0 0 24px', fontSize: 12, color: '#7a6050',
                    fontFamily: '"Inter", sans-serif', lineHeight: 1.6,
                  }}>
                    Você começou a preencher esta memória. Deseja salvar um rascunho para continuar depois?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={handleSaveDraft}
                      style={{
                        padding: '9px 20px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                        background: '#C9485B', border: 'none', color: '#fff', fontWeight: 600,
                        fontFamily: '"Inter", sans-serif', letterSpacing: '0.04em',
                        boxShadow: '0 3px 12px rgba(201,72,91,0.28)',
                      }}
                    >
                      Salvar rascunho
                    </button>
                    <button
                      onClick={handleDiscard}
                      style={{
                        padding: '8px 20px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(160,120,72,0.35)',
                        color: '#7a6050', fontFamily: '"Inter", sans-serif', fontWeight: 500,
                      }}
                    >
                      Descartar e fechar
                    </button>
                    <button
                      onClick={() => setShowDiscard(false)}
                      style={{
                        padding: '6px 20px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                        background: 'transparent', border: 'none',
                        color: '#a07840', fontFamily: '"Inter", sans-serif',
                        textDecoration: 'underline', textUnderlineOffset: 3,
                      }}
                    >
                      Continuar editando
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
