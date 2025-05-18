"use client"

import { useEffect, useRef, useState } from 'react'
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
  const hlsInstanceRef = useRef<{ hls: any; destroy: () => void } | null>(null)
  
  const { currentTrack, setCurrentTrack, availableTracks } = useMusicStore()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  // 监听currentTrack变化
  useEffect(() => {
    if (!currentTrack) return
    
    // 检查当前音频是否已加载，如果未加载则加载
    if (audioRef.current && (!audioRef.current.src || !audioRef.current.src.includes(currentTrack))) {
      setupMediaSource()
    }
  }, [currentTrack])
  
  // 处理播放/暂停
  useEffect(() => {
    if (!audioRef.current) return
    
    if (isPlaying && readyToPlay && userInteracted) {
      audioRef.current.play().catch(error => {
        console.error("播放失败:", error)
        setIsPlaying(false)
        setReadyToPlay(false)
        setAudioError(`播放失败: ${error.message}`)
        toast.error("音乐播放失败", {
          description: error.message
        })
      })
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlaying, userInteracted, readyToPlay, setIsPlaying, setReadyToPlay, setAudioError])
  
  // 监听全局用户交互
  useEffect(() => {
    // 已在父组件处理
    return () => {}
  }, [])
  
  // 监听音轨变化，在元数据加载后准备播放
  useEffect(() => {
    if (!isTrackChanging || !audioRef.current || !userInteracted) return
    
    const handleCanPlay = () => {
      console.log('音频可以播放了', audioRef.current?.src)
      setReadyToPlay(true)
      setIsTrackChanging(false)
      
      // 如果状态是播放状态，尝试自动播放
      if (isPlaying && audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('canplay 事件后播放失败:', err)
          setAudioError(`播放失败: ${err.message}`)
        })
      }
      
      audioRef.current?.removeEventListener('canplay', handleCanPlay)
    }
    
    audioRef.current.addEventListener('canplay', handleCanPlay)
    return () => audioRef.current?.removeEventListener('canplay', handleCanPlay)
  }, [isTrackChanging, userInteracted, setReadyToPlay, setIsTrackChanging, isPlaying])
  
  // 监听currentTrack变化，确保音频源正确加载
  useEffect(() => {
    if (!currentTrack) return
    
    console.log('监听到 currentTrack 变化:', currentTrack)
    
    // 构建预期的URL
    let expectedUrl = ''
    if (currentTrack.startsWith('http://') || currentTrack.startsWith('https://')) {
      expectedUrl = currentTrack
    } else {
      const trackPath = currentTrack.startsWith('/') ? currentTrack.slice(1) : currentTrack
      const baseUrl = apiUrl?.endsWith('/') ? apiUrl : apiUrl + '/'
      expectedUrl = baseUrl + trackPath
    }
    
    // 检查当前音频URL是否与预期URL匹配
    const currentSrc = audioRef.current?.src || ''
    
    // 简化URL比较，去除可能的域名差异
    const needsReload = !currentSrc.includes(currentTrack.replace(/^\//, ''))
    
    if (audioRef.current && needsReload) {
      console.log('当前音频与预期不匹配，重新加载音频源', {
        当前URL: currentSrc,
        预期URL: expectedUrl
      })
      setupMediaSource()
    }
  }, [currentTrack, apiUrl])
  
  // 检查音频是否支持HLS格式
  const isHlsCompatible = (trackPath: string | null): boolean => {
    if (!trackPath) return false
    // 检查是否是m3u8格式
    return trackPath.toLowerCase().endsWith('.m3u8')
  }

  // 更新音频状态 - 处理音频元素的各种事件
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log('音频元数据已加载:', {
        duration: audioRef.current.duration,
        src: audioRef.current.src
      })
      
      setDuration(audioRef.current.duration)
      setAudioError(null)
      
      // 如果处于播放状态，尝试播放
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(err => {
          console.error('元数据加载后播放失败:', err)
          setAudioError(`播放失败: ${err.message}`)
        })
      }
    }
  }

  // 处理音频错误
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget
    console.error('音频播放错误:', audio.error, {
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState
    })
    
    // 获取更详细的错误信息
    const errorCode = audio.error ? audio.error.code : 'unknown'
    const errorMessage = audio.error ? audio.error.message : 'Unknown error'
    
    setAudioError(`播放错误 (${errorCode}): ${errorMessage}`)
    setIsPlaying(false)
    
    // 尝试使用直接播放模式作为回退方案
    if (currentTrack && isHlsCompatible(currentTrack) && hlsInstanceRef.current) {
      console.log('HLS播放失败，尝试直接播放原始文件')
      
      // 清理HLS实例
      hlsInstanceRef.current.destroy()
      hlsInstanceRef.current = null
      
      // 尝试直接播放源文件
      if (audioRef.current) {
        audioRef.current.src = currentTrack
        audioRef.current.load()
      }
    }
  }

  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  // 设置音频源
  const setupMediaSource = () => {
    if (!audioRef.current || !currentTrack) {
      console.warn('无法设置音频源：audioRef 或 currentTrack 不存在')
      return
    }
    
    console.log('设置音频源:', currentTrack)
    
    // 确保先清理
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy()
      hlsInstanceRef.current = null
    }
    
    // 设置音频
    try {
      // 构建音频URL - 确保正确处理路径
      // 首先检查currentTrack是否已经是完整URL
      let audioUrl = ''
      
      if (currentTrack.startsWith('http://') || currentTrack.startsWith('https://')) {
        audioUrl = currentTrack
      } else {
        // 去除开头的斜杠，避免双斜杠问题
        const trackPath = currentTrack.startsWith('/') ? currentTrack.slice(1) : currentTrack
        
        // 确保apiUrl以斜杠结尾
        const baseUrl = apiUrl?.endsWith('/') ? apiUrl : apiUrl + '/'
        
        // 构建完整URL
        audioUrl = baseUrl + trackPath
      }
      
      console.log('完整音频URL:', audioUrl)
      
      // 完全重置音频元素
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      
      // 设置音频元素的源
      audioRef.current.src = audioUrl
      audioRef.current.load()
      
      // 重置错误状态
      setAudioError(null)
      
      // 设置是否正在切换音轨的状态
      setIsTrackChanging(true)
      
      // 直接设置音量
      audioRef.current.volume = isMuted ? 0 : volume
      
    } catch (err) {
      console.error('设置音频源失败:', err)
      setAudioError(`设置音频源失败: ${err}`)
      toast.error("音频源设置失败", {
        description: String(err)
      })
    }
  }

  // 切换播放/暂停状态
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return
    
    // 如果音频还未加载，先加载
    if (!audioRef.current.src) {
      setupMediaSource()
    }
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // 确保音量正确设置
      audioRef.current.volume = isMuted ? 0 : volume
      
      audioRef.current.play().catch((err) => {
        console.error('播放失败:', err)
        setAudioError(`播放失败: ${err.message}`)
      })
      
      setIsPlaying(true)
    }
  }
  
  // 切换曲目
  const switchTrack = (direction: 'next' | 'prev') => {
    if (!currentTrack) return
    
    // 如果没有曲目，不执行任何操作
    if (!availableTracks.length) return
    
    // 确保先停止当前播放
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    // 查找当前曲目在列表中的位置
    const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
    
    // 如果当前曲目不在列表中，使用第一首或最后一首
    let nextIndex
    if (currentIndex === -1) {
      nextIndex = direction === 'next' ? 0 : availableTracks.length - 1
    } else {
      // 计算下一首/上一首索引，循环播放
      nextIndex = direction === 'next'
        ? (currentIndex + 1) % availableTracks.length
        : (currentIndex - 1 + availableTracks.length) % availableTracks.length
    }
    
    // 输出调试信息
    console.log('切换曲目:', {
      当前曲目: currentTrack,
      当前索引: currentIndex,
      方向: direction,
      下一索引: nextIndex,
      下一曲目: availableTracks[nextIndex].path
    })
    
    // 设置新的当前曲目
    setCurrentTrack(availableTracks[nextIndex].path)
    
    // 更新状态
    setAudioError(null)
    setIsPlaying(true)
    
    // 立即设置新的音频源，不使用 setTimeout
    setupMediaSource()
    
    // 为确保音频源已加载，可以监听 canplay 事件再播放
    // 在 useEffect 中已设置了监听
  }

  // 处理进度条拖动
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }
  
  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])
  
  // 监听音频播放结束
  useEffect(() => {
    const handleAudioEnded = () => {
      console.log('音频播放已结束')
      
      // 重置播放状态但保留音轨
      setCurrentTime(0)
      
      // 自动切换到下一曲
      switchTrack('next')
    }
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnded)
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded)
      }
    }
  }, [currentTrack, setCurrentTime])
  
  // 在组件卸载时清理HLS实例
  useEffect(() => {
    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy()
        hlsInstanceRef.current = null
      }
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
    setupMediaSource
  }
} 