"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { MusicPlayer } from './MusicPlayer'
import { AppGrid } from './AppGrid'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import Image from 'next/image'
import Logo from '@/public/images/80.png'
import { useRouter } from 'next/navigation'
import { AuthPanel } from '../auth/AuthPanel'
import { User, Search, X, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { Input } from '@/components/ui/input'
import { SearchDialog } from '@/components/search/SearchDialog'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth';

export function AppLauncher() {
  const router = useRouter()
  
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
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hlsInstanceRef = useRef<{ hls: any; destroy: () => void } | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
  
  // 监听currentTrack变化，但不自动初始化播放器
  useEffect(() => {
    if (!currentTrack) return;
    
    // 不在此处调用setupMediaSource()，而是在用户交互时调用
  }, [currentTrack]);
  
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
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
    
    // 直接应用到当前音频元素
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  // 切换静音状态
  const toggleMute = () => setIsMuted(!isMuted);

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

  // 阻止用户输入事件冒泡到 body，避免全局热键影响
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // 更新音频状态 - 处理音频元素的各种事件
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log('音频元数据已加载:', {
        duration: audioRef.current.duration,
        src: audioRef.current.src
      });
      
      setDuration(audioRef.current.duration);
      setAudioError(null);
      
      // 如果处于播放状态，尝试播放
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(err => {
          console.error('元数据加载后播放失败:', err);
          setAudioError(`播放失败: ${err.message}`);
        });
      }
    }
  };

  // 检查音频是否支持HLS格式
  const isHlsCompatible = (trackPath: string | null): boolean => {
    if (!trackPath) return false;
    // 检查是否是m3u8格式
    return trackPath.toLowerCase().endsWith('.m3u8');
  }

  // 处理音频错误
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    console.error('音频播放错误:', audio.error, {
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState
    });
    
    // 获取更详细的错误信息
    const errorCode = audio.error ? audio.error.code : 'unknown';
    const errorMessage = audio.error ? audio.error.message : 'Unknown error';
    
    setAudioError(`播放错误 (${errorCode}): ${errorMessage}`);
    setIsPlaying(false);
    
    // 尝试使用直接播放模式作为回退方案
    if (currentTrack && isHlsCompatible(currentTrack) && hlsInstanceRef.current) {
      console.log('HLS播放失败，尝试直接播放原始文件');
      
      // 清理HLS实例
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
      
      // 尝试直接播放源文件
      if (audioRef.current) {
        audioRef.current.src = currentTrack;
        audioRef.current.load();
      }
    }
  };

  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 处理进度条拖动
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // 切换音量控制显示
  const toggleVolumeControl = () => setIsVolumeControlVisible(!isVolumeControlVisible);
  
  // 设置音频源
  const setupMediaSource = () => {
    if (!audioRef.current || !currentTrack) return
    
    // 确保先清理
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy()
      hlsInstanceRef.current = null
    }
    
    // 设置音频
    try {
      // 构建音频URL
      const audioUrl = apiUrl + currentTrack
      
      // 设置音频元素的源
      audioRef.current.src = audioUrl
      audioRef.current.load()
      
      // 重置错误状态
      setAudioError(null)
      
      // 设置是否正在切换音轨的状态
      setIsTrackChanging(true)
      
    } catch (err) {
      console.error('设置音频源失败:', err)
      setAudioError(`设置音频源失败: ${err}`)
    }
  }

  // 切换播放/暂停状态
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    // 如果音频还未加载，先加载
    if (!audioRef.current.src) {
      setupMediaSource();
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 确保音量正确设置
      audioRef.current.volume = isMuted ? 0 : volume;
      
      audioRef.current.play().catch((err) => {
        console.error('播放失败:', err);
        setAudioError(`播放失败: ${err.message}`);
      });
      
      setIsPlaying(true);
    }
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
    if (isSearchVisible) {
      setIsSearchVisible(false);
    } else {
      // 使用SearchDialog替代搜索框
      setIsSearchDialogOpen(true);
      setIsSearchVisible(false);
    }
  };
  
  // 监听点击事件，点击搜索框外部时关闭
  useEffect(() => {
    if (!isSearchVisible) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchVisible]);
  
  // 切换曲目
  const switchTrack = (direction: 'next' | 'prev') => {
    if (!currentTrack) return;
    
    // 获取可用曲目列表
    const tracks = useMusicStore.getState().availableTracks;
    
    // 如果没有曲目，不执行任何操作
    if (!tracks.length) return;
    
    // 查找当前曲目在列表中的位置
    const currentIndex = tracks.findIndex(track => track.path === currentTrack);
    
    // 如果当前曲目不在列表中，使用第一首或最后一首
    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = direction === 'next' ? 0 : tracks.length - 1;
    } else {
      // 计算下一首/上一首索引，循环播放
      nextIndex = direction === 'next'
        ? (currentIndex + 1) % tracks.length
        : (currentIndex - 1 + tracks.length) % tracks.length;
    }
    
    // 设置新的当前曲目
    setCurrentTrack(tracks[nextIndex].path);
    
    // 更新状态
    setAudioError(null);
    setIsPlaying(true);
  };
  
  const switchToNextTrack = () => switchTrack('next')
  const switchToPrevTrack = () => switchTrack('prev')
  
  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 同步音频当前状态到store
  useEffect(() => {
    setVolume(volume);
  }, [volume, setVolume]);
  
  // 监听音频播放结束
  useEffect(() => {
    const handleAudioEnded = () => {
      console.log('音频播放已结束');
      
      // 重置播放状态但保留音轨
      setCurrentTime(0);
      
      // 检查是否自动切换到下一曲
      const tracks = useMusicStore.getState().availableTracks;
      const currentIndex = tracks.findIndex(track => track.path === currentTrack);
      if (currentIndex >= 0) {
        switchToNextTrack();
      } else {
        console.warn('当前曲目不在播放列表中，不自动切换到下一曲');
        setIsPlaying(false);
      }
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [currentTrack, switchToNextTrack]);
  
  // 在组件卸载时清理HLS实例
  useEffect(() => {
    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, []);
  
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
                      disabled={!searchTerm.trim()}
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
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleAudioError}
          loop={false}
          hidden
          preload="none"
        />
      </div>
    </>
  );
} 