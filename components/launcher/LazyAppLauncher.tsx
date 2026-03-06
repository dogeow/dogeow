'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { AppLauncherProps } from './index'

const AppLauncher = dynamic(() => import('./index').then(mod => mod.AppLauncher), {
  ssr: false,
  loading: () => <AppLauncherSkeleton />,
})

const IDLE_TIMEOUT_MS = 1500
const FALLBACK_DELAY_MS = 400

type IdleCallbackWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }

function scheduleLauncherBootstrap(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const runtimeWindow = window as IdleCallbackWindow

  if (
    typeof runtimeWindow.requestIdleCallback === 'function' &&
    typeof runtimeWindow.cancelIdleCallback === 'function'
  ) {
    const idleId = runtimeWindow.requestIdleCallback(() => callback(), { timeout: IDLE_TIMEOUT_MS })
    return () => runtimeWindow.cancelIdleCallback?.(idleId)
  }

  const timeoutId = setTimeout(callback, FALLBACK_DELAY_MS)
  return () => clearTimeout(timeoutId)
}

export function LazyAppLauncher(props: AppLauncherProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const cancel = scheduleLauncherBootstrap(() => setIsReady(true))
    return cancel
  }, [])

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
