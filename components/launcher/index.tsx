'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { MusicPlayer } from './MusicPlayer'
import { SettingsPanel, CustomBackground } from './SettingsPanel'
import { useRouter, usePathname } from 'next/navigation'
import { AuthPanel } from '../auth/AuthPanel'
import useAuthStore from '@/stores/authStore'
import { SearchDialog } from '@/components/search/SearchDialog'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useSearchManager } from '@/hooks/useSearchManager'
import { useBackgroundManager } from '@/hooks/useBackgroundManager'
import { AppsView } from './views/AppsView'
import { SearchResultView } from './views/SearchResultView'
import { ViewWrapper } from './views/ViewWrapper'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

export function AppLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])

  // 使用自定义 hooks
  const audioManager = useAudioManager()
  const searchManager = useSearchManager(pathname)
  const { backgroundImage, setBackgroundImage } = useBackgroundManager()

  // 切换显示模式
  const toggleDisplayMode = useCallback(
    (mode: DisplayMode) => {
      setDisplayMode(mode)

      // 当切换到音乐模式时，加载音频列表并初始化音频源
      if (mode === 'music') {
        audioManager.fetchAvailableTracks()

        if (audioManager.currentTrack && !audioManager.audioRef.current?.src) {
          audioManager.setupMediaSource()
        }
      }
    },
    [audioManager]
  )

  const switchToNextTrack = useCallback(() => audioManager.switchTrack('next'), [audioManager])
  const switchToPrevTrack = useCallback(() => audioManager.switchTrack('prev'), [audioManager])

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
          isPlaying: audioManager.isPlaying,
          audioError: audioManager.audioError,
          currentTime: audioManager.currentTime,
          duration: audioManager.duration,
          volume: audioManager.volume,
          isMuted: audioManager.isMuted,
          toggleMute: audioManager.toggleMute,
          switchToPrevTrack,
          switchToNextTrack,
          togglePlay: audioManager.togglePlay,
          handleProgressChange: audioManager.handleProgressChange,
          getCurrentTrackName: audioManager.getCurrentTrackName,
          formatTime: audioManager.formatTime,
          toggleDisplayMode,
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
      audioManager,
      toggleDisplayMode,
      backgroundImage,
      setBackgroundImage,
      customBackgrounds,
      switchToPrevTrack,
      switchToNextTrack,
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
          ref={audioManager.audioRef}
          onLoadedMetadata={audioManager.handleLoadedMetadata}
          onTimeUpdate={audioManager.handleTimeUpdate}
          onError={audioManager.handleAudioError}
          onEnded={switchToNextTrack}
          onCanPlay={() => audioManager.setReadyToPlay(true)}
          loop={false}
          hidden
          preload="auto"
        />
      </div>
    </>
  )
}
