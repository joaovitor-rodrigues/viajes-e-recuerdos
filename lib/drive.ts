const DRIVE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /docs\.google\.com\/\w+\/d\/([a-zA-Z0-9_-]+)/,
]

export function parseGoogleDriveUrl(url: string): { fileId: string } | null {
  for (const pattern of DRIVE_PATTERNS) {
    const match = url.match(pattern)
    if (match) return { fileId: match[1] }
  }
  return null
}

export function getEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function getDirectImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`
}

export function validateAndParseMediaUrl(
  url: string
): { fileId: string; embedUrl: string; directUrl: string } | null {
  const parsed = parseGoogleDriveUrl(url)
  if (!parsed) return null

  return {
    fileId: parsed.fileId,
    embedUrl: getEmbedUrl(parsed.fileId),
    directUrl: getDirectImageUrl(parsed.fileId),
  }
}
