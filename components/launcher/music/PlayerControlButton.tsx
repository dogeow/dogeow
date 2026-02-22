import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayerControlButtonProps } from '../types'

// 控制按钮组件
export const PlayerControlButton = memo(
  ({ onClick, disabled, title, icon, className = 'h-7 w-7' }: PlayerControlButtonProps) => (
    <div className="transition-transform hover:scale-110 active:scale-90">
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={onClick}
        disabled={disabled}
        title={title}
      >
        {icon}
        <span className="sr-only">{title}</span>
      </Button>
    </div>
  )
)

PlayerControlButton.displayName = 'PlayerControlButton'
