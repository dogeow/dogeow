'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { CustomTheme } from '@/app/types'
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { useThemeStore } from '@/stores/themeStore'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { hexToHSL, fullscreen, exitFullscreen, isFullscreen } from '@/lib/helpers'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { AppsListView, ColorModeView, FullscreenView } from './SettingsDialogViews'
import {
  getSettingsSectionTitle,
  SettingsDialogSidebar,
  type SettingsSection,
} from './SettingsDialogSidebar'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backgroundImage: string
  setBackgroundImage: (url: string) => void
  customBackgrounds: { id: string; name: string; url: string }[]
  setCustomBackgrounds: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; url: string }[]>
  >
}

export function SettingsDialog({
  open,
  onOpenChange,
  backgroundImage,
  setBackgroundImage,
  customBackgrounds,
  setCustomBackgrounds,
}: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('color')
  const [fullscreenOn, setFullscreenOn] = useState(false)
  const [isMdScreen, setIsMdScreen] = useState(false)

  // 检测屏幕尺寸（md 断点：768px）
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMdScreen(window.innerWidth >= 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 同步实际全屏状态（用户按 ESC 或浏览器行为）
  useEffect(() => {
    const sync = () => setFullscreenOn(isFullscreen())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    document.addEventListener('mozfullscreenchange', sync)
    document.addEventListener('MSFullscreenChange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
      document.removeEventListener('mozfullscreenchange', sync)
      document.removeEventListener('MSFullscreenChange', sync)
    }
  }, [])

  // Theme store
  const { theme } = useTheme()
  const {
    themeMode,
    setThemeMode,
    restPeriod,
    setRestPeriod,
    currentTheme,
    customThemes,
    setCurrentTheme,
    addCustomTheme,
    removeCustomTheme,
    customCursorEnabled,
    setCustomCursorEnabled,
    themeTransitionEnabled,
    setThemeTransitionEnabled,
  } = useThemeStore()
  const { projectCoverMode, setProjectCoverMode } = useProjectCoverStore()
  const { siteLayout, setSiteLayout } = useLayoutStore()

  // Handle background
  const handleSetBackground = useCallback(
    (url: string) => {
      setBackgroundImage(url)
    },
    [setBackgroundImage]
  )

  const handleUploadBackground = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = event => {
        const url = event.target?.result as string
        const newBg = {
          id: `custom-${Date.now()}`,
          name: file.name,
          url,
        }
        setCustomBackgrounds(prev => [...prev, newBg])
        setBackgroundImage(url)
      }
      reader.readAsDataURL(file)
    },
    [setBackgroundImage, setCustomBackgrounds]
  )

  const handleSetTheme = useCallback(
    (themeId: string) => {
      setCurrentTheme(themeId)
    },
    [setCurrentTheme]
  )

  const handleAddTheme = useCallback(
    (name: string, color: string) => {
      const newTheme: CustomTheme = {
        id: `theme-${Date.now()}`,
        name,
        color,
        primary: hexToHSL(color),
      }
      addCustomTheme(newTheme)
      setCurrentTheme(newTheme.id)
    },
    [addCustomTheme, setCurrentTheme]
  )

  const handleRemoveTheme = useCallback(
    (id: string) => {
      removeCustomTheme(id)
    },
    [removeCustomTheme]
  )

  const handleFullscreenChange = useCallback(() => {
    try {
      if (fullscreenOn) {
        exitFullscreen()
      } else {
        fullscreen()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '全屏操作失败')
    }
  }, [fullscreenOn])

  const renderContent = () => {
    switch (activeSection) {
      case 'color':
        return (
          <ColorModeView
            themeMode={themeMode}
            resolvedTheme={theme}
            onThemeModeChange={setThemeMode}
            restPeriod={restPeriod}
            onRestPeriodChange={setRestPeriod}
            customCursorEnabled={customCursorEnabled}
            onCustomCursorChange={setCustomCursorEnabled}
            themeTransitionEnabled={themeTransitionEnabled}
            onThemeTransitionChange={setThemeTransitionEnabled}
          />
        )
      case 'background':
        return (
          <BackgroundView
            onBack={() => setActiveSection('color')}
            backgroundImage={backgroundImage}
            onSetBackground={handleSetBackground}
            customBackgrounds={customBackgrounds}
            onUploadBackground={handleUploadBackground}
            showBackButton={false}
          />
        )
      case 'theme':
        return (
          <ThemeView
            onBack={() => setActiveSection('color')}
            currentTheme={currentTheme}
            customThemes={customThemes}
            onSetTheme={handleSetTheme}
            onRemoveTheme={handleRemoveTheme}
            onAddTheme={handleAddTheme}
            showBackButton={false}
          />
        )
      case 'language':
        return <LanguageView onBack={() => setActiveSection('color')} showBackButton={false} />
      case 'apps':
        return (
          <AppsListView
            siteLayout={siteLayout}
            setSiteLayout={setSiteLayout}
            projectCoverMode={projectCoverMode}
            setProjectCoverMode={setProjectCoverMode}
          />
        )
      case 'fullscreen':
        return <FullscreenView fullscreenOn={fullscreenOn} onToggle={handleFullscreenChange} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/55 backdrop-blur-[1px]" />
      <DialogContent className="w-[90%] max-w-md overflow-hidden p-0">
        <div className="flex h-[60vh] min-h-[400px] w-full flex-col overflow-hidden">
          {/* 顶部标题栏 */}
          <div className="flex h-12 items-center justify-center border-b px-4">
            <DialogTitle className="text-base font-semibold">设置</DialogTitle>
          </div>

          {/* 左侧和右侧内容 */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* 左侧 sidebar */}
            <SettingsDialogSidebar
              activeSection={activeSection}
              isMdScreen={isMdScreen}
              onSelect={setActiveSection}
            />

            {/* 右侧内容 */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* 标题栏 */}
              <div className="flex h-10 shrink-0 items-center justify-center border-b px-4">
                <h2 className="text-sm font-medium">{getSettingsSectionTitle(activeSection)}</h2>
              </div>

              {/* 内容区域：min-h-0 使 flex 子项可收缩，ScrollArea 才能产生滚动 */}
              <ScrollArea className="min-h-0 flex-1 p-3">{renderContent()}</ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
