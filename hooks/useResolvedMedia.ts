'use client'

import { useMemo } from 'react'
import { isGPhotosUrl } from '@/lib/googlePhotos'

export interface ResolvedMedia {
  displayUrl: string
  embedUrl:   string
  mimeType:   string
}

export function useResolvedMedia(url: string): { resolved: ResolvedMedia | null; loading: boolean } {
  const resolved = useMemo<ResolvedMedia | null>(() => {
    if (!isGPhotosUrl(url)) return null
    const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(url)}`
    return { displayUrl: proxyUrl, embedUrl: proxyUrl, mimeType: 'image/jpeg' }
  }, [url])

  return { resolved, loading: false }
}
