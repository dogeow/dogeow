"use client"

import React from 'react'
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
  
  // 自定义按钮样式，确保在任何背景下都有足够的对比度
  const buttonStyle = "h-9 w-9 bg-background/60 backdrop-blur-sm"
  
  return (
    <div className="flex items-center space-x-4">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            buttonStyle, 
            "hover:bg-background/80"
          )}
          onClick={() => toggleDisplayMode('music')}
        >
          <Music className="h-5 w-5" />
          <span className="sr-only">打开音乐</span>
        </Button>
      </motion.div>
      
      {/* 主题切换按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            buttonStyle,
            "hover:bg-background/80"
          )}
          onClick={() => {
            setFollowSystem(false)
            setTheme(theme === 'dark' ? 'light' : 'dark')
          }}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </motion.div>
      
      {/* 设置按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            buttonStyle,
            "hover:bg-background/80"
          )}
          onClick={() => toggleDisplayMode('settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">打开设置</span>
        </Button>
      </motion.div>
    </div>
  )
} 