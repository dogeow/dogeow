"use client"

import React from 'react'
import { Grid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function AppLauncher() {
  // 切换到应用选择模式
  const showAppLauncher = () => {
    // 获取顶部栏元素
    const playerBar = document.getElementById('music-player-bar')
    if (playerBar) {
      // 如果当前不是应用模式，则触发切换
      if (!playerBar.classList.contains('h-32') && !playerBar.classList.contains('h-24')) {
        // 查找切换按钮并点击它
        const toggleButton = playerBar.querySelector('button[title="切换到应用选择"]')
        if (toggleButton) {
          (toggleButton as HTMLButtonElement).click()
        }
      }
      // 滚动到顶部栏
      playerBar.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        variant="outline" 
        size="icon" 
        className="h-10 w-10 rounded-md"
        onClick={showAppLauncher}
        title="应用选择"
      >
        <Grid className="h-5 w-5" />
        <span className="sr-only">应用选择</span>
      </Button>
    </motion.div>
  )
} 