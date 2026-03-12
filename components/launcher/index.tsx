'use client'

import React, { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MusicPlayer } from './MusicPlayer'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel, AuthDialog } from '@/components/launcher/AuthPanel'
import useAuthStore from '@/stores/authStore'
import { SearchDialog } from '@/components/search/SearchDialog'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useSearchManager } from '@/hooks/useSearchManager'
import { useBackgroundManager } from '@/hooks/useBackgroundManager'
import { AppsView } from './views/AppsView'
import { SearchResultView } from './views/SearchResultView'
import { ViewWrapper } from './views/ViewWrapper'
import { useMusicStore, type PlayMode } from '@/stores/musicStore'
import { useMediaKeys } from './hooks/useMediaKeys'
import { useMediaSession } from './hooks/useMediaSession'
import { AudioVisualizer } from './music/visualizer'
import { FullscreenVisualizer } from './music/FullscreenVisualizer'
import { SettingsDialog } from './settings/SettingsDialog'
import { useTrackLyrics } from './music/useTrackLyrics'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

export interface AppLauncherProps {
  /** 点击 AI 按钮时切换通用 AI 面板（打开/关闭） */
  onOpenAi?: () => void
  /** 点击视觉 AI 按钮时由主题 Header 打开视觉 AI 面板 */
  onOpenVisionAi?: () => void
  /** 由主题 Header 传入：AI 是否打开，用于 logo 点击时先关闭 AI */
  isAiOpen?: boolean
  /** 由主题 Header 传入：关闭 AI 的回调 */
  onCloseAi?: () => void
}

export function AppLauncher({
  onOpenAi,
  onOpenVisionAi: _onOpenVisionAi,
  isAiOpen: isAiOpenFromParent,
  onCloseAi,
}: AppLauncherProps = {}) {
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const isAiOpen = isAiOpenFromParent ?? isAiDialogOpen
  const closeAi = onCloseAi ?? (() => setIsAiDialogOpen(false))
  const toggleAi = onOpenAi ?? (() => setIsAiDialogOpen(prev => !prev))
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  const [isFullscreenViz, setIsFullscreenViz] = useState(false)
  // 使用音乐存储中的播放模式状态
  const { playMode, setPlayMode } = useMusicStore()

  // 使用自定义 hooks
  const audioManager = useAudioManager()
  const searchManager = useSearchManager(pathname)
  const { backgroundImage, setBackgroundImage } = useBackgroundManager()

  // 解构 audioManager 的所有属性，避免 lint 误报
  const {
    audioRef,
    isPlaying,
    audioError,
    isLoadingTracks,
    currentTime,
    duration,
    volume,
    isMuted,
    availableTracks,
    currentTrack,
    readyToPlay,
    setReadyToPlay,
    fetchAvailableTracks,
    setIsPlaying,
    setCurrentTrack,
    setupMediaSource,
    resetCurrentTime,
    switchTrack,
    togglePlay,
    toggleMute,
    markUserInteracted,
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
      // 设置单独使用对话框，不再切换 displayMode
      if (mode === 'settings') {
        setIsSettingsDialogOpen(true)
        return
      }

      // 登录使用对话框
      if (mode === 'auth') {
        setIsAuthDialogOpen(true)
        return
      }

      setDisplayMode(mode)

      // 当切换到音乐模式时，只加载音频列表，不改当前播放状态
      if (mode === 'music') {
        fetchAvailableTracks()
      }
    },
    [fetchAvailableTracks]
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
    } else {
      // 列表循环、不循环、随机播放：播放下一首，如果到末尾则循环到第一首
      switchTrack('next')
    }
  }, [playMode, resetCurrentTime, audioRef, switchTrack])
  const switchToPrevTrack = useCallback(() => switchTrack('prev'), [switchTrack])
  const handleFullscreenTrackPlay = useCallback(
    (trackPath: string) => {
      markUserInteracted()

      if (trackPath === currentTrack) {
        if (!audioRef.current?.src) {
          setupMediaSource()
          setIsPlaying(true)
          return
        }

        togglePlay()
        return
      }

      setCurrentTrack?.(trackPath)
      setIsPlaying(true)
    },
    [
      markUserInteracted,
      currentTrack,
      audioRef,
      setupMediaSource,
      setCurrentTrack,
      setIsPlaying,
      togglePlay,
    ]
  )
  const {
    currentLyric,
    lyrics,
    activeLyricIndex,
    status: lyricsStatus,
  } = useTrackLyrics(currentTrack || '', currentTime)
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
          isLoadingTracks,
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
          togglePlay: () => {
            markUserInteracted()
            togglePlay()
          },
          handleProgressChange,
          getCurrentTrackName,
          currentLyric,
          lyrics,
          activeLyricIndex,
          lyricsStatus,
          formatTime,
          toggleDisplayMode,
          onTrackSelect: (trackPath: string) => setCurrentTrack?.(trackPath),
          onSetPlayMode: (mode: PlayMode) => setPlayMode(mode),
          onOpenFullscreen: () => setIsFullscreenViz(true),
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
    }),
    [
      isPlaying,
      audioError,
      isLoadingTracks,
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
      currentLyric,
      lyrics,
      activeLyricIndex,
      lyricsStatus,
      formatTime,
      setCurrentTrack,
      toggleDisplayMode,
      setPlayMode,
      markUserInteracted,
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

      case 'apps':
        return (
          <AppsView
            router={router}
            searchManager={searchManager}
            isAuthenticated={isAuthenticated}
            toggleDisplayMode={toggleDisplayMode}
            onOpenAi={toggleAi}
            isAiOpen={isAiOpen}
            onCloseAi={closeAi}
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
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
      <SearchDialog
        open={searchManager.isSearchDialogOpen}
        onOpenChange={searchManager.setIsSearchDialogOpen}
        initialSearchTerm={searchManager.searchTerm}
        currentRoute={!searchManager.isHomePage ? pathname : undefined}
      />

      {/* 设置对话框 */}
      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        backgroundImage={backgroundImage}
        setBackgroundImage={setBackgroundImage}
        customBackgrounds={customBackgrounds}
        setCustomBackgrounds={setCustomBackgrounds}
      />

      {/* 全屏音频可视化 */}
      {isFullscreenViz && (
        <FullscreenVisualizer
          analyserNode={audioManager.analyserNode}
          isPlaying={isPlaying}
          isMuted={isMuted}
          trackName={getCurrentTrackName() || '未知曲目'}
          onClose={() => setIsFullscreenViz(false)}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onPrevTrack={switchToPrevTrack}
          onNextTrack={switchToNextTrack}
          availableTracks={availableTracks || []}
          currentTrack={currentTrack || ''}
          onTrackPlay={handleFullscreenTrackPlay}
          onTrackSelect={(trackPath: string) => {
            if (trackPath === currentTrack) {
              togglePlay()
              return
            }

            setCurrentTrack?.(trackPath)
            setIsPlaying(true)
          }}
          playMode={playMode}
          onSetPlayMode={setPlayMode}
          currentTime={currentTime}
          duration={duration}
          handleProgressChange={handleProgressChange}
          formatTime={formatTime}
          lyrics={lyrics}
          activeLyricIndex={activeLyricIndex}
          lyricsStatus={lyricsStatus}
        />
      )}

      <div
        id="app-launcher-bar"
        className="bg-background/80 relative z-50 flex h-full w-full flex-col backdrop-blur-md"
      >
        {/* 音频可视化 - 作为背景层，覆盖整个 app-launcher-bar，包括 padding */}
        {displayMode === 'music' && audioManager.analyserNode && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <AudioVisualizer
              analyserNode={audioManager.analyserNode}
              isPlaying={isPlaying}
              type="bars"
              barCount={40}
              barGap={2}
              barColor="rainbow"
              showGradient={false}
              fitWidth={true}
              className="h-full w-full"
            />
          </div>
        )}

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
