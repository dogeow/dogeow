import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Shuffle, Repeat, Repeat1 } from 'lucide-react'
import type { PlayMode } from '@/stores/musicStore'
import { cn } from '@/lib/helpers'

interface RepeatModeButtonProps {
  playMode: PlayMode
  onSetPlayMode: (mode: PlayMode) => void
  className?: string
  contentClassName?: string
  itemClassName?: string
  align?: 'start' | 'center' | 'end'
  iconOnly?: boolean
  hideChevron?: boolean
  onOpenChange?: (open: boolean) => void
}

// 播放模式选择器组件
export function RepeatModeButton(props: RepeatModeButtonProps) {
  const {
    playMode,
    onSetPlayMode,
    className,
    contentClassName: _contentClassName,
    itemClassName: _itemClassName,
    align: _align = 'start',
    iconOnly = false,
    hideChevron: _hideChevron = false,
    onOpenChange: _onOpenChange,
  } = props
  const [showTip, setShowTip] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const modes: Array<{ value: PlayMode; icon: React.ReactNode; label: string }> = [
    { value: 'all', icon: <Repeat className="h-4 w-4" />, label: '顺序循环' },
    { value: 'one', icon: <Repeat1 className="h-4 w-4" />, label: '单曲循环' },
    { value: 'shuffle', icon: <Shuffle className="h-4 w-4" />, label: '随机播放' },
  ]

  const normalizedPlayMode: Exclude<PlayMode, 'none'> = playMode === 'none' ? 'all' : playMode
  const currentMode = modes.find(m => m.value === normalizedPlayMode) || modes[0]
  const currentIndex = modes.findIndex(mode => mode.value === currentMode.value)
  const nextMode = modes[(currentIndex + 1) % modes.length] ?? modes[0]

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  const tipLabel = useMemo(() => `${currentMode.label}`, [currentMode.label])

  const handleCycleMode = () => {
    onSetPlayMode(nextMode.value)
    setShowTip(true)

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    hideTimerRef.current = setTimeout(() => {
      setShowTip(false)
    }, 1200)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCycleMode}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent',
          className
        )}
        aria-label={`切换播放模式，当前${currentMode.label}，下一个是${nextMode.label}`}
        title={`${currentMode.label}，点击切换到${nextMode.label}`}
      >
        {currentMode.icon}
        {!iconOnly && <span>{currentMode.label}</span>}
      </button>
      <div
        className={cn(
          'pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2.5 py-1 text-xs whitespace-nowrap text-white transition-all duration-200',
          showTip ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        )}
        aria-hidden={!showTip}
      >
        {tipLabel}
      </div>
    </div>
  )
}
