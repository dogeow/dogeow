'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { buildAudioUrl as buildAudioUrlHelper } from './audio/utils'

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
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const { currentTrack, availableTracks, setCurrentTrack } = useMusicStore()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  // 构建音频URL
  const buildAudioUrl = useCallback(
    (track: string) => {
      // 从路径中提取文件名
      // 获取文件名部分
      return buildAudioUrlHelper(track, apiUrl)
    },
    [apiUrl]
  )

  // 初始化 Web Audio API（用于音频可视化）
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

      if (!AudioContextClass) {
        return // Web Audio API 不支持，静默失败
      }

      const audioContext = new AudioContextClass()
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()
      const source = audioContext.createMediaElementSource(audioRef.current)

      // 配置 AnalyserNode
      analyser.fftSize = 64 // 频率分辨率
      analyser.smoothingTimeConstant = 0.8

      // 设置初始音量（使用当前的值）
      const currentVolume = isMuted ? 0 : volume
      gainNode.gain.value = currentVolume

      // 连接音频节点：source -> analyser -> gain -> destination
      // 这样静音只影响最终输出，不影响频谱分析和可视化
      source.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source
      gainNodeRef.current = gainNode
      setAnalyserNode(analyser) // 更新 state 以触发组件重新渲染

      console.log('AudioContext 初始化成功', {
        state: audioContext.state,
        volume: currentVolume,
        isMuted,
      })

      // 确保 AudioContext 是运行状态
      if (audioContext.state === 'suspended') {
        audioContext
          .resume()
          .then(() => {
            console.log('AudioContext 已恢复为运行状态')
          })
          .catch(err => {
            console.warn('AudioContext resume 失败:', err)
          })
      }
    } catch (error) {
      // 忽略错误，音频可视化是可选的
      console.warn('Web Audio API 初始化失败（可视化功能不可用）:', error)
    }
  }, [isMuted, volume])

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

      // 在 Web Audio 初始化前先按元素静音兜底，初始化后会切到 gain 控制
      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.muted = isMuted

      audioRef.current.load()

      // 注意：不在 setupMediaSource 中初始化 AudioContext
      // AudioContext 必须在用户手势后初始化（浏览器自动播放策略）
      // 将在用户点击播放时初始化

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

    const playAudio = async () => {
      // 如果没有初始化 AudioContext，现在初始化（用户手势触发）
      if (!audioContextRef.current && audioRef.current && audioRef.current.src) {
        try {
          initAudioContext()

          // 等待 AudioContext 初始化完成
          await new Promise(resolve => setTimeout(resolve, 50))

          // 确保 AudioContext 是运行状态
          const ctx = audioContextRef.current as AudioContext | null
          if (ctx && ctx.state === 'suspended') {
            await ctx.resume()
          }

          // 设置 GainNode 音量
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : volume
          }

          // 播放音频
          if (audioRef.current) {
            await audioRef.current.play()
          }
        } catch (err) {
          console.error('初始化 AudioContext 失败:', err)
          // 如果 Web Audio API 失败，回退到普通播放
          if (audioRef.current) {
            audioRef.current.play().catch(handlePlayError)
          }
        }
        return
      }

      // 如果已经初始化，确保 AudioContext 是运行状态
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume()
          } catch (err) {
            console.warn('AudioContext resume 失败:', err)
          }
        }

        // 确保 GainNode 音量正确
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isMuted ? 0 : volume
        }
      }

      // 播放音频
      if (audioRef.current) {
        audioRef.current.play().catch(handlePlayError)
      }
    }

    if (isPlaying && readyToPlay && userInteracted) {
      playAudio()
    } else if (!isPlaying) {
      audioRef.current.pause()
    }
  }, [isPlaying, userInteracted, readyToPlay, handlePlayError, initAudioContext, isMuted, volume])

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

      // 手动切换时总是循环（最后一首时点击下一首会循环到第一首）
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
    const targetVolume = isMuted ? 0 : volume

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = targetVolume
    }

    if (audioRef.current) {
      if (gainNodeRef.current) {
        // Web Audio 已接管输出时，不再把元素本身静音，否则会让分析节点也拿到静音数据
        audioRef.current.volume = volume
        audioRef.current.muted = false
      } else {
        // 兜底：未初始化 Web Audio 时仍使用元素静音
        audioRef.current.volume = targetVolume
        audioRef.current.muted = isMuted
      }
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

  // 用真实媒体事件回写播放状态，避免 UI 与实际音频状态脱节
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      if (!audio.ended) {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [setIsPlaying])

  // 静音只影响最终输出，不应暂停播放或中断可视化
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (!audioRef.current) {
      return
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : volume
      audioRef.current.volume = volume
      audioRef.current.muted = false
      return
    }

    audioRef.current.volume = nextMuted ? 0 : volume
    audioRef.current.muted = nextMuted
  }, [isMuted, volume, setIsMuted])

  // 重置当前播放时间
  const resetCurrentTime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [])

  return {
    audioRef,
    analyserNode, // 导出 analyser 用于可视化（使用 state）
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
