'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AppLauncher } from '@/components/launcher'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

/**
 * 默认主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function DefaultHeader() {
  const [isAiOpen, setIsAiOpen] = useState(false)

  return (
    <>
      <AiDialog variant="panel" open={isAiOpen} onOpenChange={setIsAiOpen} />
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
        <AppLauncher onOpenAi={() => setIsAiOpen(true)} />
      </div>
    </>
  )
}
