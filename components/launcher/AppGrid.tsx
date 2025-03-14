"use client"

import React from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ModeToggle } from '../ModeToggle'

type DisplayMode = 'music' | 'apps' | 'settings';

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
}

export function AppGrid({ toggleDisplayMode }: AppGridProps) {
  return (
    <div className="flex items-center space-x-4">
      {/* 主题切换按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <ModeToggle />
      </motion.div>
      
      {/* 设置按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          onClick={() => toggleDisplayMode('settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">打开设置</span>
        </Button>
      </motion.div>
    </div>
  )
} 