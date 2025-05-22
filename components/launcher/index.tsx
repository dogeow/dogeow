"use client"

import React, { useEffect, useState } from 'react'
import { useMusicStore, MusicTrack } from '@/stores/musicStore'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { MusicPlayer } from './MusicPlayer'
import { AppGrid } from './AppGrid'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import Image from 'next/image'
import Logo from '@/public/images/80.png'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel } from '../auth/AuthPanel'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { SearchBar } from './SearchBar'
import { SearchDialog } from '@/components/search/SearchDialog'
import { AudioController } from './AudioController'
import ReactMarkdown from 'react-markdown'
import { apiRequest } from '@/lib/api'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'markdown';

export function AppLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  
  const { 
    currentTrack, 
    volume: musicVolume, 
    setCurrentTrack,
    setAvailableTracks
  } = useMusicStore()
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume] = useState(musicVolume || 0.5)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  
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
  
  // 加载音频列表
  const fetchAvailableTracks = async () => {
    try {
      // 获取音频列表
      const musicData = await apiRequest<MusicTrack[]>('/musics');
      
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
  
  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
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
      // 只处理 Ctrl+K 或 Command+K 快捷键
      if (!((e.ctrlKey || e.metaKey) && e.key === 'k')) return;
      
      e.preventDefault();
      
      // 根据当前状态切换搜索界面
      if (isSearchDialogOpen) {
        setIsSearchDialogOpen(false);
      } else if (isSearchVisible) {
        setIsSearchVisible(false);
      } else {
        // 根据页面类型决定打开搜索对话框还是搜索框
        isHomePage ? setIsSearchDialogOpen(true) : setIsSearchVisible(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isSearchVisible, isHomePage, isSearchDialogOpen]);
  
  const renderContent = () => {
    const contentMap = {
      music: (
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
      ),
      apps: (
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
      ),
      settings: (
        <div className="h-full flex items-center">
          <SettingsPanel 
            toggleDisplayMode={toggleDisplayMode}
            backgroundImage={backgroundImage}
            setBackgroundImage={setBackgroundImage}
            customBackgrounds={customBackgrounds}
            setCustomBackgrounds={setCustomBackgrounds}
          />
        </div>
      ),
      auth: (
        <div className="h-full flex items-center">
          <AuthPanel toggleDisplayMode={toggleDisplayMode} />
        </div>
      ),
      markdown: (
        <div className="h-full flex items-center justify-between w-full">
          <div className="flex items-center shrink-0 mr-6">
            <Image 
              src={Logo} 
              alt="apps" 
              className="h-10 w-10 cursor-pointer" 
              onClick={() => {
                setDisplayMode('apps')
                setSearchText('')
              }}
            />
          </div>
          
          <div className="flex-1 overflow-auto px-4 py-1">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-li:my-0">
              <ReactMarkdown>
                {searchText}
              </ReactMarkdown>
            </div>
          </div>
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDisplayMode('apps')
                setSearchText('')
              }}
            >
              关闭
            </Button>
          </div>
        </div>
      )
    };

    return contentMap[displayMode] || null;
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
        className="bg-background/80 backdrop-blur-md z-50 flex flex-col px-2 h-full w-full relative"
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