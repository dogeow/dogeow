"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export default function TestDarkMode() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 在组件挂载后再访问theme，防止水合错误
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>加载中...</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold">深色模式测试页面</h1>
      
      <div className="p-6 bg-card text-card-foreground border rounded-lg shadow-sm">
        <h2 className="text-xl mb-4">当前主题状态</h2>
        <p className="mb-2">当前主题: <span className="font-bold">{theme}</span></p>
        <div className="my-4 flex gap-4">
          <Button onClick={() => setTheme('light')}>设置为浅色</Button>
          <Button onClick={() => setTheme('dark')}>设置为深色</Button>
          <Button onClick={() => setTheme('system')}>跟随系统</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-md border">
          蓝色卡片 (bg-blue-50 dark:bg-blue-950/50)
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-md border">
          绿色卡片 (bg-green-50 dark:bg-green-950/50)
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-950/50 rounded-md border">
          紫色卡片 (bg-purple-50 dark:bg-purple-950/50)
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-950/50 rounded-md border">
          红色卡片 (bg-red-50 dark:bg-red-950/50)
        </div>
      </div>

      <div className="mt-8 text-muted-foreground text-sm">
        <p>深色模式类似于这样工作：在HTML元素上添加.dark类，然后通过dark:前缀的CSS类控制样式</p>
        <p className="mt-2">如果你看到上面的卡片在切换深色模式时会改变颜色，说明深色模式正常工作</p>
        <p className="mt-2">如果卡片不改变颜色，则说明深色模式未正确激活或者CSS有问题</p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-background"></div>
          <span>bg-background</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-foreground"></div>
          <span>bg-foreground</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-card"></div>
          <span>bg-card</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted"></div>
          <span>bg-muted</span>
        </div>
      </div>
    </div>
  )
} 