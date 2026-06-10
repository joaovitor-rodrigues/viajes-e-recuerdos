import { NextRequest, NextResponse } from 'next/server'
import { resolveGPhotosUrl, isGPhotosUrl, getValidAccessToken, parseGPhotosUrl } from '@/lib/googlePhotos'

// GET /api/photos/proxy?url=gphotos://label/sessionId/itemId
// Resolves the gphotos:// URL and streams the image from Google through the server.
// Required because Google Photos Picker baseUrls may need the access token to load.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url || !isGPhotosUrl(url)) {
    return new NextResponse('Missing or invalid url', { status: 400 })
  }

  try {
    const resolved = await resolveGPhotosUrl(url)
    if (!resolved) return new NextResponse('Not found', { status: 404 })

    const parsed = parseGPhotosUrl(url)
    const token  = parsed ? await getValidAccessToken(parsed.label) : null

    const upstreamHeaders: Record<string, string> = {}
    if (token) upstreamHeaders['Authorization'] = `Bearer ${token}`

    // Forward Range header so video seeking works (206 Partial Content)
    const range = request.headers.get('range')
    if (range) upstreamHeaders['Range'] = range

    const mediaRes = await fetch(resolved.displayUrl, { headers: upstreamHeaders })
    if (!mediaRes.ok && mediaRes.status !== 206) {
      return new NextResponse('Failed to fetch media', { status: 502 })
    }

    const contentType = mediaRes.headers.get('content-type') ?? resolved.mimeType
    const body = mediaRes.body
    if (!body) return new NextResponse('Empty body', { status: 502 })

    const responseHeaders: Record<string, string> = {
      'Content-Type':   contentType,
      'Cache-Control':  'private, max-age=3000',
      'Accept-Ranges':  'bytes',
    }
    const contentRange  = mediaRes.headers.get('content-range')
    const contentLength = mediaRes.headers.get('content-length')
    if (contentRange)  responseHeaders['Content-Range']  = contentRange
    if (contentLength) responseHeaders['Content-Length'] = contentLength

    return new NextResponse(body, {
      status:  mediaRes.status,
      headers: responseHeaders,
    })
  } catch (e) {
    return new NextResponse(String(e), { status: 500 })
  }
}
