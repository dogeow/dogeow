'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import ProgressBar from '../../components/progress-bar';
import axios from 'axios';

interface PlayerControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  icon: React.ReactNode;
  className?: string;
}

const PlayerControlButton = ({ 
  onClick, 
  disabled, 
  title, 
  icon, 
  className = "h-7 w-7" 
}: PlayerControlButtonProps) => (
  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
    <Button 
      variant="ghost" 
      size="icon" 
      className={className} 
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      <span className="sr-only">{title}</span>
    </Button>
  </motion.div>
);

interface HLSMusicPlayerProps {
  src: string;
  autoPlay?: boolean;
  showControls?: boolean;
  externalAudioRef?: React.RefObject<HTMLAudioElement | null>;
}

const HLSMusicPlayer = ({ src, autoPlay = false, showControls = true, externalAudioRef }: HLSMusicPlayerProps) => {
  // 如果提供了外部audio元素引用，则使用它，否则创建本地引用
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || localAudioRef;
  const hlsRef = useRef<Hls | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [streamInfo, setStreamInfo] = useState<any>(null);

  // 处理播放地址，确保它是完整URL
  const processUrl = (urlStr: string) => {
    try {
      // 检查是否需要添加API前缀
      if (urlStr.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return `${baseUrl}${urlStr}`;
      }
      
      // 检查是否已经是完整URL
      const url = new URL(urlStr);
      return url.toString();
    } catch (e) {
      // 如果不是有效URL，假设它是相对路径
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return `${baseUrl}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
    }
  };
  
  // 处理HLS直播初始化
  useEffect(() => {
    if (!src) return;
    
    setIsLoading(true);
    setError(null);
    
    // 添加一个短延迟，确保音频元素已经完全渲染
    setTimeout(() => {
      if (!audioRef.current) {
        setError('音频元素未初始化，请刷新页面重试');
        setIsLoading(false);
        return;
      }
      
      const processedUrl = processUrl(src);
      console.log('处理后的HLS地址:', processedUrl);
      
      // 检查是否支持HLS
      if (Hls.isSupported()) {
        const destroyHls = () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
        };
        
        // 清理旧的HLS实例
        destroyHls();
        
        // 创建新的HLS实例，增加额外配置
        const hls = new Hls({
          debug: true, // 开启调试模式以便更好排查问题
          enableWorker: false, // 在某些情况下，禁用worker可以避免某些问题
          xhrSetup: (xhr, url) => {
            // 设置CORS头部
            xhr.withCredentials = false;
            // 设置请求头以支持CORS
            xhr.setRequestHeader('Origin', window.location.origin);
            xhr.setRequestHeader('Accept', 'application/vnd.apple.mpegurl');
          },
          // 增加重试和超时配置
          manifestLoadingTimeOut: 20000, // 增加超时时间
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000
        });
        hlsRef.current = hls;
        
        // 添加事件监听器
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('HLS媒体已成功附加到音频元素');
          try {
            hls.loadSource(processedUrl);
          } catch (err) {
            console.error('加载HLS源失败:', err);
            setError(`加载HLS源失败: ${err}`);
            setIsLoading(false);
          }
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log('HLS清单已解析:', data);
          setStreamInfo({
            levels: data.levels,
            audioTracks: data.audioTracks
          });
          setIsLoading(false);
          if (autoPlay && audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('自动播放失败:', err);
              setError('自动播放被浏览器阻止，请点击播放按钮');
            });
          }
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS错误:', data);
          
          // 特别记录CORS相关错误
          if (data.response && data.response.code === 0) {
            console.warn('可能的CORS错误:', {
              url: data.context ? data.context.url : 'unknown',
              status: data.response.code,
              details: data.details
            });
          }
          
          // 特殊处理attachMedia错误
          if (data.details && (
              String(data.details).includes('frag') || 
              String(data.details).includes('buffer') || 
              String(data.details).includes('codec') ||
              String(data.details).includes('switch'))) {
            console.warn('尝试恢复media错误:', data.details);
            hls.recoverMediaError();
            return;
          }
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // 尝试恢复网络错误
                console.log('网络错误，尝试恢复...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                // 尝试恢复媒体错误
                console.log('媒体错误，尝试恢复...');
                hls.recoverMediaError();
                break;
              default:
                // 无法恢复的错误
                console.error('致命错误，无法恢复:', data);
                destroyHls();
                setError(`播放错误: ${data.details || '未知错误'}`);
                setIsLoading(false);
                break;
            }
          } else {
            // 非致命错误，显示但继续播放
            console.warn('非致命HLS错误:', data);
          }
        });
        
        // 添加调试信息获取
        const fetchDebugInfo = async () => {
          try {
            const debugUrl = `${processedUrl}${processedUrl.includes('?') ? '&' : '?'}debug=1`;
            const response = await axios.get(debugUrl, {
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml',
                'Content-Type': 'application/json',
                'Origin': window.location.origin
              },
              withCredentials: false // 不需要凭证
            });
            console.log('HLS调试信息已获取', response.data);
          } catch (err) {
            console.warn('获取HLS调试信息失败', err);
          }
        };
        
        // 获取调试信息（仅开发环境）
        if (process.env.NODE_ENV === 'development') {
          fetchDebugInfo().catch(console.error);
        }
        
        try {
          // 附加到音频元素
          console.log('尝试附加HLS到音频元素...');
          if (!audioRef.current) {
            throw new Error('音频元素丢失，无法附加媒体');
          }
          hls.attachMedia(audioRef.current);
        } catch (err) {
          console.error('附加媒体失败:', err);
          setError(`附加媒体失败: ${err}`);
          setIsLoading(false);
          destroyHls();
        }
        
        // 清理函数
        return destroyHls;
      } else {
        // 原生HLS支持 (Safari等)
        try {
          if (!audioRef.current) {
            setError('音频元素未初始化');
            setIsLoading(false);
            return;
          }
          
          audioRef.current.src = processedUrl;
          audioRef.current.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoPlay) {
              audioRef.current?.play().catch(err => {
                console.error('原生HLS自动播放失败:', err);
                setError('自动播放被浏览器阻止，请点击播放按钮');
              });
            }
          });
          
          audioRef.current.addEventListener('error', (e) => {
            console.error('原生HLS错误:', e);
            setError(`播放错误: ${audioRef.current?.error?.message || '未知错误'}`);
            setIsLoading(false);
          });
          
          return () => {
            if (audioRef.current) {
              audioRef.current.src = '';
            }
          };
        } catch (err) {
          console.error('设置原生HLS播放失败:', err);
          setError(`设置原生HLS播放失败: ${err}`);
          setIsLoading(false);
          return undefined;
        }
      }
    }, 300); // 添加短延迟确保DOM已加载
    
    // 清理函数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);
  
  // 处理音频元素事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const handleDurationChange = () => setDuration(audio.duration);
    const handleVolumeChange = () => {
      setVolume(audio.volume);
      setIsMuted(audio.muted);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('播放失败:', err);
        setError(`播放错误: ${err.message}`);
      });
    }
  };
  
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !audio.muted;
  };
  
  const handleVolumeChange = (newVolume: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const vol = newVolume[0];
    audio.volume = vol;
    
    if (vol === 0) {
      audio.muted = true;
    } else if (audio.muted) {
      audio.muted = false;
    }
  };
  
  // 格式化时间为mm:ss格式
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleSeek = (newProgress: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const seekTime = (newProgress[0] / 100) * duration;
    audio.currentTime = seekTime;
  };
  
  // 显示错误状态
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
        <h3 className="text-red-700 dark:text-red-300 font-medium">播放器错误</h3>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button 
            className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
          
          <button 
            className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm"
            onClick={() => setError(null)}
          >
            重试播放
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
            <p className="font-medium mb-1">调试信息:</p>
            <pre>源: {src}</pre>
            <pre>处理后的地址: {processUrl(src)}</pre>
            <a 
              href={`${processUrl(src)}${processUrl(src).includes('?') ? '&' : '?'}debug=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline block mt-2"
            >
              查看HLS调试信息
            </a>
            
            {/* 提供常见问题解决方案 */}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium mb-1">常见问题:</p>
              <ul className="list-disc list-inside">
                <li>确保服务端返回正确的Content-Type: application/vnd.apple.mpegurl</li>
                <li>检查m3u8文件是否符合HLS规范</li>
                <li>确保TS文件可以访问（路径正确且存在）</li>
                <li>检查是否存在CORS跨域问题</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-50 dark:bg-gray-800 rounded-md">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">正在加载音频...</span>
      </div>
    );
  }
  
  return (
    <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm">
      {/* 仅当没有外部audio元素时才创建 */}
      {!externalAudioRef && <audio ref={localAudioRef} preload="metadata" />}
      
      {showControls && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <div className="flex-1">
              <ProgressBar 
                progress={progress} 
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  const bar = e.currentTarget;
                  const rect = bar.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek([percent * 100]);
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSMusicPlayer; 