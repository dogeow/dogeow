import { useEffect } from 'react'

interface UseMediaKeysProps {
  togglePlay: () => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
}

export function useMediaKeys({
  togglePlay,
  switchToPrevTrack,
  switchToNextTrack,
}: UseMediaKeysProps) {
  // 媒体键盘事件处理
  useEffect(() => {
    const handleMediaKeyPress = (event: KeyboardEvent) => {
      // 检查是否为媒体键
      if (event.code === 'MediaPlayPause') {
        event.preventDefault()
        togglePlay()
      } else if (event.code === 'MediaTrackPrevious') {
        event.preventDefault()
        switchToPrevTrack()
      } else if (event.code === 'MediaTrackNext') {
        event.preventDefault()
        switchToNextTrack()
      }
    }

    window.addEventListener('keydown', handleMediaKeyPress)
    return () => window.removeEventListener('keydown', handleMediaKeyPress)
  }, [togglePlay, switchToPrevTrack, switchToNextTrack])
}
