'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { CustomTheme } from '@/app/types'
import type { ThemeMode, RestPeriod } from '@/stores/themeStore'
import { BottomHourPicker } from '@/components/ui/bottom-hour-picker'
import {
  Palette,
  Image as ImageIcon,
  Languages,
  Sun,
  LayoutGrid,
  BookOpen,
  Columns,
  Maximize2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { useThemeStore } from '@/stores/themeStore'
import {
  PROJECT_COVER_MODE_OPTIONS,
  useProjectCoverStore,
  type ProjectCoverMode,
} from '@/stores/projectCoverStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { hexToHSL, fullscreen, exitFullscreen, isFullscreen } from '@/lib/helpers'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export type SettingsSection = 'color' | 'background' | 'theme' | 'language' | 'apps' | 'fullscreen'

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

  const settingsItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: 'color', icon: <Sun className="h-4 w-4" />, label: '颜色' },
    { id: 'language', icon: <Languages className="h-4 w-4" />, label: '语言' },
    { id: 'theme', icon: <Palette className="h-4 w-4" />, label: '主题' },
    { id: 'background', icon: <ImageIcon className="h-4 w-4" />, label: '背景' },
    { id: 'apps', icon: <LayoutGrid className="h-4 w-4" />, label: 'APP列表' },
    // 只在中等及以上屏幕显示全屏选项（与 FullscreenView 的显示逻辑一致）
    ...(isMdScreen
      ? [{ id: 'fullscreen' as const, icon: <Maximize2 className="h-4 w-4" />, label: '全屏' }]
      : []),
  ]

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
            onBack={() => setActiveSection('color')}
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

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'color':
        return '颜色'
      case 'background':
        return '背景'
      case 'theme':
        return '主题'
      case 'language':
        return '语言'
      case 'apps':
        return 'APP列表'
      case 'fullscreen':
        return '全屏'
      default:
        return '设置'
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
            <div className="bg-muted/20 w-28 shrink-0 border-r">
              <ScrollArea className="h-full">
                <div className="flex flex-col p-1">
                  {settingsItems.map(item => {
                    const isSelected = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-2 rounded px-2 py-2 text-left transition-colors ${
                          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧内容 */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* 标题栏 */}
              <div className="flex h-10 shrink-0 items-center border-b px-4">
                <h2 className="text-sm font-medium">{getSectionTitle()}</h2>
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

interface ColorModeViewProps {
  themeMode: ThemeMode
  resolvedTheme?: string
  onThemeModeChange: (mode: ThemeMode) => void
  restPeriod: RestPeriod
  onRestPeriodChange: (startHour: number, endHour: number) => void
  customCursorEnabled: boolean
  onCustomCursorChange: (enabled: boolean) => void
  themeTransitionEnabled: boolean
  onThemeTransitionChange: (enabled: boolean) => void
}

function ColorModeView({
  themeMode,
  resolvedTheme,
  onThemeModeChange,
  restPeriod,
  onRestPeriodChange,
  customCursorEnabled,
  onCustomCursorChange,
  themeTransitionEnabled,
  onThemeTransitionChange,
}: ColorModeViewProps) {
  return (
    <div className="flex flex-col space-y-4">
      <p className="text-muted-foreground text-xs">
        选择外观模式；休息时段内自动深色，其余时间浅色。
      </p>
      <div className="flex flex-col gap-2">
        {[
          { mode: 'light' as const, label: '浅色' },
          { mode: 'dark' as const, label: '深色' },
          { mode: 'system' as const, label: '跟随系统' },
          { mode: 'rest' as const, label: '休息时段' },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onThemeModeChange(mode)}
            className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              themeMode === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {themeMode === 'rest' && (
        <>
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">休息时段设置</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
              <label htmlFor="dialog-rest-start" className="text-xs">
                开始
              </label>
              <BottomHourPicker
                id="dialog-rest-start"
                value={restPeriod.startHour}
                onChange={h => onRestPeriodChange(h, restPeriod.endHour)}
                label="开始"
                title="开始时间"
                className="h-8 min-w-[4.5rem] px-2"
              />
              <label htmlFor="dialog-rest-end" className="text-xs">
                结束
              </label>
              <BottomHourPicker
                id="dialog-rest-end"
                value={restPeriod.endHour}
                onChange={h => onRestPeriodChange(restPeriod.startHour, h)}
                label="结束"
                title="结束时间"
                className="h-8 min-w-[4.5rem] px-2"
              />
            </div>
          </div>
        </>
      )}
      <div className="border-t pt-3 hidden md:block">
        <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
          <span className="text-sm font-medium">自定义光标</span>
          <Switch
            id="custom-cursor"
            checked={customCursorEnabled}
            onCheckedChange={onCustomCursorChange}
            aria-label="切换自定义光标"
          />
        </div>
      </div>
      <div className="border-t pt-3">
        <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
          <span className="text-sm font-medium">主题切换渐变</span>
          <Switch
            id="theme-transition"
            checked={themeTransitionEnabled}
            onCheckedChange={onThemeTransitionChange}
            aria-label="切换主题渐变"
          />
        </div>
      </div>
    </div>
  )
}

interface FullscreenViewProps {
  fullscreenOn: boolean
  onToggle: () => void
}

function FullscreenView({ fullscreenOn, onToggle }: FullscreenViewProps) {
  return (
    <div className="hidden md:flex flex-col space-y-3">
      <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
        <span className="text-sm font-medium">全屏显示</span>
        <Switch checked={fullscreenOn} onCheckedChange={onToggle} aria-label="切换全屏" />
      </div>
      <p className="text-muted-foreground text-xs">开启后页面将全屏显示；也可按 ESC 退出全屏。</p>
    </div>
  )
}

// APP 列表视图组件
interface AppsListViewProps {
  onBack: () => void
  siteLayout: 'grid' | 'magazine' | 'icon'
  setSiteLayout: (layout: 'grid' | 'magazine' | 'icon') => void
  projectCoverMode: ProjectCoverMode
  setProjectCoverMode: (mode: ProjectCoverMode) => void
}

function AppsListView({
  onBack,
  siteLayout,
  setSiteLayout,
  projectCoverMode,
  setProjectCoverMode,
}: AppsListViewProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* 布局 */}
      <div className="flex w-full items-center gap-2 rounded-lg p-2">
        <Columns className="h-4 w-4 shrink-0" />
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setSiteLayout('grid')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            网格
          </button>
          <button
            onClick={() => setSiteLayout('magazine')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'magazine' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            杂志
          </button>
          <button
            onClick={() => setSiteLayout('icon')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'icon' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            图标
          </button>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 rounded-lg p-2">
        <BookOpen className="h-4 w-4" />
        <span className="text-xs">封面</span>
        <div className="flex flex-1 gap-1">
          {PROJECT_COVER_MODE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setProjectCoverMode(option.value)}
              className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                projectCoverMode === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
