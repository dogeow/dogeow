"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, RefreshCw } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// 可用的音频文件列表
const availableTracks = [
  { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' },
  { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' }
]

export function MusicPlayer() {
  const { 
    isPlaying, 
    currentTrack, 
    volume, 
    setIsPlaying, 
    setVolume, 
    togglePlay,
    setCurrentTrack
  } = useMusicStore()
  
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // 组件加载时检查音频文件
  useEffect(() => {
    // 确保使用正确的路径格式
    const formattedTrack = currentTrack.startsWith('/') 
      ? currentTrack 
      : `/${currentTrack}`
    
    if (formattedTrack !== currentTrack) {
      setCurrentTrack(formattedTrack)
    }
    
    // 检查音频文件是否存在
    fetch(formattedTrack)
      .then(response => {
        if (!response.ok) {
          throw new Error(`音频文件不存在 (${response.status})`)
        }
        return response
      })
      .catch(error => {
        console.error("音频文件检查失败:", error)
        setAudioError(`音频文件检查失败: ${error.message}`)
        toast.error("音频文件检查失败", {
          description: error.message
        })
      })
  }, [currentTrack, setCurrentTrack])
  
  // 处理播放/暂停
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log("尝试播放:", currentTrack)
        audioRef.current.play().catch(error => {
          console.error("播放失败:", error)
          setIsPlaying(false)
          setAudioError(`播放失败: ${error.message}`)
          toast.error("音乐播放失败", {
            description: "请检查音频文件是否存在或格式是否支持"
          })
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack, setIsPlaying])
  
  // 处理音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])
  
  // 加载音频元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      console.log("音频元数据加载成功，时长:", audioRef.current.duration)
      setAudioError(null) // 清除错误状态
    }
  }
  
  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  // 处理音频播放结束
  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }
  
  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
  
  // 设置播放进度
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }
  
  // 设置音量
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100
    setVolume(newVolume)
  }
  
  // 切换静音
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }
  
  // 切换展开/收起播放器
  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }
  
  // 切换到下一个音频文件
  const switchToNextTrack = () => {
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const nextIndex = (currentIndex + 1) % availableTracks.length
    setCurrentTrack(availableTracks[nextIndex].path)
    setIsPlaying(false) // 切换音频时先暂停播放
    setCurrentTime(0)
    toast.info(`已切换到: ${availableTracks[nextIndex].name}`)
  }
  
  // 获取当前音频文件名称
  const getCurrentTrackName = () => {
    const track = availableTracks.find(track => track.path === currentTrack)
    return track ? track.name : currentTrack.split('/').pop()?.replace('.mp3', '')
  }
  
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 顶部图标按钮 */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("h-10 w-10 rounded-md", audioError && "border-red-500")}
          onClick={toggleExpand}
          title={audioError || "音乐播放器"}
        >
          <Music className={cn("h-5 w-5", audioError && "text-red-500")} />
          <span className="sr-only">音乐</span>
        </Button>
      </motion.div>
      
      {/* 展开的播放器面板 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-12 right-0 w-80 p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg z-50"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium truncate flex-1">
                正在播放: {getCurrentTrackName()}
              </h3>
              <div className="flex items-center gap-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={toggleExpand}
                  >
                    <span className="sr-only">收起播放器</span>
                    ✕
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {audioError && (
              <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs rounded">
                {audioError}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer"
                style={{
                  backgroundSize: `${(currentTime / (duration || 100)) * 100}% 100%`,
                  backgroundImage: 'linear-gradient(var(--primary), var(--primary))',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              
              <div className="flex justify-between items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={togglePlay}
                    disabled={!!audioError}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {isPlaying ? '暂停' : '播放'}
                    </span>
                  </Button>
                </motion.div>
                
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={toggleMute}
                      disabled={!!audioError}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isMuted ? '取消静音' : '静音'}
                      </span>
                    </Button>
                  </motion.div>
                  
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    className="w-20 h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      backgroundSize: `${volume * 100}% 100%`,
                      backgroundImage: 'linear-gradient(var(--primary), var(--primary))',
                      backgroundRepeat: 'no-repeat'
                    }}
                    disabled={!!audioError}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <audio
        ref={audioRef}
        src={currentTrack}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        loop={false}
        hidden
      />
    </motion.div>
  )
} 