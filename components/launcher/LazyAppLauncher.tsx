'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { AppLauncherProps } from './index'

const AppLauncher = dynamic(() => import('./index').then(mod => mod.AppLauncher), {
  ssr: false,
  loading: () => <AppLauncherSkeleton />,
})

export function LazyAppLauncher(props: AppLauncherProps) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isReady || typeof window === 'undefined') return

    const activate = () => setIsReady(true)

    if (pathname !== '/') {
      const timeoutId = window.setTimeout(activate, 400)
      return () => window.clearTimeout(timeoutId)
    }

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointermove',
      'keydown',
      'scroll',
      'touchstart',
    ]

    const handleFirstInteraction = () => {
      activate()
      interactionEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleFirstInteraction)
      })
    }

    interactionEvents.forEach(eventName => {
      window.addEventListener(eventName, handleFirstInteraction, { passive: true, once: true })
    })

    return () => {
      interactionEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleFirstInteraction)
      })
    }
  }, [isReady, pathname])

  if (!isReady) {
    return <AppLauncherSkeleton />
  }

  return <AppLauncher {...props} />
}

function AppLauncherSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-between gap-2">
      <div className="bg-muted h-8 w-24 animate-pulse rounded-md" />
      <div className="flex items-center gap-2">
        <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
      </div>
    </div>
  )
}
