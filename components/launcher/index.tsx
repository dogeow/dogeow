"use client"

import React, { useEffect, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { MusicPlayer } from './MusicPlayer'
import { AppGrid } from './AppGrid'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import Image from 'next/image'
import Logo from '@/public/images/80.png'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel } from '../auth/AuthPanel'
import { User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { SearchBar } from './SearchBar'
import { SearchDialog } from '@/components/search/SearchDialog'
import { AudioController } from './AudioController'
import ReactMarkdown from 'react-markdown'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'markdown';

export function AppLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  
  const { 
    currentTrack, 
    volume: musicVolume, 
    setVolume, 
    setCurrentTrack,
    setAvailableTracks
  } = useMusicStore()
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(musicVolume || 0.5)
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
  const [markdownText, setMarkdownText] = useState<string>('')
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // 判断当前是否在首页
  const isHomePage = pathname === '/'
  
  // 获取当前页面所属的应用类型
  const currentApp = pathname.split('/')[1]

  // 初始化音频控制器
  const {
    audioRef,
    togglePlay,
    switchTrack,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    setupMediaSource
  } = AudioController({
    volume,
    isMuted,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setReadyToPlay,
    setAudioError,
    isPlaying,
    readyToPlay,
    userInteracted,
    isTrackChanging,
    setIsTrackChanging
  })

  // 组件加载时检查音频文件
  useEffect(() => {
    // 只在开发环境输出环境变量信息
    if (process.env.NODE_ENV === 'development') {
      console.log('环境变量:', {
        API_URL: apiUrl,
        NODE_ENV: process.env.NODE_ENV
      });
    }
  }, []);
  
  // 加载音频列表
  const fetchAvailableTracks = async () => {
    try {
      // 获取音频列表
      const musicUrl = `${apiUrl}/api/musics`;
      const musicResponse = await fetch(musicUrl);
      const musicData = await musicResponse.json();
      
      setAvailableTracks(musicData);
      
      // 如果当前没有选中音轨，选择第一个
      const currentTrackValue = useMusicStore.getState().currentTrack;
      if ((!currentTrackValue || currentTrackValue === '') && musicData.length > 0) {
        setCurrentTrack(musicData[0].path);
      }
    } catch (error) {
      console.error('加载音频列表失败:', error);
    }
  };
  
  // 处理音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  // 切换静音状态
  const toggleMute = () => setIsMuted(!isMuted);

  // 监听全局用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
      }
    }
    
    // 添加各种用户交互事件监听器
    const events = ['click', 'keydown', 'touchstart']
    events.forEach(event => document.addEventListener(event, handleUserInteraction))
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserInteraction))
    }
  }, [userInteracted])
  
  // 设置音乐播放器高度变量
  useEffect(() => {
    document.documentElement.style.setProperty('--music-player-height', '2.5rem')
  }, [])

  // 阻止用户输入事件冒泡到 body，避免全局热键影响
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 切换音量控制显示
  const toggleVolumeControl = () => setIsVolumeControlVisible(!isVolumeControlVisible);
  
  // 获取当前音频文件名称
  const getCurrentTrackName = () => {
    if (!currentTrack) return '没有选择音乐';
    
    // 首先尝试从可用轨道中查找
    const allTracks = useMusicStore.getState().availableTracks;
    
    // 查找包含相同path的音乐
    const trackInfo = allTracks.find(track => {
      // 完全匹配
      if (track.path === currentTrack) return true;
      
      // 对于MP3文件路径检查包含关系
      if (currentTrack.includes(track.path)) return true;
      
      return false;
    });
    
    if (trackInfo?.name) {
      return trackInfo.name;
    }
    
    // 从路径中提取文件名
    // 传统方式：从路径中提取文件名
    const parts = currentTrack.split('/');
    let fileName = parts[parts.length - 1];
    
    // 移除扩展名和特殊字符
    return fileName
      .replace(/\.(mp3|wav|m4a|aac|ogg|flac)$/i, '')
      .replace(/[_\-]/g, ' ');
  };
  
  // 切换显示模式
  const toggleDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
    
    // 当切换到音乐模式时，加载音频列表并初始化音频源
    if (mode === 'music') {
      fetchAvailableTracks();
      
      if (currentTrack && !audioRef.current?.src) {
        setupMediaSource()
      }
    }
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
  
  const handleSearch = (e: React.FormEvent, keepSearchOpen: boolean = false) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    if (isHomePage) {
      setIsSearchDialogOpen(true)
    } else {
      // 触发应用特定的搜索事件
      const searchEvent = new CustomEvent(`${currentApp}-search`, { 
        detail: { searchTerm } 
      });
      document.dispatchEvent(searchEvent);
    }
    if (!keepSearchOpen) {
      setIsSearchVisible(false)
    }
  }
  
  // 点击搜索按钮时展开搜索框或打开搜索弹窗
  const toggleSearch = () => {
    if (isSearchVisible) {
      setIsSearchVisible(false);
    } else if (isHomePage) {
      // 在首页使用搜索弹窗
      setIsSearchDialogOpen(true);
      setIsSearchVisible(false);
    } else {
      // 在非首页显示搜索框
      setIsSearchVisible(true);
    }
  };
  
  const switchToNextTrack = () => switchTrack('next')
  const switchToPrevTrack = () => switchTrack('prev')
  
  // 添加全局键盘快捷键处理
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Ctrl+K 快捷键打开或关闭搜索对话框（也兼容 macOS 的 Command+K）
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // 阻止默认行为
        
        // 如果搜索对话框已经打开，则关闭
        if (isSearchDialogOpen) {
          setIsSearchDialogOpen(false);
          return;
        }
        
        // 如果已经打开搜索框，则关闭搜索框
        if (isSearchVisible) {
          setIsSearchVisible(false);
          return;
        }
        
        // 在首页直接打开搜索对话框
        if (isHomePage) {
          setIsSearchDialogOpen(true);
        } 
        // 在其他页面显示顶部搜索框
        else {
          setIsSearchVisible(true);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [isSearchVisible, isHomePage, isSearchDialogOpen]);
  
  // 添加一个监听剪贴板事件的处理函数
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 只在首页处理粘贴事件
      if (pathname !== '/') return
      
      const clipboardText = e.clipboardData?.getData('text/plain')
      
      // 检查文本是否包含Markdown标记
      if (clipboardText && (
        clipboardText.includes('#') || 
        clipboardText.includes('*') || 
        clipboardText.includes('```') ||
        clipboardText.includes('>') ||
        clipboardText.includes('-') ||
        clipboardText.includes('|')
      )) {
        setMarkdownText(clipboardText)
        // 如果不是在markdown模式，切换到markdown模式
        if (displayMode !== 'markdown') {
          setDisplayMode('markdown')
        }
        // 阻止默认粘贴行为
        e.preventDefault()
      }
    }
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', handlePaste)
    
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [pathname, displayMode])
  
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
            {/* 左侧：应用切换按钮 - 始终显示 */}
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
              <SearchBar 
                isVisible={isSearchVisible}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
                onToggleSearch={toggleSearch}
                currentApp={currentApp}
              />
              
              {/* 用户按钮 - 在非首页搜索状态时隐藏 */}
              {!(isSearchVisible && !isHomePage) && (
                isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleDisplayMode('auth')}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="h-9"
                    onClick={() => toggleDisplayMode('auth')}
                  >
                    登录
                  </Button>
                )
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
      case 'markdown':
        return (
          <div className="h-full flex items-center justify-between w-full">
            <div className="flex items-center shrink-0 mr-6">
              <Image 
                src={Logo} 
                alt="apps" 
                className="h-10 w-10 cursor-pointer" 
                onClick={() => {
                  setDisplayMode('apps')
                  setMarkdownText('')
                }}
              />
            </div>
            
            <div className="flex-1 overflow-auto px-4 py-1">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-li:my-0">
                <ReactMarkdown>
                  {markdownText}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDisplayMode('apps')
                  setMarkdownText('')
                }}
              >
                关闭
              </Button>
            </div>
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
        currentRoute={!isHomePage ? pathname : undefined}
      />
      
      <div 
        id="app-launcher-bar"
        className="bg-background/80 backdrop-blur-md border-b z-50 flex flex-col px-2"
        style={{ 
          height: '2.5rem',
          width: '100%'
        }}
      >
        {renderContent()}
        
        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleAudioError}
          onEnded={() => switchToNextTrack()}
          onCanPlay={() => setReadyToPlay(true)}
          loop={false}
          hidden
          preload="auto"
        />
      </div>
    </>
  );
} 