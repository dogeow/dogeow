"use client"

import React, { useEffect, useState } from 'react'
import { Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

// 创建一个自定义事件名称
export const MUSIC_PLAYING_EVENT = 'music-playing-state-changed'

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 监听自定义事件来更新播放状态
  useEffect(() => {
    const handlePlayingStateChange = (event: CustomEvent) => {
      setIsPlaying(event.detail.isPlaying)
    }
    
    // 添加事件监听器
    window.addEventListener(MUSIC_PLAYING_EVENT, handlePlayingStateChange as EventListener)
    
    // 清理函数
    return () => {
      window.removeEventListener(MUSIC_PLAYING_EVENT, handlePlayingStateChange as EventListener)
    }
  }, [])
  
  // 切换到音乐播放器模式
  const showMusicPlayer = () => {
    // 获取顶部栏元素
    const playerBar = document.getElementById('launcher-bar')
    if (playerBar) {
      // 如果当前不是音乐模式，则触发切换
      if (playerBar.classList.contains('h-32') || playerBar.classList.contains('h-24')) {
        // 查找切换按钮并点击它
        const toggleButton = playerBar.querySelector('button[title="切换到音乐播放器"]')
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
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-md"
        onClick={showMusicPlayer}
        title="音乐播放器"
      >
        <Music className={cn("h-5 w-5", isPlaying && "text-primary")} />
        <span className="sr-only">音乐</span>
      </Button>
    </motion.div>
  )
} 