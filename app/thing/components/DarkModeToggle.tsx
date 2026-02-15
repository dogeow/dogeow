'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  // 使用初始化函数在客户端判断是否已挂载，避免水合不匹配
  const [mounted, setMounted] = useState(() => {
    if (typeof window !== 'undefined') {
      return true
    }
    return false
  })

  // 仅在主题变化时执行副作用，不在挂载时设置状态
  useEffect(() => {
    // 确保深色模式类被正确应用
    if (theme === 'dark' && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
    }
  }, [theme])

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-card mb-4 flex items-center gap-2 rounded-md border p-3">
      <span className="mr-2 text-sm font-medium">主题:</span>
      <Button
        variant="outline"
        size="icon"
        className={theme === 'light' ? 'bg-blue-100' : ''}
        onClick={() => setTheme('light')}
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">浅色模式</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={theme === 'dark' ? 'bg-blue-800' : ''}
        onClick={() => {
          document.documentElement.classList.add('dark')
          setTheme('dark')
        }}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">深色模式</span>
      </Button>
      <div className="text-muted-foreground ml-auto text-xs">
        当前模式: {theme === 'dark' ? '深色' : '浅色'}
      </div>
    </div>
  )
}
