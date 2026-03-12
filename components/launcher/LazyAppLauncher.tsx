'use client'

import dynamic from 'next/dynamic'
import type { AppLauncherProps } from './index'

const AppLauncher = dynamic(() => import('./index').then(mod => mod.AppLauncher), {
  ssr: false,
  loading: () => <AppLauncherSkeleton />,
})

export function LazyAppLauncher(props: AppLauncherProps) {
  return <AppLauncher {...props} />
}

function AppLauncherSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-between">
      <div className="mr-3 flex shrink-0 items-center">
        <div className="bg-muted size-10 animate-pulse rounded-md" />
      </div>

      <div className="flex flex-1 items-center justify-start">
        <div className="flex items-center gap-3">
          <div className="bg-muted size-10 animate-pulse rounded-xl" />
          <div className="bg-muted size-10 animate-pulse rounded-xl" />
          <div className="bg-muted size-10 animate-pulse rounded-xl" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="bg-muted size-10 animate-pulse rounded-xl" />
        <div className="bg-muted size-10 animate-pulse rounded-xl" />
        <div className="bg-muted size-10 animate-pulse rounded-xl" />
      </div>
    </div>
  )
}
