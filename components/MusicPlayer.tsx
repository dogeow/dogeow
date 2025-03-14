"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, SkipBack, SkipForward } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// 可用的音频文件列表
const availableTracks = [
  { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' },
  { name: 'I WiSH - 明日への扉~5 years brew version~', path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3' }
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
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  
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
    if (!audioRef.current) return
    
    if (isPlaying && readyToPlay) {
      // 只有在用户交互后且准备好播放时才尝试播放
      if (userInteracted) {
        console.log("尝试播放:", currentTrack)
        audioRef.current.play().catch(error => {
          console.error("播放失败:", error)
          setIsPlaying(false)
          setReadyToPlay(false)
          setAudioError(`播放失败: ${error.message}`)
          toast.error("音乐播放失败", {
            description: error.message
          })
        })
      } else {
        // 如果用户尚未交互，则不尝试播放，但保持isPlaying状态
        console.log("等待用户交互后再播放")
      }
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlaying, currentTrack, setIsPlaying, userInteracted, readyToPlay])
  
  // 处理音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])
  
  // 监听全局用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        console.log("用户已交互，可以播放音频")
        setUserInteracted(true)
        
        // 如果状态是播放中且准备好播放，但因为没有用户交互而未播放，现在尝试播放
        if (isPlaying && readyToPlay && audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error("交互后播放失败:", error)
            setIsPlaying(false)
            setReadyToPlay(false)
            setAudioError(`播放失败: ${error.message}`)
          })
        }
      }
    }
    
    // 添加各种用户交互事件监听器
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)
    
    return () => {
      // 清理事件监听器
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [isPlaying, userInteracted, readyToPlay])
  
  // 监听音轨变化，在元数据加载后准备播放
  useEffect(() => {
    if (isTrackChanging && audioRef.current && userInteracted) {
      // 监听元数据加载完成事件
      const handleCanPlay = () => {
        console.log("新音轨可以播放，设置准备播放状态")
        setReadyToPlay(true)
        
        // 如果用户已经交互过，且状态是播放中，则尝试播放
        if (userInteracted && isPlaying) {
          audioRef.current?.play().catch(error => {
            console.error("自动播放失败:", error)
            setIsPlaying(false)
            setReadyToPlay(false)
            setAudioError(`自动播放失败: ${error.message}`)
          })
        }
        
        // 移除一次性事件监听器
        audioRef.current?.removeEventListener('canplay', handleCanPlay)
        setIsTrackChanging(false)
      }
      
      audioRef.current.addEventListener('canplay', handleCanPlay)
      
      return () => {
        audioRef.current?.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [isTrackChanging, userInteracted, isPlaying])
  
  // 加载音频元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      console.log("音频元数据加载成功，时长:", audioRef.current.duration)
      setAudioError(null) // 清除错误状态
      setReadyToPlay(true) // 设置准备好播放
    }
  }
  
  // 处理音频错误
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const error = (e.target as HTMLAudioElement).error
    const errorMessage = error ? `错误代码: ${error.code}, 消息: ${error.message}` : "未知错误"
    console.error("音频加载错误:", errorMessage)
    setAudioError(errorMessage)
    setIsPlaying(false)
    setIsTrackChanging(false)
    setReadyToPlay(false)
    toast.error("音频加载错误", {
      description: errorMessage
    })
  }
  
  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  // 处理音频播放结束
  const handleEnded = () => {
    // 播放结束后自动切换到下一首
    switchToNextTrack()
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
    // 标记用户已交互
    setUserInteracted(true)
  }
  
  // 切换到下一个音频文件
  const switchToNextTrack = () => {
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const nextIndex = (currentIndex + 1) % availableTracks.length
    
    // 设置正在切换音轨标志
    setIsTrackChanging(true)
    
    // 重置播放时间
    setCurrentTime(0)
    
    // 重置准备播放状态
    setReadyToPlay(false)
    
    // 设置新的音轨
    setCurrentTrack(availableTracks[nextIndex].path)
    
    // 设置为播放状态，但不立即播放
    setIsPlaying(true)
    
    toast.info(`已切换到: ${availableTracks[nextIndex].name}`)
    
    // 标记用户已交互
    setUserInteracted(true)
  }
  
  // 切换到上一个音频文件
  const switchToPrevTrack = () => {
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const prevIndex = (currentIndex - 1 + availableTracks.length) % availableTracks.length
    
    // 设置正在切换音轨标志
    setIsTrackChanging(true)
    
    // 重置播放时间
    setCurrentTime(0)
    
    // 重置准备播放状态
    setReadyToPlay(false)
    
    // 设置新的音轨
    setCurrentTrack(availableTracks[prevIndex].path)
    
    // 设置为播放状态，但不立即播放
    setIsPlaying(true)
    
    toast.info(`已切换到: ${availableTracks[prevIndex].name}`)
    
    // 标记用户已交互
    setUserInteracted(true)
  }
  
  // 手动播放/暂停，确保用户交互
  const handlePlayPause = () => {
    // 如果当前是暂停状态，点击后设置为播放状态，但不立即播放
    // 如果当前是播放状态，点击后设置为暂停状态
    togglePlay()
    
    // 如果切换到播放状态，设置准备播放标志
    if (!isPlaying) {
      setReadyToPlay(true)
    }
    
    // 标记用户已交互
    setUserInteracted(true)
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
          <Music className={cn("h-5 w-5", audioError && "text-red-500", isPlaying && "text-primary")} />
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
            
            {audioError && (
              <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs rounded">
                {audioError}
              </div>
            )}
            
            {isPlaying && !userInteracted && (
              <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                请点击播放按钮以启动音频播放
              </div>
            )}
            
            {isPlaying && userInteracted && !readyToPlay && (
              <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                音频正在准备中，请稍候...
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
              
              <div className="flex justify-center items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={switchToPrevTrack}
                    disabled={!!audioError}
                    title="上一首"
                  >
                    <SkipBack className="h-4 w-4" />
                    <span className="sr-only">上一首</span>
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10" 
                    onClick={handlePlayPause}
                    disabled={!!audioError}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    <span className="sr-only">
                      {isPlaying ? '暂停' : '播放'}
                    </span>
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={switchToNextTrack}
                    disabled={!!audioError}
                    title="下一首"
                  >
                    <SkipForward className="h-4 w-4" />
                    <span className="sr-only">下一首</span>
                  </Button>
                </motion.div>
              </div>
              
              <div className="flex items-center justify-center gap-2">
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
                  className="w-32 h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer"
                  style={{
                    backgroundSize: `${volume * 100}% 100%`,
                    backgroundImage: 'linear-gradient(var(--primary), var(--primary))',
                    backgroundRepeat: 'no-repeat'
                  }}
                  disabled={!!audioError}
                />
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
        onError={handleAudioError}
        loop={false}
        hidden
        preload="metadata"
      />
    </motion.div>
  )
} 