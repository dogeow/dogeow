import React, { memo } from 'react'
import type { MusicPlayerProps } from '../types'

// 进度条组件
export const ProgressBar = memo(
  ({
    currentTime,
    duration,
    handleProgressChange,
  }: Pick<MusicPlayerProps, 'currentTime' | 'duration' | 'handleProgressChange'>) => {
    const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2)
    return (
      <>
        <div className="bg-primary/30 absolute bottom-0 left-0 h-1 w-full">
          <div
            className="bg-primary h-full transition-all duration-100"
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
          className="absolute bottom-0 left-0 h-1 w-full cursor-pointer opacity-0"
        />
      </>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
