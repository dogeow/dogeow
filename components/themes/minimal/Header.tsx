'use client'

import { AppLauncher } from '@/components/launcher'

/**
 * 极简主题的 Header 组件
 * 完全不同的设计：极简、无边框、小高度
 */
export default function MinimalHeader() {
  return (
    <div className="flex h-full w-full items-center justify-between bg-transparent px-6">
      {/* 左侧：Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-light">DogeOW</span>
      </div>

      {/* 右侧：用户菜单 */}
      <div className="flex items-center">
        <AppLauncher />
      </div>
    </div>
  )
}
