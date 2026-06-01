'use client'

import { Component, type ReactNode } from 'react'
import { usePinsStore } from '@/stores/pinsStore'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; message: string }

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        height: '100vh', background: '#0f0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
      }}>
        <span style={{ fontSize: 48 }}>🗺️</span>
        <h2 style={{ margin: 0, color: '#f0ece4', fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: 22 }}>
          O mapa não pôde ser carregado
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: 13, maxWidth: 320 }}>
          Exibindo as memórias em modo offline.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            background: '#C9485B', border: 'none', color: '#fff', fontSize: 13,
          }}
        >
          Tentar novamente
        </button>
        <CachedPinCount />
      </div>
    )
  }
}

function CachedPinCount() {
  const count = usePinsStore.getState().pins.length
  if (count === 0) return null
  return (
    <p style={{ margin: 0, color: '#555', fontSize: 12 }}>
      {count} {count === 1 ? 'memória' : 'memórias'} em cache
    </p>
  )
}

export default MapErrorBoundary
