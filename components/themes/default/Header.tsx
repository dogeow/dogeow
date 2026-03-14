'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { LazyAppLauncher } from '@/components/launcher/LazyAppLauncher'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

function RouteAwareAiLauncher() {
  const [isAiOpen, setIsAiOpen] = useState(false)

  return (
    <>
      <AiDialog open={isAiOpen} onOpenChange={setIsAiOpen} />
      <LazyAppLauncher
        onOpenAi={() => setIsAiOpen(prev => !prev)}
        isAiOpen={isAiOpen}
        onCloseAi={() => setIsAiOpen(false)}
      />
    </>
  )
}

/**
 * 默认主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function DefaultHeader() {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
      <RouteAwareAiLauncher key={pathname} />
    </div>
  )
}
