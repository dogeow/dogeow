'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AppLauncher } from '@/components/launcher'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

const VisionAiDialog = dynamic(
  () => import('@/components/app/VisionAiDialog').then(m => ({ default: m.VisionAiDialog })),
  { ssr: false }
)

/**
 * 默认主题的 Header 组件
 * 星星按钮 → 通用 AI，图片按钮 → 视觉 AI
 */
export default function DefaultHeader() {
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isVisionAiOpen, setIsVisionAiOpen] = useState(false)

  return (
    <>
      <AiDialog open={isAiOpen} onOpenChange={setIsAiOpen} />
      <VisionAiDialog open={isVisionAiOpen} onOpenChange={setIsVisionAiOpen} />
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
        <AppLauncher
          onOpenAi={() => setIsAiOpen(true)}
          onOpenVisionAi={() => setIsVisionAiOpen(true)}
        />
      </div>
    </>
  )
}
