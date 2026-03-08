import React from 'react'
import { Shuffle, Repeat, Repeat1, Ban, ChevronDown } from 'lucide-react'
import type { PlayMode } from '@/stores/musicStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 播放模式选择器组件
export function RepeatModeButton(props: {
  playMode: PlayMode
  onSetPlayMode: (mode: PlayMode) => void
}) {
  const { playMode, onSetPlayMode } = props

  const modes: Array<{ value: PlayMode; icon: React.ReactNode; label: string }> = [
    { value: 'none', icon: <Ban className="h-4 w-4" />, label: '不循环' },
    { value: 'all', icon: <Repeat className="h-4 w-4" />, label: '列表循环' },
    { value: 'one', icon: <Repeat1 className="h-4 w-4" />, label: '单曲循环' },
    { value: 'shuffle', icon: <Shuffle className="h-4 w-4" />, label: '随机播放' },
  ]

  const currentMode = modes.find(m => m.value === playMode) || modes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
          aria-label="选择播放模式"
        >
          {currentMode.icon}
          <span>{currentMode.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {modes.map(mode => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => onSetPlayMode(mode.value)}
            className="flex items-center gap-2"
          >
            {mode.icon}
            <span>{mode.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
