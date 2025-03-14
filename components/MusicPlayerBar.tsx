"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Music, Grid, ArrowLeft } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ModeToggle } from './ModeToggle'
import { SettingsToggle } from './SettingsToggle'

// 可用的音频文件列表
const availableTracks = [
  { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' },
  { name: 'I WiSH - 明日への扉~5 years brew version~', path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3' }
]

export function MusicPlayerBar() {
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
  const [audioError, setAudioError] = useState<string | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  const [isVolumeControlVisible, setIsVolumeControlVisible] = useState(false)
  const [displayMode, setDisplayMode] = useState<'music' | 'apps'>('music')
  
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
  
  // 切换音量控制显示
  const toggleVolumeControl = () => {
    setIsVolumeControlVisible(!isVolumeControlVisible)
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
  
  // 计算进度条百分比
  const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2)
  
  // 切换显示模式
  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'music' ? 'apps' : 'music')
  }
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mainContent = document.getElementById('main-content')
      if (mainContent && displayMode === 'apps') {
        mainContent.style.paddingTop = window.innerWidth >= 640 ? '6rem' : '7rem'
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [displayMode])
  
  // 初始化内边距
  useEffect(() => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.style.paddingTop = '3rem' // 默认音乐模式高度
    }
  }, [])
  
  // 渲染音乐播放器
  const renderMusicPlayer = () => {
    return (
      <>
        <div className="w-full flex items-center justify-between">
          {/* 左侧：应用切换按钮 */}
          <div className="flex items-center shrink-0 mr-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleDisplayMode}
                title="切换到应用选择"
              >
                <Grid className="h-4 w-4" />
                <span className="sr-only">切换到应用选择</span>
              </Button>
            </motion.div>
          </div>
          
          {/* 中间：歌曲信息 */}
          <div className="flex-1 overflow-hidden mx-1">
            <div className="overflow-hidden">
              {isPlaying ? (
                <div className="whitespace-nowrap overflow-hidden">
                  <span className="scrolling-text text-sm font-medium">
                    {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium truncate block">
                  {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground truncate">
              {audioError && (
                <span className="text-red-500 truncate">{audioError}</span>
              )}
              
              {isPlaying && !userInteracted && (
                <span className="text-yellow-500 truncate">请点击播放按钮以启动音频播放</span>
              )}
              
              {isPlaying && userInteracted && !readyToPlay && (
                <span className="text-blue-500 truncate">音频正在准备中...</span>
              )}
            </div>
          </div>
          
          {/* 右侧：播放控制和音量 */}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            
            
            {/* 音量控制 */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleVolumeControl}
                title="音量控制"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span className="sr-only">音量控制</span>
              </Button>
              
              {isVolumeControlVisible && (
                <div className="absolute right-0 top-full mt-2 p-2 bg-background border rounded-md shadow-md z-50">
                  <div className="flex flex-col items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                      <span className="sr-only">
                        {isMuted ? '取消静音' : '静音'}
                      </span>
                    </Button>
                    
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
              )}
            </motion.div>
            
            {/* 播放控制 */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
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
                className="h-8 w-8" 
                onClick={handlePlayPause}
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
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={switchToNextTrack}
                disabled={!!audioError}
                title="下一首"
              >
                <SkipForward className="h-4 w-4" />
                <span className="sr-only">下一首</span>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary/30"
          style={{ width: '100%' }}
        >
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* 可拖动进度条 */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleProgressChange}
          className="absolute bottom-0 left-0 w-full h-1 opacity-0 cursor-pointer"
        />
      </>
    )
  }
  
  return (
    <div 
      id="music-player-bar"
      className={cn(
        "fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-50 flex flex-col px-2",
        displayMode === 'music' ? "h-12" : "h-12"
      )}
    >
      {displayMode === 'music' ? (
        // 音乐播放器模式
        <div className="h-full flex items-center">
          {renderMusicPlayer()}
        </div>
      ) : (
        // 应用选择模式
        <div className="h-full flex items-center justify-between">
          {/* 左侧：返回按钮 */}
          <div className="flex items-center shrink-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 mr-1" 
                onClick={toggleDisplayMode}
                title="返回音乐播放器"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">返回</span>
              </Button>
            </motion.div>
          </div>
          
          {/* 右侧：应用图标 */}
          <div className="flex-1 flex items-center justify-start">
            {/* 主题切换按钮 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="scale-75">
                <ModeToggle />
              </div>
            </motion.div>
            
            {/* 设置按钮 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="scale-75">
                <SettingsToggle />
              </div>
            </motion.div>
          </div>
        </div>
      )}
      
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
    </div>
  )
} 