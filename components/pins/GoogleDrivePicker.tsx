'use client'

import { useEffect, useRef } from 'react'
import type { AccountLabel } from '@/lib/googlePhotos'

// ── Minimal Google Picker types ───────────────────────────────────────────
interface GPickerDoc {
  id: string
  name: string
  mimeType: string
  url: string
}
interface GPickerResponse {
  action: string
  docs?: GPickerDoc[]
}
interface GDocsView {
  setMimeTypes: (t: string) => GDocsView
}
interface GPickerInstance {
  setVisible: (v: boolean) => void
}
interface GPickerBuilder {
  setOAuthToken: (t: string) => GPickerBuilder
  setDeveloperKey: (k: string) => GPickerBuilder
  setCallback: (cb: (r: GPickerResponse) => void) => GPickerBuilder
  addView: (v: unknown) => GPickerBuilder
  enableFeature: (f: string) => GPickerBuilder
  setTitle: (t: string) => GPickerBuilder
  build: () => GPickerInstance
}

declare global {
  interface Window {
    gapi: { load: (api: string, cb: () => void) => void }
    google: {
      picker: {
        PickerBuilder: new () => GPickerBuilder
        DocsView: new () => GDocsView
        ViewId: Record<string, string>
        Feature: Record<string, string>
      }
    }
  }
}

// ── Props ─────────────────────────────────────────────────────────────────
export interface DriveFile {
  url:      string   // https://drive.google.com/file/d/{id}/view
  name:     string
  mimeType: string
}

interface Props {
  label:    AccountLabel
  filter:   'image' | 'video' | 'all'
  onPick:   (files: DriveFile[]) => void
  onCancel: () => void
  onError?: (msg: string) => void
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY!

// ── Component ─────────────────────────────────────────────────────────────
export default function GoogleDrivePicker({ label, filter, onPick, onCancel, onError }: Props) {
  const pickerRef = useRef<GPickerInstance | null>(null)

  useEffect(() => {
    let cancelled = false

    async function open() {
      // 1. Fetch fresh access token from our API
      const res = await fetch(`/api/photos/token?label=${encodeURIComponent(label)}`)
      if (!res.ok) {
        onError?.('Conta não conectada. Vincule sua conta Google na barra lateral.')
        onCancel()
        return
      }
      const { token } = await res.json() as { token: string }
      if (cancelled) return

      // 2. Load gapi + picker module
      await loadGapiPicker()
      if (cancelled) return

      // 3. Build and show
      const P = window.google.picker

      const IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif'
      const VIDEOS = 'video/mp4,video/quicktime,video/x-msvideo,video/mpeg,video/webm'

      const builder = new P.PickerBuilder()
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setTitle('Selecionar do Google Drive')
        .enableFeature(P.Feature.MULTISELECT_ENABLED)
        .setCallback((data) => {
          if (data.action === 'picked' && data.docs?.length) {
            onPick(data.docs.map(d => ({ url: d.url, name: d.name, mimeType: d.mimeType })))
          } else if (data.action === 'cancel') {
            onCancel()
          }
        })

      if (filter !== 'video') {
        builder.addView(new P.DocsView().setMimeTypes(IMAGES))
      }
      if (filter !== 'image') {
        builder.addView(new P.DocsView().setMimeTypes(VIDEOS))
      }

      pickerRef.current = builder.build()
      pickerRef.current.setVisible(true)
    }

    open().catch(e => { onError?.(String(e)); onCancel() })

    return () => {
      cancelled = true
      pickerRef.current?.setVisible(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null // Picker renders its own UI
}

// ── Load gapi + picker module once ───────────────────────────────────────
function loadGapiPicker(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) { resolve(); return }

    const doLoad = () => window.gapi.load('picker', resolve)

    if (window.gapi) { doLoad(); return }

    const existing = document.getElementById('gapi-picker-script')
    if (existing) {
      existing.addEventListener('load', doLoad)
      return
    }

    const script = document.createElement('script')
    script.id   = 'gapi-picker-script'
    script.src  = 'https://apis.google.com/js/api.js'
    script.onload  = doLoad
    script.onerror = () => reject(new Error('Falha ao carregar Google API'))
    document.head.appendChild(script)
  })
}
