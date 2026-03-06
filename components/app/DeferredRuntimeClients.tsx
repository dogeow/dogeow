'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => mod.Toaster), {
  ssr: false,
})
const PWAInstallPrompt = dynamic(
  () => import('@/components/app/PWAInstallPrompt').then(mod => mod.PWAInstallPrompt),
  { ssr: false }
)
const PWARegister = dynamic(
  () => import('@/components/app/PWARegister').then(mod => mod.PWARegister),
  {
    ssr: false,
  }
)
const PushSubscriptionRegister = dynamic(
  () =>
    import('@/components/app/PushSubscriptionRegister').then(mod => mod.PushSubscriptionRegister),
  {
    ssr: false,
  }
)
const UnreadNotificationFetcher = dynamic(
  () =>
    import('@/components/app/UnreadNotificationFetcher').then(mod => mod.UnreadNotificationFetcher),
  {
    ssr: false,
  }
)
const NotificationRealtimeSubscriber = dynamic(
  () =>
    import('@/components/app/NotificationRealtimeSubscriber').then(
      mod => mod.NotificationRealtimeSubscriber
    ),
  {
    ssr: false,
  }
)

const IDLE_TIMEOUT_MS = 1500
const FALLBACK_DELAY_MS = 400

type IdleCallbackWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }

function scheduleRuntimeBootstrap(callback: () => void): () => void {
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

/**
 * Defer non-critical global runtime helpers to idle time to reduce first-load main-thread work.
 */
export function DeferredRuntimeClients() {
  const [isBootstrapped, setIsBootstrapped] = useState(false)

  useEffect(() => {
    const cancel = scheduleRuntimeBootstrap(() => setIsBootstrapped(true))
    return cancel
  }, [])

  if (!isBootstrapped) {
    return null
  }

  return (
    <>
      <Toaster />
      <PWAInstallPrompt />
      <PWARegister />
      <PushSubscriptionRegister />
      <UnreadNotificationFetcher />
      <NotificationRealtimeSubscriber />
    </>
  )
}
