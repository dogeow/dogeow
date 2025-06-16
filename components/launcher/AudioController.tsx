"use client"

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
  setIsTrackChanging
}: AudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { currentTrack, setCurrentTrack, availableTracks } = useMusicStore()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  // 构建音频URL
  const buildAudioUrl = useCallback((track: string) => {
    if (track.startsWith('http://') || track.startsWith('https://')) {
      return track
    }
    const trackPath = track.startsWith('/') ? track.slice(1) : track
    const baseUrl = apiUrl?.endsWith('/') ? apiUrl : apiUrl + '/'
    return baseUrl + trackPath
  }, [apiUrl])

  // 设置音频源
  const setupMediaSource = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    try {
      const audioUrl = buildAudioUrl(currentTrack)
      
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = audioUrl
      audioRef.current.load()
      
      setAudioError(null)
      setIsTrackChanging(true)
    } catch (err) {
      setAudioError(`设置音频源失败: ${err}`)
      toast.error("音频源设置失败", { description: String(err) })
    }
  }, [currentTrack, buildAudioUrl, setAudioError, setIsTrackChanging])

  // 处理播放错误
  const handlePlayError = useCallback((error: Error) => {
    setIsPlaying(false)
    setReadyToPlay(false)
    setAudioError(`播放失败: ${error.message}`)
    toast.error("音乐播放失败", { description: error.message })
  }, [setIsPlaying, setReadyToPlay, setAudioError])

  // 监听currentTrack变化
  useEffect(() => {
    if (!currentTrack) return
    if (audioRef.current && (!audioRef.current.src || !audioRef.current.src.includes(currentTrack))) {
      setupMediaSource()
    }
  }, [currentTrack, setupMediaSource])

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
  }, [isTrackChanging, userInteracted, setReadyToPlay, setIsTrackChanging, isPlaying, setAudioError])

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
  const handleAudioError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget
    const errorCode = audio.error?.code ?? 'unknown'
    const errorMessage = audio.error?.message ?? 'Unknown error'
    
    setAudioError(`播放错误 (${errorCode}): ${errorMessage}`)
    setIsPlaying(false)
  }, [setAudioError, setIsPlaying])

  // 更新播放时间
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime])

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return
    
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
  }, [currentTrack, isPlaying, setupMediaSource, setIsPlaying, setAudioError])

  // 切换曲目
  const switchTrack = useCallback((direction: 'next' | 'prev') => {
    if (!currentTrack || !availableTracks.length) return
    
    audioRef.current?.pause()
    
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    const nextIndex = currentIndex === -1
      ? direction === 'next' ? 0 : availableTracks.length - 1
      : direction === 'next'
        ? (currentIndex + 1) % availableTracks.length
        : (currentIndex - 1 + availableTracks.length) % availableTracks.length
    
    setCurrentTrack(availableTracks[nextIndex].path)
    setAudioError(null)
    setIsPlaying(true)
    setupMediaSource()
  }, [currentTrack, availableTracks, setCurrentTrack, setAudioError, setIsPlaying, setupMediaSource])

  // 处理进度条
  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }, [setCurrentTime])

  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
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

  return {
    audioRef,
    togglePlay,
    switchTrack,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    setupMediaSource
  }
}