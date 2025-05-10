'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

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
  src: string; // m3u8 地址
  onNext?: () => void;
  onPrev?: () => void;
  title?: string;
  autoPlay?: boolean;
}

const HLSMusicPlayer: React.FC<HLSMusicPlayerProps> = ({ 
  src,
  onNext,
  onPrev,
  title = '未知歌曲',
  autoPlay = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // 检测用户系统/浏览器
  const [isIOS, setIsIOS] = useState(false);
  
  // 初始化
  useEffect(() => {
    // 检测是否是 iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
  }, []);

  // 设置 HLS
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // 清理之前的实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    setError(null);
    
    const isAudioFile = src.endsWith('.mp3') || src.endsWith('.wav') || src.endsWith('.m4a');
    const isHLSFile = src.endsWith('.m3u8');
    
    if (isAudioFile) {
      // 普通音频文件直接设置 src
      audio.src = src;
      audio.load();
    } else if (isHLSFile) {
      // HLS 流处理
      if (Hls.isSupported()) {
        // PC/安卓：使用 hls.js
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          enableWorker: true,
        });
        
        hls.attachMedia(audio);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS 网络错误:', data);
                setError(`网络错误: ${data.details}`);
                hls.startLoad(); // 尝试恢复
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS 媒体错误:', data);
                setError(`媒体错误: ${data.details}`);
                hls.recoverMediaError(); // 尝试恢复
                break;
              default:
                console.error('HLS 致命错误:', data);
                setError(`播放错误: ${data.details}`);
                hls.destroy();
                break;
            }
          }
        });
        
        hlsRef.current = hls;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS：原生支持 HLS
        audio.src = src;
        audio.load();
      } else {
        // 不支持 HLS
        setError('您的浏览器不支持 HLS 播放');
      }
    } else {
      // 否则假设是普通音频链接
      audio.src = src;
      audio.load();
    }
    
    // 如果设置了自动播放，尝试播放
    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('自动播放失败:', error);
          setIsPlaying(false);
          
          // iOS 和某些浏览器需要用户交互才能播放
          if (isIOS) {
            setError('iOS 需要用户交互才能播放音频');
          } else {
            setError('自动播放失败，请点击播放按钮');
          }
        });
      }
    }
    
    // 清理函数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // 事件处理函数
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(null);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) onNext();
    };
    
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement.error) {
        setError(`播放错误: ${audioElement.error.message || audioElement.error.code}`);
      } else {
        setError('未知错误');
      }
      setIsPlaying(false);
    };
    
    // 监听事件
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      // 移除事件监听
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onNext]);
  
  // 播放状态控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('播放失败:', error);
          setIsPlaying(false);
          setError('播放失败，可能需要用户交互');
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);
  
  // 音量控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // 工具函数
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted) setIsMuted(false);
  };
  
  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVolumeControl = () => setShowVolumeControl(!showVolumeControl);

  // 进度百分比
  const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2);
  
  return (
    <div className="w-full bg-card border rounded-md shadow-sm p-4 flex flex-col gap-2">
      {/* 顶部信息和控制 */}
      <div className="flex justify-between items-center">
        <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-medium truncate">{title}</h3>
          {error && (
            <p className="text-xs text-destructive truncate mt-1">{error}</p>
          )}
        </div>
        
        <div className="relative">
          <PlayerControlButton 
            onClick={toggleVolumeControl}
            title={isMuted ? '取消静音' : '静音'}
            icon={isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          />
          
          {showVolumeControl && (
            <div className="absolute right-0 top-full mt-2 bg-popover p-2 rounded-md shadow-md z-10 w-32">
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 时间和进度条 */}
      <div className="space-y-1 w-full">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleProgressChange}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex justify-center items-center gap-2 mt-2">
        <PlayerControlButton 
          onClick={onPrev || (() => {})}
          disabled={!onPrev}
          title="上一首"
          icon={<SkipBack className="h-4 w-4" />}
        />
        
        <PlayerControlButton 
          onClick={togglePlay}
          disabled={!!error && !isIOS}
          title={isPlaying ? '暂停' : '播放'}
          icon={isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          className="h-10 w-10"
        />
        
        <PlayerControlButton 
          onClick={onNext || (() => {})}
          disabled={!onNext}
          title="下一首"
          icon={<SkipForward className="h-4 w-4" />}
        />
      </div>
      
      {/* 隐藏的音频元素 */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        playsInline 
      />
    </div>
  );
};

export default HLSMusicPlayer; 