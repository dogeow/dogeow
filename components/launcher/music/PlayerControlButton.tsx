import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { PlayerControlButtonProps } from '../types'

// 控制按钮组件
export const PlayerControlButton = memo(
  ({ onClick, disabled, title, icon, className = 'h-7 w-7' }: PlayerControlButtonProps) => (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
    </motion.div>
  )
)

PlayerControlButton.displayName = 'PlayerControlButton'
