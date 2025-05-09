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
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const [isStreamingSupported, setIsStreamingSupported] = useState(true);
  
  // 组件加载时检查音频文件
  useEffect(() => {
    // 确保使用正确的路径格式
    const formattedTrack = currentTrack.startsWith('/') 
      ? currentTrack 
      : `/${currentTrack}`
    
    if (formattedTrack !== currentTrack) {
      setCurrentTrack(formattedTrack)
    }
    
    // 不再在组件初始化时检查音频文件
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
  
  // 创建媒体源并开始流式播放
  const setupMediaSource = () => {
    // 检查浏览器是否支持 MediaSource
    if (!window.MediaSource) {
      setIsStreamingSupported(false);
      console.warn('此浏览器不支持 MediaSource Extensions，将使用传统播放方式');
      return;
    }

    try {
      // 如果有正在进行的请求，取消它
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }

      // 创建新的 MediaSource
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;

      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(mediaSource);
      }

      mediaSource.addEventListener('sourceopen', () => {
        try {
          // 尝试创建 SourceBuffer
          const mimeType = 'audio/mpeg'; // 假设是 MP3 文件
          if (!MediaSource.isTypeSupported(mimeType)) {
            console.warn(`浏览器不支持 ${mimeType} 类型`);
            setIsStreamingSupported(false);
            // 回退到直接使用 src
            if (audioRef.current) {
              audioRef.current.src = currentTrack;
            }
            return;
          }

          // 创建 SourceBuffer
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBufferRef.current = sourceBuffer;

          // 开始加载音频
          startStreamingAudio(currentTrack);
        } catch (error) {
          console.error('创建 SourceBuffer 失败:', error);
          setIsStreamingSupported(false);
          // 回退到直接使用 src
          if (audioRef.current) {
            audioRef.current.src = currentTrack;
          }
        }
      });
    } catch (error) {
      console.error('设置 MediaSource 失败:', error);
      setIsStreamingSupported(false);
    }
  };

  // 流式加载音频
  const startStreamingAudio = async (audioUrl: string) => {
    if (!sourceBufferRef.current || !mediaSourceRef.current) return;

    const fetchController = new AbortController();
    fetchControllerRef.current = fetchController;
    
    try {
      // 从URL中提取文件名
      const filename = audioUrl.split('/').pop();
      // 使用API进行流式传输
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/music/stream/${filename}`;
      
      let offset = 0;
      const CHUNK_SIZE = 1024 * 256; // 256KB 片段
      let isFirstChunk = true;

      // 加载下一个片段的函数
      const fetchNextChunk = async () => {
        try {
          const response = await fetch(apiUrl, {
            headers: {
              Range: `bytes=${offset}-${offset + CHUNK_SIZE - 1}`
            },
            signal: fetchController.signal
          });

          // 检查服务器是否支持范围请求
          if (response.status === 206 || response.status === 404) {
            const arrayBuffer = await response.arrayBuffer();
            const chunk = new Uint8Array(arrayBuffer);
            
            // 等待 sourceBuffer 准备好
            const appendBuffer = () => {
              if (sourceBufferRef.current?.updating) {
                setTimeout(appendBuffer, 50); // 等待 50ms 后再次尝试
                return;
              }
              
              try {
                // 添加缓冲区
                if (sourceBufferRef.current) {
                  sourceBufferRef.current.appendBuffer(chunk);
                }

                // 如果是第一个块，可以开始播放
                if (isFirstChunk && audioRef.current && isPlaying) {
                  audioRef.current.play().catch(e => {
                    console.error('播放失败:', e);
                    setIsPlaying(false);
                  });
                  isFirstChunk = false;
                }

                // 计算下一个片段的偏移量
                offset += chunk.length;

                // 获取总长度
                const contentRange = response.headers.get('Content-Range');
                const totalLength = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

                // 如果还有更多数据，加载下一个片段
                if (offset < totalLength) {
                  if (sourceBufferRef.current) {
                    if (sourceBufferRef.current.updating) {
                      sourceBufferRef.current.addEventListener('updateend', fetchNextChunk, { once: true });
                    } else {
                      fetchNextChunk();
                    }
                  }
                } else if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                  // 所有数据加载完成
                  setTimeout(() => {
                    if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                      try {
                        mediaSourceRef.current.endOfStream();
                      } catch (e) {
                        console.warn('结束媒体流时出错:', e);
                      }
                    }
                  }, 1000);
                }
              } catch (e) {
                console.error('添加缓冲区时出错:', e);
                // 如果发生错误，回退到传统播放方式
                setIsStreamingSupported(false);
                if (audioRef.current) {
                  audioRef.current.src = audioUrl;
                }
              }
            };

            appendBuffer();
          } else {
            console.warn('服务器不支持范围请求，将使用传统播放方式');
            setIsStreamingSupported(false);
            // 回退到直接使用 src
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('获取音频块时出错:', error);
            setIsStreamingSupported(false);
            // 回退到直接使用 src
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
            }
          }
        }
      };

      // 开始加载第一个片段
      fetchNextChunk();
    } catch (error) {
      console.error('流式加载音频时出错:', error);
      setIsStreamingSupported(false);
    }
  };

  // 切换播放/暂停状态
  const togglePlay = () => {
    // 如果要开始播放，先检查音频文件是否存在
    if (!isPlaying && audioRef.current) {
      // 只有在开始播放时检查音频文件是否存在
      fetch(currentTrack, { method: 'HEAD' })
        .then(response => {
          if (!response.ok && response.status !== 404) {
            throw new Error(`音频文件不存在 (${response.status})`)
          }
          // 文件存在，设置状态开始播放
          setIsPlaying(true);
          setReadyToPlay(true);
          setUserInteracted(true);
          
          // 如果支持流式播放，设置 MediaSource
          if (isStreamingSupported) {
            setupMediaSource();
          } else if (audioRef.current) {
            // 传统播放方式
            audioRef.current.src = currentTrack;
            audioRef.current.play().catch(e => {
              console.error('播放失败:', e);
              setIsPlaying(false);
            });
          }
        })
        .catch(error => {
          console.error("音频文件检查失败:", error)
          setAudioError(`音频文件检查失败: ${error.message}`)
          toast.error("音频文件检查失败", {
            description: error.message
          })
        })
    } else {
      // 如果是暂停操作，直接切换状态
      setIsPlaying(!isPlaying)
      if (!isPlaying) {
        setReadyToPlay(true)
      }
      setUserInteracted(true)
    }
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
  
  // 切换到下一个或上一个音频文件
  const switchTrack = (direction: 'next' | 'prev') => {
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % availableTracks.length
      : (currentIndex - 1 + availableTracks.length) % availableTracks.length
    
    const newTrack = availableTracks[newIndex].path
    
    // 先设置新的音轨路径，但暂时不开始播放
    setCurrentTrack(newTrack)
    setIsTrackChanging(true)
    setCurrentTime(0)
    setReadyToPlay(false)
    
    // 清理当前的 MediaSource
    if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
      try {
        mediaSourceRef.current.endOfStream();
      } catch (e) {
        console.warn('结束媒体流时出错:', e);
      }
    }
    
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    
    // 检查新音轨是否可用，仅在确认用户有意图播放时才进行
    if (isPlaying) {
      fetch(newTrack, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`音频文件不存在 (${response.status})`)
          }
          // 文件存在，设置状态开始播放
          setIsPlaying(true)
          setUserInteracted(true)
          
          // 如果支持流式播放，设置新的 MediaSource
          if (isStreamingSupported) {
            setupMediaSource();
          } else if (audioRef.current) {
            // 传统播放方式
            audioRef.current.src = newTrack;
            audioRef.current.play().catch(e => {
              console.error('播放失败:', e);
              setIsPlaying(false);
            });
          }
          
          toast.info(`已切换到: ${availableTracks[newIndex].name}`)
        })
        .catch(error => {
          console.error("音频文件检查失败:", error)
          setAudioError(`音频文件检查失败: ${error.message}`)
          setIsPlaying(false)
          toast.error("音频文件检查失败", {
            description: error.message
          })
        })
    } else {
      // 如果当前不是播放状态，只切换轨道但不开始播放
      toast.info(`已切换到: ${availableTracks[newIndex].name}`)
    }
  }
  
  const switchToNextTrack = () => switchTrack('next')
  const switchToPrevTrack = () => switchTrack('prev')
  
  // 清理 MediaSource 资源
  useEffect(() => {
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      
      if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
        try {
          mediaSourceRef.current.endOfStream();
        } catch (e) {
          console.warn('清理时结束媒体流出错:', e);
        }
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
          onEnded={switchToNextTrack}
          onError={handleAudioError}
          loop={false}
          hidden
          preload="none"
        />
      </div>
    </>
  );
} 