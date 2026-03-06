type RouteAccessRule = {
  href: string
  needLogin: boolean
}

// Keep this list lightweight so route-guard checks do not pull UI-heavy tile configs into the root bundle.
const TILE_ROUTE_ACCESS_RULES: ReadonlyArray<RouteAccessRule> = [
  { href: '/thing', needLogin: true },
  { href: '/lab', needLogin: true },
  { href: '/file', needLogin: true },
  { href: '/tool', needLogin: true },
  { href: '/nav', needLogin: true },
  { href: '/note', needLogin: true },
  { href: '/game', needLogin: true },
  { href: '/chat', needLogin: true },
  { href: '/word', needLogin: true },
]

const EXTRA_PROTECTED_PATHS: ReadonlyArray<string> = ['/dashboard']

const isPathMatch = (pathname: string, targetPath: string) => {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

export function isProtectedPath(pathname: string): boolean {
  const matchedTileRule = TILE_ROUTE_ACCESS_RULES.find(rule => isPathMatch(pathname, rule.href))

  if (matchedTileRule) {
    return matchedTileRule.needLogin
  }

  return EXTRA_PROTECTED_PATHS.some(path => isPathMatch(pathname, path))
}
