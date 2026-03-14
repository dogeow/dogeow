'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, Music, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMusicStore } from '@/stores/musicStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'
import '@/components/launcher/music/music-visualizer.css'

type DisplayMode = 'music' | 'apps' | 'settings'

interface AppGridButtonConfig {
  icon: React.ReactNode
  label: string
  onClick: () => void
  buttonClassName?: string
}

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
  onToggleSearch?: () => void
  analyserNode?: AnalyserNode | null
}

function MusicEqualizerIcon({
  analyserNode,
  isPlaying,
}: {
  analyserNode?: AnalyserNode | null
  isPlaying: boolean
}) {
  const [levels, setLevels] = useState([0.42, 0.7, 0.55, 0.82])
  const frameRef = useRef<number | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const idleLevels = [0.42, 0.7, 0.55, 0.82]

  useEffect(() => {
    if (!analyserNode || !isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    dataRef.current = new Uint8Array(analyserNode.frequencyBinCount)

    const render = () => {
      const data = dataRef.current
      if (!data) return

      analyserNode.getByteFrequencyData(data as Uint8Array<ArrayBuffer>)

      const segmentSize = Math.max(1, Math.floor(data.length / 4))
      const nextLevels = Array.from({ length: 4 }, (_, index) => {
        const start = index * segmentSize
        const end = index === 3 ? data.length : Math.min(data.length, start + segmentSize)
        let total = 0

        for (let cursor = start; cursor < end; cursor += 1) {
          total += data[cursor]
        }

        const average = total / Math.max(1, end - start)
        return Math.max(0.22, Math.min(1, average / 140))
      })

      setLevels(prev => prev.map((level, index) => level * 0.42 + nextLevels[index] * 0.58))
      frameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [analyserNode, isPlaying])

  const renderedLevels = isPlaying && analyserNode ? levels : idleLevels

  return (
    <div className="music-equalizer-icon" aria-hidden="true">
      {renderedLevels.map((level, index) => (
        <span
          key={index}
          className="music-equalizer-bar"
          style={{ transform: `scaleY(${level.toFixed(3)})` }}
        />
      ))}
    </div>
  )
}

export function AppGrid({
  toggleDisplayMode,
  onOpenAi,
  onToggleSearch,
  analyserNode,
}: AppGridProps) {
  const { t } = useTranslation()
  const { isPlaying } = useMusicStore()

  const musicIcon = isPlaying ? (
    <MusicEqualizerIcon analyserNode={analyserNode} isPlaying={isPlaying} />
  ) : (
    <Music className="h-6 w-6 transition-colors" />
  )

  // 定义按钮配置
  const buttons: AppGridButtonConfig[] = [
    {
      icon: (
        <div className={cn('transition-transform duration-300', isPlaying && 'scale-105')}>
          {musicIcon}
        </div>
      ),
      label: t('appgrid.music'),
      onClick: () => toggleDisplayMode('music'),
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
