'use client'

import React from 'react'
import { Search, Music, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMusicStore } from '@/stores/musicStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'
import '@/components/launcher/music/music-visualizer.css'

type DisplayMode = 'music' | 'apps' | 'settings'

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
  onToggleSearch?: () => void
}

export function AppGrid({ toggleDisplayMode, onOpenAi, onToggleSearch }: AppGridProps) {
  const { t } = useTranslation()
  const { isPlaying } = useMusicStore()

  // 定义按钮配置
  const buttons = [
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
            className={cn('h-6 w-6 transition-colors', isPlaying && 'opacity-0')}
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
      buttonClassName: 'size-11',
    },
    {
      icon: <Bot className="h-5 w-5" />,
      label: 'AI 助理',
      onClick: () => onOpenAi?.(),
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: '搜索',
      onClick: () => onToggleSearch?.(),
    },
  ]

  return (
    <div className="flex items-center gap-3">
      {buttons.map(button => (
        <div key={button.label} className="transition-transform hover:scale-105 active:scale-95">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-10 rounded-xl hover:bg-transparent hover:opacity-80',
              button.buttonClassName
            )}
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
