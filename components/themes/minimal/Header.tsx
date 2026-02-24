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
 * 极简主题的 Header 组件
 * 星星按钮 → 通用 AI，图片按钮 → 视觉 AI
 */
export default function MinimalHeader() {
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isVisionAiOpen, setIsVisionAiOpen] = useState(false)

  return (
    <>
      <AiDialog open={isAiOpen} onOpenChange={setIsAiOpen} />
      <VisionAiDialog open={isVisionAiOpen} onOpenChange={setIsVisionAiOpen} />
      <div className="flex h-full w-full items-center justify-between bg-transparent px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light">DogeOW</span>
        </div>

        <div className="flex items-center gap-2">
          <AppLauncher
            onOpenAi={() => setIsAiOpen(true)}
            onOpenVisionAi={() => setIsVisionAiOpen(true)}
          />
        </div>
      </div>
    </>
  )
}
