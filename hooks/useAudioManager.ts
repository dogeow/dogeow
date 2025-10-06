import { useState, useEffect, useCallback } from 'react'
import { useMusicStore, MusicTrack } from '@/stores/musicStore'
import { AudioController } from '@/components/launcher/AudioController'
import { apiRequest } from '@/lib/api'

export const useAudioManager = () => {
  const {
    currentTrack,
    volume: musicVolume,
    isPlaying: storeIsPlaying,
    playMode,
    setCurrentTrack,
    setAvailableTracks,
    setIsPlaying: setStoreIsPlaying,
    availableTracks,
  } = useMusicStore()

  const [isPlaying, setIsPlaying] = useState(storeIsPlaying)
  const [isMuted, setIsMuted] = useState(false)
  const [volume] = useState(musicVolume || 0.5)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)

  // 初始化音频控制器
  const audioController = AudioController({
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
    setIsTrackChanging,
    playMode,
    setIsMuted,
  })

  // 加载音频列表
  const fetchAvailableTracks = useCallback(async () => {
    try {
      const musicData = await apiRequest<MusicTrack[]>('/musics')
      setAvailableTracks(musicData)

      // 检查播放列表是否为空
      if (musicData.length === 0) {
        setAudioError('播放列表为空，没有可播放的音乐')
        setCurrentTrack('')
        setIsPlaying(false)
        return
      }

      const currentTrackValue = useMusicStore.getState().currentTrack
      if (musicData.length > 0) {
        // 如果当前曲目为空，或者当前曲目不在新的列表中，则设置第一个曲目
        if (!currentTrackValue || currentTrackValue === '') {
          setCurrentTrack(musicData[0].path)
        } else {
          // 检查当前曲目是否仍然有效
          const isValidTrack = musicData.some(track => track.path === currentTrackValue)
          if (!isValidTrack) {
            setCurrentTrack(musicData[0].path)
          }
        }
      }
    } catch (error) {
      console.error('加载音频列表失败:', error)
      setAudioError('加载音乐列表失败，请稍后重试')
    }
  }, [setAvailableTracks, setCurrentTrack, setAudioError, setIsPlaying])

  // 获取当前音频文件名称
  const getCurrentTrackName = useCallback(() => {
    if (!currentTrack) return '没有选择音乐'

    // 检查播放列表是否为空 - 添加安全检查
    if (!availableTracks || availableTracks.length === 0) {
      return '播放列表为空'
    }

    const trackInfo = availableTracks.find(
      track => track.path === currentTrack || currentTrack.includes(track.path)
    )

    if (trackInfo?.name) {
      return trackInfo.name
    }

    // 从路径中提取文件名
    const parts = currentTrack.split('/')
    const fileName = parts[parts.length - 1]

    return fileName.replace(/\.(mp3|wav|m4a|aac|ogg|flac)$/i, '').replace(/[_\-]/g, ' ')
  }, [currentTrack, availableTracks])

  // 格式化时间显示
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }, [])

  // 同步播放状态到store
  useEffect(() => {
    setStoreIsPlaying(isPlaying)
  }, [isPlaying, setStoreIsPlaying])

  // 监听全局用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
      }
    }

    const events = ['click', 'keydown', 'touchstart'] as const
    events.forEach(event => document.addEventListener(event, handleUserInteraction))

    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserInteraction))
    }
  }, [userInteracted])

  return {
    // 状态
    isPlaying,
    isMuted,
    volume,
    duration,
    currentTime,
    audioError,
    currentTrack,
    availableTracks,
    readyToPlay,
    setReadyToPlay,
    // 方法
    getCurrentTrackName,
    formatTime,
    fetchAvailableTracks,
    setCurrentTrack,
    // 音频控制器（包含toggleMute）
    ...audioController,
  }
}
