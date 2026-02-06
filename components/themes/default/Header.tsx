'use client'

import { AppLauncher } from '@/components/launcher'

/**
 * 默认主题的 Header 组件
 * 保持原有设计
 */
export default function DefaultHeader() {
  return (
    <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
      <AppLauncher />
    </div>
  )
}
