import React, { useCallback } from 'react'
import { Shuffle, Repeat, Repeat1, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PlayMode } from '@/stores/musicStore'

// 播放模式按钮组件（简化逻辑）
export function RepeatModeButton(props: { playMode: PlayMode; onTogglePlayMode: () => void }) {
  const { playMode, onTogglePlayMode } = props

  // 切换播放模式
  const handleClick = useCallback(() => {
    onTogglePlayMode()
  }, [onTogglePlayMode])

  let icon = null
  let label = ''

  switch (playMode) {
    case 'shuffle':
      icon = <Shuffle className="mr-2 h-4 w-4" />
      label = '随机播放'
      break
    case 'one':
      icon = <Repeat1 className="mr-2 h-4 w-4" />
      label = '单曲循环'
      break
    case 'all':
      icon = <Repeat className="mr-2 h-4 w-4" />
      label = '列表循环'
      break
    default:
      icon = <Ban className="mr-2 h-4 w-4" />
      label = '不循环'
      break
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
}
