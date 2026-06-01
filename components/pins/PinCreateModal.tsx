'use client'

import { useEffect } from 'react'
import { useMapStore } from '@/stores/mapStore'
import PinEditForm from './PinEditForm'

export default function PinCreateModal() {
  const { creationMode, creationPosition, prefilledCity, endCreation } = useMapStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') endCreation()
    }
    if (creationMode) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [creationMode, endCreation])

  if (!creationMode || !creationPosition || !prefilledCity) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) endCreation() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f0ece4', fontFamily: 'Cormorant Garamond, serif' }}>
            Nova memória
          </h2>
          <button
            onClick={endCreation}
            style={{
              background: 'none', border: 'none', color: '#888',
              fontSize: 20, cursor: 'pointer', padding: 4,
            }}
            aria-label="Fechar"
          >
            ✕
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
      </div>
    </div>
  )
}
