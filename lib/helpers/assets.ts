const REMOTE_PROTOCOL_RE = /^(?:https?:)?\/\//

function normalizeBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? '').trim().replace(/\/+$/, '')
}

export function asset(path: string): string {
  if (
    !path ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    REMOTE_PROTOCOL_RE.test(path)
  ) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_ASSET_BASE_URL)

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}

export function imageAsset(path: string): string {
  return asset(path.startsWith('/images/') ? path : `/images/${path.replace(/^\/+/, '')}`)
}

export function gameAsset(path: string): string {
  return asset(path.startsWith('/game/') ? path : `/game/${path.replace(/^\/+/, '')}`)
}
