'use client'

import React from 'react'
import { Settings, Music, Sparkles, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMusicStore } from '@/stores/musicStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'
import '@/components/launcher/music/music-visualizer.css'

type DisplayMode = 'music' | 'apps' | 'settings'

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
  onOpenVisionAi?: () => void
}

export function AppGrid({ toggleDisplayMode, onOpenAi, onOpenVisionAi }: AppGridProps) {
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
      icon: <Image className="h-5 w-5 text-blue-500" />,
      label: 'AI 视觉',
      onClick: () => onOpenVisionAi?.(),
    },
    {
      icon: (
        <div
          className={cn(
            'transition-transform duration-300',
            isPlaying && 'animate-pulse',
            isPlaying && 'music-rainbow-pulse',
            isPlaying && 'music-rainbow-wrapper'
          )}
        >
          <Music
            className={cn('h-5 w-5 transition-colors', isPlaying && 'opacity-0')}
            style={
              isPlaying
                ? undefined
                : {
                    color: 'currentColor',
                  }
            }
          />
        </div>
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

  return (
    <div className="flex items-center space-x-4">
      {buttons.map((button, index) => (
        <div key={index} className="transition-transform hover:scale-105 active:scale-95">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-transparent hover:opacity-80"
            onClick={button.onClick}
          >
            {button.icon}
            <span className="sr-only">{button.label}</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
