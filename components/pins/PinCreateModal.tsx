'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapStore } from '@/stores/mapStore'
import PinEditForm from './PinEditForm'

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'block' }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function PinCreateModal() {
  const { creationMode, creationPosition, prefilledCity, endCreation } = useMapStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') endCreation()
    }
    if (creationMode) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [creationMode, endCreation])

  return (
    <AnimatePresence>
      {creationMode && creationPosition && prefilledCity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) endCreation() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(20,15,40,0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22 }}
            className="pin-create-modal-inner"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(180,150,220,0.2)',
              borderRadius: 20,
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px 28px 24px',
              boxShadow: '0 16px 56px rgba(20,15,40,0.2)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24,
            }}>
              <h2 style={{
                margin: 0, fontSize: 18,
                color: '#1a1730',
                fontFamily: 'var(--font-inter, "Inter", sans-serif)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}>
                Nova memória
              </h2>
              <button
                onClick={endCreation}
                style={{
                  background: 'rgba(120,80,180,0.07)',
                  border: '1px solid rgba(120,80,180,0.15)',
                  borderRadius: '50%',
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#7b6fa0',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(120,80,180,0.14)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(120,80,180,0.07)' }}
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>

            <PinEditForm
              mode="create"
              initialValues={{
                latitude: creationPosition.lat,
                longitude: creationPosition.lng,
                city: prefilledCity.city,
                state: prefilledCity.state ?? '',
                country: prefilledCity.country,
              }}
              onCancel={endCreation}
              onSuccess={endCreation}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
