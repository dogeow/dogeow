'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import ProgressBar from '../../components/progress-bar';

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

interface MusicPlayerProps {
  src: string;
  autoPlay?: boolean;
  showControls?: boolean;
  externalAudioRef?: React.RefObject<HTMLAudioElement | null>;
}

const MusicPlayer = ({ src, autoPlay = false, showControls = true, externalAudioRef }: MusicPlayerProps) => {
  // 如果提供了外部audio元素引用，则使用它，否则创建本地引用
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || localAudioRef;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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
  
  // 处理音频初始化
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
      console.log('设置音频源:', processedUrl);
      
      try {
        // 直接设置音频源
        audioRef.current.src = processedUrl;
        audioRef.current.preload = "metadata";
        
        // 监听元数据加载事件
        const handleLoadedMetadata = () => {
          console.log('音频元数据已加载，时长:', audioRef.current?.duration);
          setIsLoading(false);
          setDuration(audioRef.current?.duration || 0);
          
          // 自动播放（如果设置）
          if (autoPlay && audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('自动播放失败:', err);
              setError('自动播放被浏览器阻止，请点击播放按钮');
            });
          }
        };
        
        // 监听错误事件
        const handleError = (e: Event) => {
          const error = audioRef.current?.error;
          console.error('音频加载失败:', e, error);
          const errorCode = error ? error.code : 'unknown';
          const errorMessage = error ? error.message : '未知错误';
          setError(`播放错误 (${errorCode}): ${errorMessage}`);
          setIsLoading(false);
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.addEventListener('error', handleError);
        
        // 加载音频
        audioRef.current.load();
        
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.removeEventListener('error', handleError);
          }
        };
      } catch (err) {
        console.error('设置音频源失败:', err);
        setError(`设置音频源失败: ${err}`);
        setIsLoading(false);
      }
    }, 300);
    
    // 清理函数
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlaying(false);
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

export default MusicPlayer; 