"use client"

import React from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/ui/back-button'

type DisplayMode = 'music' | 'apps' | 'settings';

// 播放控制按钮组件
interface PlayerControlButtonProps {
  onClick: () => void
  disabled?: boolean
  title?: string
  icon: React.ReactNode
  className?: string
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

// 音乐播放器组件的属性接口
export interface MusicPlayerProps {
  isPlaying: boolean
  audioError: string | null
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isVolumeControlVisible: boolean
  toggleVolumeControl: () => void
  toggleMute: () => void
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
  togglePlay: () => void
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getCurrentTrackName: () => string | undefined
  formatTime: (time: number) => string
  toggleDisplayMode: (mode: DisplayMode) => void
}

export function MusicPlayer({
  isPlaying,
  audioError,
  currentTime,
  duration,
  volume,
  isMuted,
  isVolumeControlVisible,
  toggleVolumeControl,
  toggleMute,
  handleVolumeChange,
  switchToPrevTrack,
  switchToNextTrack,
  togglePlay,
  handleProgressChange,
  getCurrentTrackName,
  formatTime,
  toggleDisplayMode
}: MusicPlayerProps) {
  // 计算进度条百分比
  const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2)
  
  return (
    <>
      <div className="w-full flex items-center justify-between">
        {/* 左侧：返回按钮 */}
        <div className="flex items-center shrink-0">
          <BackButton 
            onClick={() => toggleDisplayMode('apps')}
            title="返回音乐播放器"
          />
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
          
          {audioError && (
            <div className="text-xs text-red-500 truncate">
              {audioError}
            </div>
          )}
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
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
                    {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    <span className="sr-only">{isMuted ? '取消静音' : '静音'}</span>
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
          <PlayerControlButton 
            onClick={switchToPrevTrack}
            disabled={!!audioError}
            title="上一首"
            icon={<SkipBack className="h-4 w-4" />}
          />
          
          <PlayerControlButton 
            onClick={togglePlay}
            disabled={!!audioError}
            icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            srText={isPlaying ? '暂停' : '播放'}
            className="h-8 w-8"
          />
          
          <PlayerControlButton 
            onClick={switchToNextTrack}
            disabled={!!audioError}
            title="下一首"
            icon={<SkipForward className="h-4 w-4" />}
          />
        </div>
      </div>
      
      {/* 进度条 */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full"
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