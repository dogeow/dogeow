'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { MusicPlayer } from './MusicPlayer'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel } from '@/components/launcher/AuthPanel'
import useAuthStore from '@/stores/authStore'
import { SearchDialog } from '@/components/search/SearchDialog'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useSearchManager } from '@/hooks/useSearchManager'
import { useBackgroundManager } from '@/hooks/useBackgroundManager'
import { AppsView } from './views/AppsView'
import { SearchResultView } from './views/SearchResultView'
import { ViewWrapper } from './views/ViewWrapper'
import { useMusicStore } from '@/stores/musicStore'
import { AiDialog } from '@/components/app/AiDialog'
import { useMediaKeys } from './hooks/useMediaKeys'
import { useMediaSession } from './hooks/useMediaSession'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

export function AppLauncher() {
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])

  // 使用音乐存储中的播放模式状态
  const { playMode, togglePlayMode } = useMusicStore()

  // 使用自定义 hooks
  const audioManager = useAudioManager()
  const searchManager = useSearchManager(pathname)
  const { backgroundImage, setBackgroundImage } = useBackgroundManager()

  // 解构 audioManager 的所有属性，避免 lint 误报
  const {
    audioRef,
    isPlaying,
    audioError,
    currentTime,
    duration,
    volume,
    isMuted,
    availableTracks,
    currentTrack,
    readyToPlay,
    setReadyToPlay,
    fetchAvailableTracks,
    setCurrentTrack,
    setupMediaSource,
    resetCurrentTime,
    switchTrack,
    togglePlay,
    toggleMute,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    getCurrentTrackName,
    formatTime,
  } = audioManager

  // 切换显示模式
  const toggleDisplayMode = useCallback(
    (mode: DisplayMode) => {
      setDisplayMode(mode)

      // 当切换到音乐模式时，加载音频列表并初始化音频源
      if (mode === 'music') {
        fetchAvailableTracks()

        // 检查播放列表状态 - 添加安全检查
        if (!availableTracks || availableTracks.length === 0) {
          // 播放列表为空，不需要设置音频源
          return
        }

        if (currentTrack && !audioRef.current?.src) {
          setupMediaSource()
        }
      }
    },
    [fetchAvailableTracks, availableTracks, currentTrack, audioRef, setupMediaSource]
  )

  const switchToNextTrack = useCallback(() => {
    // 根据播放模式决定播放行为
    if (playMode === 'one') {
      // 单曲循环：重新播放当前歌曲
      resetCurrentTime()
      const audioElement = audioRef.current
      if (audioElement) {
        audioElement.play().catch(console.error)
      }
    } else if (playMode === 'all') {
      // 列表循环：播放下一首，如果到末尾则重新开始
      switchTrack('next')
    } else {
      // 不循环：播放下一首，如果到末尾则停止
      switchTrack('next')
    }
  }, [playMode, resetCurrentTime, audioRef, switchTrack])
  const switchToPrevTrack = useCallback(() => switchTrack('prev'), [switchTrack])

  // 媒体键盘事件处理
  useMediaKeys({ togglePlay, switchToPrevTrack, switchToNextTrack })

  // Media Session API 支持
  useMediaSession({
    currentTrack,
    availableTracks,
    isPlaying,
    togglePlay,
    switchToPrevTrack,
    switchToNextTrack,
  })

  // 重置搜索结果
  const resetSearchResult = useCallback(() => {
    setDisplayMode('apps')
    searchManager.setSearchText('')
  }, [searchManager])

  // 渲染内容的配置
  const contentConfig = useMemo(
    () => ({
      music: {
        component: MusicPlayer,
        props: {
          isPlaying,
          audioError,
          currentTime,
          duration,
          volume,
          isMuted,
          availableTracks: availableTracks || [],
          currentTrack: currentTrack || '',
          playMode: playMode,
          analyserNode: audioManager.analyserNode,
          toggleMute,
          switchToPrevTrack,
          switchToNextTrack,
          togglePlay,
          handleProgressChange,
          getCurrentTrackName,
          formatTime,
          toggleDisplayMode,
          onTrackSelect: (trackPath: string) => setCurrentTrack?.(trackPath),
          onTogglePlayMode: () => {
            // 切换播放模式 - 只改变状态，下次生效
            togglePlayMode()
          },
        },
      },
      settings: {
        component: SettingsPanel,
        props: {
          toggleDisplayMode,
          backgroundImage,
          setBackgroundImage,
          customBackgrounds,
          setCustomBackgrounds,
        },
      },
      auth: {
        component: AuthPanel,
        props: { toggleDisplayMode },
      },
    }),
    [
      isPlaying,
      audioError,
      currentTime,
      duration,
      volume,
      isMuted,
      availableTracks,
      currentTrack,
      playMode,
      toggleMute,
      switchToPrevTrack,
      switchToNextTrack,
      togglePlay,
      handleProgressChange,
      getCurrentTrackName,
      formatTime,
      setCurrentTrack,
      toggleDisplayMode,
      togglePlayMode,
      backgroundImage,
      setBackgroundImage,
      customBackgrounds,
      audioManager.analyserNode,
    ]
  )

  const renderContent = () => {
    switch (displayMode) {
      case 'music': {
        const { component: Component, props } = contentConfig.music
        return (
          <ViewWrapper>
            <Component {...props} />
          </ViewWrapper>
        )
      }

      case 'settings': {
        const { component: Component, props } = contentConfig.settings
        return (
          <ViewWrapper>
            <Component {...props} />
          </ViewWrapper>
        )
      }

      case 'auth': {
        const { component: Component, props } = contentConfig.auth
        return (
          <ViewWrapper>
            <Component {...props} />
          </ViewWrapper>
        )
      }

      case 'apps':
        return (
          <AppsView
            router={router}
            searchManager={searchManager}
            isAuthenticated={isAuthenticated}
            toggleDisplayMode={toggleDisplayMode}
            onOpenAi={() => setIsAiDialogOpen(true)}
          />
        )

      case 'search-result':
        return (
          <SearchResultView searchText={searchManager.searchText} onReset={resetSearchResult} />
        )

      default:
        return null
    }
  }

  return (
    <>
      <AiDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} />
      <SearchDialog
        open={searchManager.isSearchDialogOpen}
        onOpenChange={searchManager.setIsSearchDialogOpen}
        initialSearchTerm={searchManager.searchTerm}
        currentRoute={!searchManager.isHomePage ? pathname : undefined}
      />

      <div
        id="app-launcher-bar"
        className="bg-background/80 relative z-50 flex h-full w-full flex-col px-2 backdrop-blur-md"
      >
        {renderContent()}

        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleAudioError}
          onEnded={switchToNextTrack}
          onCanPlay={() => setReadyToPlay(true)}
          loop={false}
          hidden
          preload="none"
          crossOrigin="anonymous"
          // 手机端特殊属性
          playsInline={true}
          webkit-playsinline="true"
          controls={false}
        />
      </div>
    </>
  )
}
