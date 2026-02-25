'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AppLauncher } from '@/components/launcher'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

/**
 * 极简主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function MinimalHeader() {
  const [isAiOpen, setIsAiOpen] = useState(false)

  return (
    <>
      <AiDialog variant="panel" open={isAiOpen} onOpenChange={setIsAiOpen} />
      <div className="flex h-full w-full items-center justify-between bg-transparent px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light">DogeOW</span>
        </div>

        <div className="flex items-center gap-2">
          <AppLauncher
            onOpenAi={() => setIsAiOpen(prev => !prev)}
            isAiOpen={isAiOpen}
            onCloseAi={() => setIsAiOpen(false)}
          />
        </div>
      </div>
    </>
  )
}
