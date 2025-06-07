"use client"

import React from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/ui/back-button'
import { MusicPlayerProps, PlayerControlButtonProps } from './types'

// 定义图标尺寸常量
const ICON_SIZE = "h-4 w-4"
const PLAY_BUTTON_SIZE = "h-8 w-8"

const PlayerControlButton = React.memo(({ 
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
));

PlayerControlButton.displayName = 'PlayerControlButton';

// 歌曲信息显示组件
const TrackInfo = React.memo(({ 
  isPlaying, 
  getCurrentTrackName, 
  currentTime, 
  duration, 
  formatTime 
}: Pick<MusicPlayerProps, 'isPlaying' | 'getCurrentTrackName' | 'currentTime' | 'duration' | 'formatTime'>) => (
  <div className="flex-1 overflow-hidden mx-1">
    <div className="overflow-hidden">
      {isPlaying ? (
        <div className="whitespace-nowrap overflow-hidden">
          <motion.span 
            className="text-sm font-medium inline-block"
            animate={{ 
              x: [0, -1000],
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: 3
            }}
            whileHover={{ 
              animationPlayState: 'paused'
            }}
            style={{
              animationPlayState: 'running'
            }}
          >
            {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
          </motion.span>
        </div>
      ) : (
        <span className="text-sm font-medium truncate block">
          {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      )}
    </div>
  </div>
));

TrackInfo.displayName = 'TrackInfo';

// 进度条组件
const ProgressBar = React.memo(({ 
  currentTime, 
  duration, 
  handleProgressChange 
}: Pick<MusicPlayerProps, 'currentTime' | 'duration' | 'handleProgressChange'>) => {
  const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2);
  
  return (
    <>
      <div className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full">
        <div 
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
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
  );
});

ProgressBar.displayName = 'ProgressBar';

export const MusicPlayer = React.memo(({
  isPlaying,
  audioError,
  currentTime,
  duration,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  volume,
  isMuted,
  toggleMute,
  switchToPrevTrack,
  switchToNextTrack,
  togglePlay,
  handleProgressChange,
  getCurrentTrackName,
  formatTime,
  toggleDisplayMode
}: MusicPlayerProps) => {
  return (
    <>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center shrink-0">
          <BackButton 
            onClick={() => toggleDisplayMode('apps')}
            title="返回启动台"
          />
        </div>
        
        <TrackInfo 
          isPlaying={isPlaying}
          getCurrentTrackName={getCurrentTrackName}
          currentTime={currentTime}
          duration={duration}
          formatTime={formatTime}
        />
        
        {audioError && (
          <div className="text-xs text-red-500 truncate">
            {audioError}
          </div>
        )}
        
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <PlayerControlButton 
            onClick={toggleMute}
            title={isMuted ? '取消静音' : '静音'}
            icon={isMuted ? <VolumeX className={ICON_SIZE} /> : <Volume2 className={ICON_SIZE} />}
          />
          
          <PlayerControlButton 
            onClick={switchToPrevTrack}
            disabled={!!audioError}
            title="上一首"
            icon={<SkipBack className={ICON_SIZE} />}
          />
          
          <PlayerControlButton 
            onClick={togglePlay}
            disabled={!!audioError}
            title={isPlaying ? '暂停' : '播放'}
            icon={isPlaying ? <Pause className={ICON_SIZE} /> : <Play className={ICON_SIZE} />}
            className={PLAY_BUTTON_SIZE}
          />
          
          <PlayerControlButton 
            onClick={switchToNextTrack}
            disabled={!!audioError}
            title="下一首"
            icon={<SkipForward className={ICON_SIZE} />}
          />
        </div>
      </div>
      
      <ProgressBar 
        currentTime={currentTime}
        duration={duration}
        handleProgressChange={handleProgressChange}
      />
    </>
  );
});

MusicPlayer.displayName = 'MusicPlayer';