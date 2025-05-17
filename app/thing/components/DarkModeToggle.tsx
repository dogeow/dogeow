"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 等待组件挂载后再处理主题，避免水合不匹配错误
  useEffect(() => {
    setMounted(true)
    
    // 调试暗色模式状态
    console.log("DarkModeToggle mounted:", {
      theme,
      htmlHasDarkClass: typeof document !== 'undefined' ? 
        document.documentElement.classList.contains('dark') : 'unknown',
      bodyHasDarkClass: typeof document !== 'undefined' ? 
        document.body.classList.contains('dark') : 'unknown'
    })
    
    // 确保深色模式类被正确应用
    if (theme === 'dark' && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
    }
  }, [theme])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-card border rounded-md">
      <span className="text-sm font-medium mr-2">主题:</span>
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
      <div className="ml-auto text-xs text-muted-foreground">
        当前模式: {theme === 'dark' ? '深色' : '浅色'}
      </div>
    </div>
  )
} 