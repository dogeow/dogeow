import React from 'react'
import { Shuffle, Repeat, Repeat1, ChevronDown } from 'lucide-react'
import type { PlayMode } from '@/stores/musicStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    contentClassName,
    itemClassName,
    align = 'start',
    iconOnly = false,
    hideChevron = false,
    onOpenChange,
  } = props

  const modes: Array<{ value: PlayMode; icon: React.ReactNode; label: string }> = [
    { value: 'all', icon: <Repeat className="h-4 w-4" />, label: '顺序循环' },
    { value: 'one', icon: <Repeat1 className="h-4 w-4" />, label: '单曲循环' },
    { value: 'shuffle', icon: <Shuffle className="h-4 w-4" />, label: '随机播放' },
  ]

  const normalizedPlayMode: Exclude<PlayMode, 'none'> = playMode === 'none' ? 'all' : playMode
  const currentMode = modes.find(m => m.value === normalizedPlayMode) || modes[0]

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent',
            className
          )}
          aria-label={`选择播放模式，当前${currentMode.label}`}
          title={currentMode.label}
        >
          {currentMode.icon}
          {!iconOnly && <span>{currentMode.label}</span>}
          {!hideChevron && <ChevronDown className="h-3 w-3 opacity-50" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={contentClassName}>
        {modes.map(mode => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => onSetPlayMode(mode.value)}
            className={cn('flex items-center gap-2', itemClassName)}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
