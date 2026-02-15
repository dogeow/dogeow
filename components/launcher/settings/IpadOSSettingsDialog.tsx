'use client'

import React, { useState, useCallback } from 'react'
import {
  Palette,
  Image,
  Grid,
  Languages,
  Sun,
  ChevronRight,
  AppWindow,
  Monitor,
  LayoutGrid,
  BookOpen,
  Columns,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { useThemeStore } from '@/stores/themeStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { ScrollArea } from '@/components/ui/scroll-area'

export type SettingsSection =
  | 'appearance'
  | 'background'
  | 'theme'
  | 'language'
  | 'layout'
  | 'covers'
  | 'system'
  | 'apps'

interface IpadOSSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backgroundImage: string
  setBackgroundImage: (url: string) => void
  customBackgrounds: { id: string; name: string; url: string }[]
  setCustomBackgrounds: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; url: string }[]>
  >
}

export function IpadOSSettingsDialog({
  open,
  onOpenChange,
  backgroundImage,
  setBackgroundImage,
  customBackgrounds,
  setCustomBackgrounds,
}: IpadOSSettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')

  // Theme store
  const { theme, setTheme } = useTheme()
  const { followSystem, setFollowSystem, showProjectCovers, setShowProjectCovers } = useThemeStore()
  const { siteLayout, setSiteLayout } = useLayoutStore()

  const mounted = typeof window !== 'undefined'

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

  // Handle theme
  const [customThemes, setCustomThemes] = useState<{ id: string; name: string; color: string }[]>(
    []
  )
  const handleSetTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme as 'light' | 'dark' | 'system')
    },
    [setTheme]
  )

  const handleAddTheme = useCallback((name: string, color: string) => {
    const newTheme = {
      id: `theme-${Date.now()}`,
      name,
      color,
    }
    setCustomThemes(prev => [...prev, newTheme])
  }, [])

  const handleRemoveTheme = useCallback((id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id))
  }, [])

  // Settings items - only show appearance in sidebar
  const settingsItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: 'appearance', icon: <Monitor className="h-4 w-4" />, label: '外观' },
  ]

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'background':
        return (
          <BackgroundView
            onBack={() => setActiveSection('appearance')}
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
            onBack={() => setActiveSection('appearance')}
            currentTheme={theme || 'system'}
            customThemes={customThemes}
            onSetTheme={handleSetTheme}
            onRemoveTheme={handleRemoveTheme}
            onAddTheme={handleAddTheme}
            showBackButton={false}
          />
        )
      case 'language':
        return <LanguageView onBack={() => setActiveSection('appearance')} showBackButton={false} />
      case 'apps':
        return (
          <AppsListView
            onBack={() => setActiveSection('appearance')}
            siteLayout={siteLayout}
            setSiteLayout={setSiteLayout}
            showProjectCovers={showProjectCovers}
            setShowProjectCovers={setShowProjectCovers}
          />
        )
      default:
        return (
          <div className="flex flex-col space-y-2">
            {/* 外观 - 跟随系统/浅色/深色模式 */}
            <div className="flex w-full items-center gap-2 rounded-lg p-2">
              <Sun className="h-4 w-4 shrink-0" />
              <div className="flex flex-1 gap-1">
                <button
                  onClick={() => setFollowSystem(true)}
                  className={`min-w-0 shrink-0 rounded px-2 py-1.5 text-sm whitespace-nowrap transition-colors ${
                    followSystem ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  跟随系统
                </button>
                <button
                  onClick={() => {
                    setFollowSystem(false)
                    setTheme('light')
                  }}
                  className={`min-w-0 shrink-0 rounded px-2 py-1.5 text-sm whitespace-nowrap transition-colors ${
                    !followSystem && theme === 'light'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  浅色
                </button>
                <button
                  onClick={() => {
                    setFollowSystem(false)
                    setTheme('dark')
                  }}
                  className={`min-w-0 shrink-0 rounded px-2 py-1.5 text-sm whitespace-nowrap transition-colors ${
                    !followSystem && theme === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  深色
                </button>
              </div>
            </div>

            {/* 语言 */}
            <SettingsItem
              icon={<Languages className="h-4 w-4" />}
              label="语言"
              onClick={() => setActiveSection('language')}
              trailing={<ChevronRight className="text-muted-foreground h-3 w-3" />}
            />

            {/* 主题 */}
            <SettingsItem
              icon={<Palette className="h-4 w-4" />}
              label="主题"
              onClick={() => setActiveSection('theme')}
              trailing={<ChevronRight className="text-muted-foreground h-3 w-3" />}
            />

            {/* 背景 */}
            <SettingsItem
              icon={<Image className="h-4 w-4" />}
              label="背景"
              onClick={() => setActiveSection('background')}
              trailing={<ChevronRight className="text-muted-foreground h-3 w-3" />}
            />

            {/* APP列表 */}
            <SettingsItem
              icon={<LayoutGrid className="h-4 w-4" />}
              label="APP列表"
              onClick={() => setActiveSection('apps')}
              trailing={<ChevronRight className="text-muted-foreground h-3 w-3" />}
            />
          </div>
        )
    }
  }

  // Get section title
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'background':
        return '背景'
      case 'theme':
        return '主题'
      case 'language':
        return '语言'
      case 'apps':
        return 'APP列表'
      case 'appearance':
        return '外观'
      default:
        return '设置'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-md overflow-hidden p-0">
        <div className="flex h-[60vh] min-h-[400px] w-full flex-col overflow-hidden">
          {/* 顶部标题栏 */}
          <div className="flex h-12 items-center justify-center border-b px-4">
            <h2 className="text-sm font-semibold">设置</h2>
          </div>

          {/* 左侧和右侧内容 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧 sidebar */}
            <div className="bg-muted/20 w-24 shrink-0 border-r">
              <ScrollArea className="h-full">
                <div className="flex flex-col p-1">
                  {settingsItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors ${
                        activeSection === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧内容 */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* 标题栏 */}
              <div className="flex h-10 items-center border-b px-4">
                {activeSection !== 'appearance' && (
                  <button
                    onClick={() => setActiveSection('appearance')}
                    className="hover:bg-muted mr-2 flex h-5 w-5 items-center justify-center rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                )}
                <h2 className="text-sm font-medium">{getSectionTitle()}</h2>
              </div>

              {/* 内容区域 */}
              <ScrollArea className="flex-1 p-3">{renderContent()}</ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Settings Item component
interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  trailing?: React.ReactNode
}

function SettingsItem({ icon, label, onClick, trailing }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-muted flex w-full items-center gap-2 rounded-lg p-2 transition-colors"
    >
      {icon}
      <span className="flex-1 text-left text-sm">{label}</span>
      {trailing}
    </button>
  )
}

// APP 列表视图组件
interface AppsListViewProps {
  onBack: () => void
  siteLayout: 'grid' | 'magazine'
  setSiteLayout: (layout: 'grid' | 'magazine') => void
  showProjectCovers: boolean
  setShowProjectCovers: (show: boolean) => void
}

function AppsListView({
  onBack,
  siteLayout,
  setSiteLayout,
  showProjectCovers,
  setShowProjectCovers,
}: AppsListViewProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* 布局 */}
      <div className="flex w-full items-center gap-2 rounded-lg p-2">
        <Columns className="h-4 w-4 shrink-0" />
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setSiteLayout('grid')}
            className={`flex-1 rounded px-2 py-1 text-sm transition-colors ${
              siteLayout === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            网格
          </button>
          <button
            onClick={() => setSiteLayout('magazine')}
            className={`flex-1 rounded px-2 py-1 text-sm transition-colors ${
              siteLayout === 'magazine' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            杂志
          </button>
        </div>
      </div>

      {/* 显示封面 */}
      <SettingsItem
        icon={<BookOpen className="h-4 w-4" />}
        label="显示封面"
        onClick={() => setShowProjectCovers(!showProjectCovers)}
        trailing={
          <div className="bg-primary flex h-5 w-9 items-center rounded-full p-0.5">
            <div
              className={`bg-background h-3.5 w-3.5 rounded-full shadow-md transition-transform ${
                showProjectCovers ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        }
      />
    </div>
  )
}
