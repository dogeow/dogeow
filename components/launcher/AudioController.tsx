'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'

interface AudioControllerProps {
  volume: number
  isMuted: boolean
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setReadyToPlay: (ready: boolean) => void
  setAudioError: (error: string | null) => void
  isPlaying: boolean
  readyToPlay: boolean
  userInteracted: boolean
  isTrackChanging: boolean
  setIsTrackChanging: (changing: boolean) => void
  playMode: 'none' | 'all' | 'one' | 'shuffle'
  setIsMuted: (isMuted: boolean) => void
}

export function AudioController({
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
}: AudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { currentTrack, availableTracks, setCurrentTrack } = useMusicStore()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  // 构建音频URL
  const buildAudioUrl = useCallback(
    (track: string) => {
      if (track.startsWith('http://') || track.startsWith('https://')) {
        return track
      }

      // 从路径中提取文件名
      const trackPath = track.startsWith('/') ? track.slice(1) : track
      const filename = trackPath.split('/').pop() // 获取文件名部分
      const baseUrl = apiUrl?.endsWith('/') ? apiUrl : apiUrl + '/'
      const finalUrl = baseUrl + 'musics/' + filename

      return finalUrl
    },
    [apiUrl]
  )

  // 设置音频源
  const setupMediaSource = useCallback(() => {
    if (!audioRef.current || !currentTrack) {
      console.log('setupMediaSource: 缺少audioRef或currentTrack', {
        hasAudioRef: !!audioRef.current,
        currentTrack,
      })
      return
    }

    try {
      const audioUrl = buildAudioUrl(currentTrack)

      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = audioUrl
      // 记录当前源，用于避免非切歌情况下的重复初始化
      try {
        if (audioRef.current.dataset) {
          audioRef.current.dataset.trackSrc = audioUrl
        }
      } catch {
        // 忽略 dataset 写入失败
      }

      // 设置初始音量状态
      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.muted = isMuted

      audioRef.current.load()

      setAudioError(null)
      setIsTrackChanging(true)
    } catch (err) {
      console.error('setupMediaSource: 设置音频源失败', err)
      setAudioError(`设置音频源失败: ${err}`)
      toast.error('音频源设置失败', { description: String(err) })
    }
  }, [currentTrack, buildAudioUrl, setAudioError, setIsTrackChanging, isMuted, volume])

  // 处理播放错误
  const handlePlayError = useCallback(
    (error: Error) => {
      setIsPlaying(false)
      setReadyToPlay(false)
      setAudioError(`播放失败: ${error.message}`)
      toast.error('音乐播放失败', { description: error.message })
    },
    [setIsPlaying, setReadyToPlay, setAudioError]
  )

  // 监听currentTrack变化（仅在真正切歌时初始化媒体源）
  useEffect(() => {
    if (!currentTrack) return
    if (!audioRef.current) return

    const desiredUrl = buildAudioUrl(currentTrack)

    // 优先使用我们记录的 trackSrc，避免因函数依赖变化导致误触发
    let currentMarkedSrc: string | null = null
    try {
      currentMarkedSrc = audioRef.current.dataset?.trackSrc ?? null
    } catch {
      currentMarkedSrc = null
    }

    const currentElementSrc = audioRef.current.src
    const isSameByMark = currentMarkedSrc === desiredUrl
    const isSameByElement = !!currentElementSrc && currentElementSrc === desiredUrl

    if (!isSameByMark && !isSameByElement) {
      setupMediaSource()
    }
  }, [currentTrack, buildAudioUrl, setupMediaSource])

  // 处理播放/暂停
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying && readyToPlay && userInteracted) {
      audioRef.current.play().catch(handlePlayError)
    } else if (!isPlaying) {
      audioRef.current.pause()
    }
  }, [isPlaying, userInteracted, readyToPlay, handlePlayError])

  // 监听音轨变化
  useEffect(() => {
    if (!isTrackChanging || !audioRef.current || !userInteracted) return

    const audio = audioRef.current

    const handleCanPlay = () => {
      setReadyToPlay(true)
      setIsTrackChanging(false)

      if (isPlaying && audio) {
        audio.play().catch(err => setAudioError(`播放失败: ${err.message}`))
      }

      audio.removeEventListener('canplay', handleCanPlay)
    }

    audio.addEventListener('canplay', handleCanPlay)
    return () => audio.removeEventListener('canplay', handleCanPlay)
  }, [
    isTrackChanging,
    userInteracted,
    setReadyToPlay,
    setIsTrackChanging,
    isPlaying,
    setAudioError,
  ])

  // 更新音频状态
  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return

    setDuration(audioRef.current.duration)
    setAudioError(null)

    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(err => setAudioError(`播放失败: ${err.message}`))
    }
  }, [isPlaying, setDuration, setAudioError])

  // 处理音频错误
  const handleAudioError = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const audio = e.currentTarget
      const errorCode = audio.error?.code ?? 'unknown'
      const errorMessage = audio.error?.message ?? 'Unknown error'

      setAudioError(`播放错误 (${errorCode}): ${errorMessage}`)
      setIsPlaying(false)
    },
    [setAudioError, setIsPlaying]
  )

  // 更新播放时间
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime])

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    // 检查播放列表是否为空 - 添加安全检查
    if (!availableTracks || availableTracks.length === 0) {
      setAudioError('播放列表为空，没有可播放的音乐')
      toast.error('播放列表为空', { description: '请先添加音乐文件到播放列表' })
      return
    }

    if (!audioRef.current.src) {
      setupMediaSource()
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => setAudioError(`播放失败: ${err.message}`))
      setIsPlaying(true)
    }
  }, [currentTrack, isPlaying, setupMediaSource, setIsPlaying, setAudioError, availableTracks])

  // 切换曲目 - 基于播放模式
  const switchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      if (!currentTrack || !availableTracks.length) {
        if (availableTracks.length === 0) {
          setAudioError('播放列表为空，没有可播放的音乐')
          // 移除toast调用，避免依赖问题
        }
        return
      }

      audioRef.current?.pause()

      const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
      let nextIndex = -1

      if (playMode === 'shuffle') {
        // 随机播放模式
        if (direction === 'next') {
          // 随机选择下一首，避免重复当前歌曲
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        } else {
          // 随机选择上一首，避免重复当前歌曲
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        }
      } else {
        // 顺序播放模式
        if (direction === 'next') {
          nextIndex = (currentIndex + 1) % availableTracks.length
        } else {
          nextIndex = (currentIndex - 1 + availableTracks.length) % availableTracks.length
        }
      }

      // 根据循环模式决定是否继续播放
      if (
        playMode === 'none' &&
        direction === 'next' &&
        currentIndex === availableTracks.length - 1
      ) {
        // 不循环模式且到达末尾，停止播放
        setIsPlaying(false)
        setAudioError(null)
        return
      }

      setCurrentTrack(availableTracks[nextIndex].path)
      setAudioError(null)
      setIsPlaying(true)
      setupMediaSource()
    },
    [
      currentTrack,
      availableTracks,
      playMode,
      setCurrentTrack,
      setAudioError,
      setIsPlaying,
      setupMediaSource,
    ]
  )

  // 处理进度条
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value)
      setCurrentTime(newTime)
      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    },
    [setCurrentTime]
  )

  // 同步音量 - 修复手机端静音问题
  useEffect(() => {
    if (audioRef.current) {
      const targetVolume = isMuted ? 0 : volume
      audioRef.current.volume = targetVolume

      // 手机端额外处理：确保静音状态立即生效
      if (isMuted) {
        audioRef.current.muted = true
      } else {
        audioRef.current.muted = false
      }

      // 音量同步完成
    }
  }, [volume, isMuted])

  // 监听播放结束
  useEffect(() => {
    const audio = audioRef.current

    const handleAudioEnded = () => {
      setCurrentTime(0)
      switchTrack('next')
    }

    audio?.addEventListener('ended', handleAudioEnded)
    return () => audio?.removeEventListener('ended', handleAudioEnded)
  }, [setCurrentTime, switchTrack])

  // 检测是否为移动设备
  const isMobileDevice = useCallback(() => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )
  }, [])

  // 专门的静音切换函数 - 确保手机端兼容性
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMutedState = !isMuted
      const isMobile = isMobileDevice()

      // 更新状态
      setIsMuted(newMutedState)

      // 同时设置volume和muted属性，确保在所有设备上都能正常工作
      if (newMutedState) {
        audioRef.current.volume = 0
        audioRef.current.muted = true

        // 手机端额外处理：暂停播放以确保静音效果
        if (isMobile && !audioRef.current.paused) {
          audioRef.current.pause()
          // 记录暂停状态，稍后恢复
          audioRef.current.dataset.wasPlaying = 'true'
        }
      } else {
        audioRef.current.muted = false
        audioRef.current.volume = volume

        // 手机端额外处理：如果之前是播放状态，恢复播放
        if (isMobile && audioRef.current.dataset.wasPlaying === 'true') {
          // 保存当前播放时间，避免进度重置
          const currentTime = audioRef.current.currentTime

          // 恢复播放，但保持当前进度
          audioRef.current
            .play()
            .then(() => {
              // 确保进度没有被重置
              if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
                audioRef.current.currentTime = currentTime
              }
            })
            .catch(console.error)

          audioRef.current.dataset.wasPlaying = 'false'
        }
      }

      // 静音切换完成
    }
  }, [isMuted, volume, isMobileDevice, setIsMuted])

  // 重置当前播放时间
  const resetCurrentTime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [])

  return {
    audioRef,
    togglePlay,
    switchTrack,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    setupMediaSource,
    toggleMute,
    resetCurrentTime,
  }
}
