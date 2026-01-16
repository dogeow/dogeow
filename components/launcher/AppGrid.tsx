'use client'

import React from 'react'
import { Settings, Music, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useMusicStore } from '@/stores/musicStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'

type DisplayMode = 'music' | 'apps' | 'settings'

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
}

export function AppGrid({ toggleDisplayMode, onOpenAi }: AppGridProps) {
  const { t } = useTranslation()
  const { isPlaying } = useMusicStore()

  // 定义按钮配置
  const buttons = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: 'AI 助理',
      onClick: () => onOpenAi?.(),
    },
    {
      icon: (
        <motion.div
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isPlaying
              ? {
                  duration: 10,
                  repeat: Infinity,
                  ease: 'linear',
                }
              : {
                  duration: 10,
                }
          }
        >
          <Music className="h-5 w-5" />
        </motion.div>
      ),
      label: t('appgrid.music'),
      onClick: () => toggleDisplayMode('music'),
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: t('appgrid.settings'),
      onClick: () => toggleDisplayMode('settings'),
    },
  ]

  // 自定义按钮样式，确保在任何背景下都有足够的对比度
  const buttonStyle = 'h-9 w-9 bg-background/60 backdrop-blur-sm'

  return (
    <div className="flex items-center space-x-4">
      {buttons.map((button, index) => (
        <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(buttonStyle, 'hover:bg-background/80')}
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
