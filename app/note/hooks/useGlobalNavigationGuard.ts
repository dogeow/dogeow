import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEditorStore } from "../store/editorStore"

export function useGlobalNavigationGuard(showDialog: () => Promise<boolean>) {
  const router = useRouter()
  const pathname = usePathname()
  const { isDirty } = useEditorStore()
  const allowNext = useRef(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && (pathname.startsWith('/note/new') || pathname.startsWith('/note/edit'))) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, pathname])

  useEffect(() => {
    const handleRouteChange = async (url: string) => {
      if (
        !allowNext.current &&
        isDirty &&
        (pathname.startsWith('/note/new') || pathname.startsWith('/note/edit'))
      ) {
        const ok = await showDialog()
        if (!ok) {
          throw "Navigation cancelled"
        } else {
          allowNext.current = true
          router.push(url)
        }
      }
    }

    // 兼容 next/navigation 没有 events 的情况
    const nav = router as { events?: { on: (event: string, handler: (url: string) => void) => void; off: (event: string, handler: (url: string) => void) => void } }
    if (nav.events?.on) {
      nav.events.on('routeChangeStart', handleRouteChange)
      return () => {
        nav.events?.off('routeChangeStart', handleRouteChange)
      }
    }
  }, [isDirty, pathname, router, showDialog])
} 