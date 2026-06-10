import { createServiceClient } from './supabase/service'

export type AccountLabel = 'joão' | 'jéssica'

// ── URL helpers ───────────────────────────────────────────────────────────

/** gphotos://label/sessionId/itemId */
export function encodeGPhotosUrl(label: AccountLabel, sessionId: string, itemId: string): string {
  return `gphotos://${encodeURIComponent(label)}/${encodeURIComponent(sessionId)}/${encodeURIComponent(itemId)}`
}

export function isGPhotosUrl(url: string): boolean {
  return url.startsWith('gphotos://')
}

export function parseGPhotosUrl(url: string): { label: AccountLabel; sessionId: string; itemId: string } | null {
  // gphotos://label/sessionId/itemId — all segments are percent-encoded
  const without = url.slice('gphotos://'.length)
  const slashIdx = without.indexOf('/')
  if (slashIdx === -1) return null
  const label = decodeURIComponent(without.slice(0, slashIdx)) as AccountLabel

  const rest = without.slice(slashIdx + 1)
  const slash2 = rest.indexOf('/')
  if (slash2 === -1) return null
  const sessionId = decodeURIComponent(rest.slice(0, slash2))
  const itemId    = decodeURIComponent(rest.slice(slash2 + 1))
  if (!sessionId || !itemId) return null

  return { label, sessionId, itemId }
}

// ── Token management ──────────────────────────────────────────────────────

interface StoredToken {
  label:         AccountLabel
  email:         string | null
  access_token:  string | null
  refresh_token: string
  expires_at:    string | null
}

async function refreshAccessToken(token: StoredToken): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: token.refresh_token,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)

  const data = await res.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  const db = createServiceClient()
  await db.from('google_tokens').update({
    access_token: data.access_token,
    expires_at:   expiresAt,
  }).eq('label', token.label)

  return data.access_token as string
}

export async function getValidAccessToken(label: AccountLabel): Promise<string | null> {
  const db = createServiceClient()
  const { data } = await db.from('google_tokens').select('*').eq('label', label).single()
  if (!data) return null

  const token = data as StoredToken
  const expired = !token.expires_at || new Date(token.expires_at) <= new Date(Date.now() + 60_000)

  if (expired) return refreshAccessToken(token)
  return token.access_token
}

// ── Google Photos Picker API ──────────────────────────────────────────────

const PICKER_BASE = 'https://photospicker.googleapis.com/v1'

export interface PickerSession {
  id:            string
  pickerUri:     string
  mediaItemsSet: boolean
  pollingConfig?: {
    pollInterval: string  // e.g. "5s"
    timeoutIn:    string  // e.g. "300s"
  }
}

export interface PickerMediaItem {
  id:        string
  type:      'PHOTO' | 'VIDEO'
  mediaFile: {
    baseUrl:  string
    mimeType: string
    filename: string
  }
}

export async function createPickerSession(label: AccountLabel): Promise<PickerSession> {
  const token = await getValidAccessToken(label)
  if (!token) throw new Error('Conta não conectada')

  const res = await fetch(`${PICKER_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Picker session creation failed: ${res.status}`)
  return res.json() as Promise<PickerSession>
}

export async function getPickerSession(label: AccountLabel, sessionId: string): Promise<PickerSession> {
  const token = await getValidAccessToken(label)
  if (!token) throw new Error('Conta não conectada')

  const res = await fetch(`${PICKER_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Picker session fetch failed: ${res.status}`)
  return res.json() as Promise<PickerSession>
}

export async function listPickerSessionItems(
  label:     AccountLabel,
  sessionId: string,
): Promise<PickerMediaItem[]> {
  const token = await getValidAccessToken(label)
  if (!token) throw new Error('Conta não conectada')

  const items: PickerMediaItem[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({ sessionId, pageSize: '100' })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${PICKER_BASE}/mediaItems?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Picker media items failed: ${res.status}`)

    const data = await res.json()
    if (data.mediaItems) items.push(...(data.mediaItems as PickerMediaItem[]))
    pageToken = data.nextPageToken
  } while (pageToken)

  return items
}

// ── Resolve gphotos:// URL to temporary display URL ───────────────────────

export interface ResolvedGPhotosMedia {
  displayUrl: string
  embedUrl:   string
  mimeType:   string
}

// Cache resolved URLs for 45 min — Picker baseUrls are valid ~1 h
const _resolveCache = new Map<string, { result: ResolvedGPhotosMedia; expiresAt: number }>()

export async function resolveGPhotosUrl(url: string): Promise<ResolvedGPhotosMedia | null> {
  const parsed = parseGPhotosUrl(url)
  if (!parsed) return null

  const cached = _resolveCache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.result

  try {
    const items = await listPickerSessionItems(parsed.label, parsed.sessionId)
    const item  = items.find(i => i.id === parsed.itemId)
    if (!item) return null

    const base    = item.mediaFile.baseUrl
    const isVideo = item.mediaFile.mimeType.startsWith('video/')

    const result: ResolvedGPhotosMedia = {
      displayUrl: isVideo ? `${base}=dv` : `${base}=w1600`,
      embedUrl:   isVideo ? `${base}=dv` : `${base}=w1600`,
      mimeType:   item.mediaFile.mimeType,
    }

    _resolveCache.set(url, { result, expiresAt: Date.now() + 45 * 60 * 1000 })
    return result
  } catch {
    return null
  }
}
