"use client"

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { MUSIC_PLAYING_EVENT } from './MusicPlayer'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { MusicPlayer } from './launcher/MusicPlayer'
import { AppGrid } from './launcher/AppGrid'
import { SettingsPanel, CustomBackground } from './launcher/SettingsPanel'

// 可用的音频文件列表
const availableTracks = [
  { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' },
  { name: 'I WiSH - 明日への扉~5 years brew version~', path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3' }
]

// 系统提供的背景图列表
const systemBackgrounds = [
  { id: "none", name: "无背景", url: "" },
  { id: "bg1", name: "你的名字？·untitled", url: "/backgrounds/wallhaven-72rd8e_2560x1440-1.webp" },
  { id: "bg2", name: "书房·我的世界", url: "/backgrounds/我的世界.png" },
  { id: "bg3", name: "2·untitled", url: "/backgrounds/F_RIhiObMAA-c8N.jpeg" },
]

type DisplayMode = 'music' | 'apps' | 'settings';

export function AppLauncher() {
  const { 
    currentTrack, 
    volume, 
    setVolume, 
    setCurrentTrack
  } = useMusicStore()
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  const [isVolumeControlVisible, setIsVolumeControlVisible] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('music')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  
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
    
    if (isPlaying && readyToPlay && userInteracted) {
      audioRef.current.play().catch(error => {
        console.error("播放失败:", error)
        setIsPlaying(false)
        setReadyToPlay(false)
        setAudioError(`播放失败: ${error.message}`)
        toast.error("音乐播放失败", {
          description: error.message
        })
      })
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlaying, userInteracted, readyToPlay])
  
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
    const events = ['click', 'keydown', 'touchstart']
    events.forEach(event => document.addEventListener(event, handleUserInteraction))
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserInteraction))
    }
  }, [isPlaying, userInteracted, readyToPlay])
  
  // 监听音轨变化，在元数据加载后准备播放
  useEffect(() => {
    if (!isTrackChanging || !audioRef.current || !userInteracted) return
    
    const handleCanPlay = () => {
      setReadyToPlay(true)
      setIsTrackChanging(false)
      audioRef.current?.removeEventListener('canplay', handleCanPlay)
    }
    
    audioRef.current.addEventListener('canplay', handleCanPlay)
    return () => audioRef.current?.removeEventListener('canplay', handleCanPlay)
  }, [isTrackChanging, userInteracted])
  
  // 监听窗口大小变化和显示模式变化，更新内边距
  useEffect(() => {
    const updatePadding = () => {
      const mainContent = document.getElementById('main-content')
      if (!mainContent) return
      
      const height = '3rem'
      mainContent.style.paddingTop = height
      document.documentElement.style.setProperty('--music-player-height', height)
    }
    
    updatePadding()
    window.addEventListener('resize', updatePadding)
    
    return () => window.removeEventListener('resize', updatePadding)
  }, [displayMode])
  
  // 监听播放状态变化并触发自定义事件
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(MUSIC_PLAYING_EVENT, { detail: { isPlaying } }))
  }, [isPlaying])
  
  // 加载音频元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setAudioError(null)
      setReadyToPlay(true)
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
  const toggleMute = () => setIsMuted(!isMuted)
  
  // 切换音量控制显示
  const toggleVolumeControl = () => setIsVolumeControlVisible(!isVolumeControlVisible)
  
  // 切换到下一个或上一个音频文件
  const switchTrack = (direction: 'next' | 'prev') => {
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % availableTracks.length
      : (currentIndex - 1 + availableTracks.length) % availableTracks.length
    
    setIsTrackChanging(true)
    setCurrentTime(0)
    setReadyToPlay(false)
    setCurrentTrack(availableTracks[newIndex].path)
    setIsPlaying(true)
    setUserInteracted(true)
    
    toast.info(`已切换到: ${availableTracks[newIndex].name}`)
  }
  
  const switchToNextTrack = () => switchTrack('next')
  const switchToPrevTrack = () => switchTrack('prev')
  
  // 切换播放/暂停状态
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setReadyToPlay(true)
    }
    setUserInteracted(true)
  }
  
  // 获取当前音频文件名称
  const getCurrentTrackName = () => {
    const track = availableTracks.find(track => track.path === currentTrack)
    return track ? track.name : currentTrack.split('/').pop()?.replace('.mp3', '')
  }
  
  // 切换显示模式
  const toggleDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
  }
  
  const renderContent = () => {
    switch (displayMode) {
      case 'music':
        return (
          <div className="h-full flex items-center">
            <MusicPlayer 
              isPlaying={isPlaying}
              audioError={audioError}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isVolumeControlVisible={isVolumeControlVisible}
              toggleVolumeControl={toggleVolumeControl}
              toggleMute={toggleMute}
              handleVolumeChange={handleVolumeChange}
              switchToPrevTrack={switchToPrevTrack}
              switchToNextTrack={switchToNextTrack}
              togglePlay={togglePlay}
              handleProgressChange={handleProgressChange}
              getCurrentTrackName={getCurrentTrackName}
              formatTime={formatTime}
              toggleDisplayMode={toggleDisplayMode}
            />
          </div>
        );
      case 'apps':
        return (
          <div className="h-full flex items-center justify-between">
            {/* 左侧：返回按钮 */}
            <div className="flex items-center shrink-0">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 mr-1" 
                  onClick={() => toggleDisplayMode('music')}
                  title="返回音乐播放器"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">返回</span>
                </Button>
              </motion.div>
            </div>
            
            {/* 右侧：应用图标 */}
            <div className="flex-1 flex items-center justify-start">
              <AppGrid toggleDisplayMode={toggleDisplayMode} />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="h-full flex items-center">
            <SettingsPanel 
              toggleDisplayMode={toggleDisplayMode}
              backgroundImage={backgroundImage}
              setBackgroundImage={setBackgroundImage}
              customBackgrounds={customBackgrounds}
              setCustomBackgrounds={setCustomBackgrounds}
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div 
      id="music-player-bar"
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-50 flex flex-col px-2 h-12"
    >
      {renderContent()}
      
      <audio
        ref={audioRef}
        src={currentTrack}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={switchToNextTrack}
        onError={handleAudioError}
        loop={false}
        hidden
        preload="metadata"
      />
    </div>
  )
} 