"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { MusicPlayer } from './MusicPlayer'
import { AppGrid } from './AppGrid'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import { configs } from '@/app/configs'
import Image from 'next/image'
import Logo from '@/public/images/80.png'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel } from '../auth/AuthPanel'
import { Settings, User, Search, X, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { Input } from '@/components/ui/input'
import { SearchDialog } from '@/components/search/SearchDialog'

// 可用的音频文件列表
const availableTracks = configs.availableTracks

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth';

export function AppLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  
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
  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  const { isAuthenticated, user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
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
  
  // 设置音乐播放器高度变量
  useEffect(() => {
    document.documentElement.style.setProperty('--music-player-height', '3rem')
  }, [])

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
  
  // 应用背景图片
  useEffect(() => {
    if (backgroundImage) {
      // 系统背景图片
      if (backgroundImage.startsWith('wallhaven') || backgroundImage.startsWith('我的世界') || backgroundImage.startsWith('F_RIhiObMAA')) {
        document.body.style.backgroundImage = `url(/images/backgrounds/${backgroundImage})`;
      } 
      // 自定义上传的背景图片（base64格式）
      else if (backgroundImage.startsWith('data:')) {
        document.body.style.backgroundImage = `url(${backgroundImage})`;
      }
      // 无背景
      else if (backgroundImage === '') {
        document.body.style.backgroundImage = '';
      }
      
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [backgroundImage]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) return
    
    // 打开搜索弹窗而不是直接跳转
    setIsSearchDialogOpen(true)
    
    // 关闭顶部搜索框
    setIsSearchVisible(false)
  }
  
  // 点击搜索按钮时展开搜索框并聚焦
  const toggleSearch = () => {
    // 直接打开搜索弹窗
    setIsSearchDialogOpen(true)
  }
  
  // 点击外部区域时关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchVisible && 
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        // 检查点击的是否是搜索按钮
        const target = event.target as HTMLElement
        if (!target.closest('button[data-search-toggle]')) {
          setIsSearchVisible(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchVisible])
  
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
              toggleMute={toggleMute}
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
            {/* 左侧：应用切换按钮 */}
            <div className="flex items-center shrink-0 mr-6">
              <Image src={Logo} alt="apps" className="h-10 w-10" onClick={() => router.push('/')}/>
            </div>
            
            {/* 中间：应用图标 - 在搜索时隐藏 */}
            {!isSearchVisible && (
              <div className="flex-1 flex items-center justify-start">
                <AppGrid toggleDisplayMode={toggleDisplayMode} />
              </div>
            )}
            
            {/* 右侧：搜索按钮和用户 */}
            <div className={`flex items-center gap-3 ${isSearchVisible ? 'flex-1 justify-between' : 'ml-auto'}`}>
              {isSearchVisible ? (
                <form onSubmit={handleSearch} className="relative flex items-center flex-1 max-w-md mx-auto">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-8 border-primary/20 animate-in fade-in duration-150"
                  />
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button 
                      type="submit"
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsSearchVisible(false)}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearch}
                  data-search-toggle="true"
                  className="h-9 w-9"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              
              {/* 用户按钮 - 在搜索时隐藏 */}
              {!isSearchVisible && (
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-9 px-3"
                    onClick={() => toggleDisplayMode('auth')}
                  >
                    {isAuthenticated && user ? (
                      <>
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
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
      case 'auth':
        return (
          <div className="h-full flex items-center">
            <AuthPanel toggleDisplayMode={toggleDisplayMode} />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* 搜索弹窗 */}
      <SearchDialog 
        open={isSearchDialogOpen} 
        onOpenChange={setIsSearchDialogOpen}
        initialSearchTerm={searchTerm}
      />
      
      <div 
        id="app-launcher-bar"
        className="bg-background/80 backdrop-blur-md border-b z-50 flex flex-col px-2"
        style={{ 
          height: '3rem',
          width: '100%'
        }}
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
    </>
  );
} 