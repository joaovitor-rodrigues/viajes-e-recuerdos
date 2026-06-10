export interface ParsedMedia {
  displayUrl: string  // src for <img> or direct display
  embedUrl:   string  // src for <iframe>
  fileId?:    string  // only for Google Drive files
}

// ── Google Drive patterns ──────────────────────────────────────────────────
const DRIVE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /docs\.google\.com\/\w+\/d\/([a-zA-Z0-9_-]+)/,
]

function parseDriveUrl(url: string): string | null {
  for (const p of DRIVE_PATTERNS) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ── Public API ─────────────────────────────────────────────────────────────
export function validateAndParseMediaUrl(url: string): ParsedMedia | null {
  if (!url) return null

  // Google Drive — extract fileId for reliable embed/thumbnail
  const fileId = parseDriveUrl(url)
  if (fileId) {
    return {
      fileId,
      displayUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      embedUrl:   `https://drive.google.com/file/d/${fileId}/preview`,
    }
  }

  // Accept any well-formed https:// URL as-is (Dropbox, direct links, etc.)
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { displayUrl: url, embedUrl: url }
    }
  } catch { /* not a valid URL */ }

  return null
}

// Kept for backwards-compat with any existing call sites
export function getDirectImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`
}

export function getEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function parseGoogleDriveUrl(url: string): { fileId: string } | null {
  const id = parseDriveUrl(url)
  return id ? { fileId: id } : null
}
