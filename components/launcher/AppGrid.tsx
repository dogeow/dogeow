"use client"

import React, { useState, useEffect } from 'react'
import { Settings, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/helpers'

type DisplayMode = 'music' | 'apps' | 'settings';

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
}

export function AppGrid({ toggleDisplayMode }: AppGridProps) {
  const { theme, setTheme } = useTheme()
  const { setFollowSystem } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  // 等待组件挂载后再处理主题，避免水合不匹配错误
  useEffect(() => {
    setMounted(true)
  }, [])

  // 自定义按钮样式，确保在任何背景下都有足够的对比度
  const buttonStyle = "h-9 w-9 bg-background/60 backdrop-blur-sm"
  
  // 定义按钮配置
  const buttons = [
    {
      icon: <Music className="h-5 w-5" />,
      label: "打开音乐",
      onClick: () => toggleDisplayMode('music')
    },
    {
      icon: (
        <div className="relative">
          {mounted ? (
            theme === 'dark' ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
        </div>
      ),
      label: "切换主题",
      onClick: () => {
        if (!mounted) return;
        setFollowSystem(false)
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme)
      }
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "打开设置",
      onClick: () => toggleDisplayMode('settings')
    }
  ]
  
  return (
    <div className="flex items-center space-x-4">
      {buttons.map((button, index) => (
        <motion.div 
          key={index}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(buttonStyle, "hover:bg-background/80")}
            onClick={button.onClick}
          >
            {button.icon}
            <span className="sr-only">{button.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  )
}