import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveSiteVariant } from '@/lib/siteVariant'

const RPG_INTERNAL_PATH = '/rpg-host'

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const host = requestHeaders.get('host')
  const siteVariant = resolveSiteVariant(host)
  const isRpgRequest =
    siteVariant === 'rpg' || request.nextUrl.pathname.startsWith(RPG_INTERNAL_PATH)

  if (isRpgRequest) {
    requestHeaders.set('x-site-variant', 'rpg')
  }

  if (siteVariant !== 'rpg') {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const url = request.nextUrl.clone()

  if (url.pathname === '/' || url.pathname === '/game/rpg') {
    url.pathname = RPG_INTERNAL_PATH
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)'],
}
