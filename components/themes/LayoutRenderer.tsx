'use client'

import { useUITheme } from './UIThemeProvider'
import { AppLauncher } from '@/components/launcher'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { cn } from '@/lib/helpers'

/**
 * 动态布局渲染器
 * 根据当前选择的 UI 主题动态加载和渲染对应的布局组件
 */
export function LayoutRenderer({ children }: { children: React.ReactNode }) {
  const theme = useUITheme()
  const { backgroundImage } = useBackgroundStore()

  // 动态加载 Header 组件
  const HeaderComponent = useMemo(() => {
    if (!theme) return null

    const headerPath = theme.layout.header.component
    if (!headerPath) return null

    try {
      // 动态导入主题的 Header 组件
      // 格式：themes/{themeId}/Header -> components/themes/{themeId}/Header
      const componentPath = `components/${headerPath}`
      return dynamic(() => import(`@/${componentPath}`).catch(() => null), {
        ssr: false,
        loading: () => <DefaultHeaderFallback />,
      })
    } catch {
      return null
    }
  }, [theme])

  // 动态加载 Sidebar 组件
  const SidebarComponent = useMemo(() => {
    if (!theme?.layout.sidebar) return null

    const sidebarPath = theme.layout.sidebar.component
    if (!sidebarPath) return null

    try {
      const componentPath = `components/${sidebarPath}`
      return dynamic(() => import(`@/${componentPath}`).catch(() => null), {
        ssr: false,
      })
    } catch {
      return null
    }
  }, [theme])

  // 动态加载 Footer 组件
  const FooterComponent = useMemo(() => {
    if (!theme?.layout.footer) return null

    const footerPath = theme.layout.footer.component
    if (!footerPath) return null

    try {
      const componentPath = `components/${footerPath}`
      return dynamic(() => import(`@/${componentPath}`).catch(() => null), {
        ssr: false,
      })
    } catch {
      return null
    }
  }, [theme])

  if (!theme) {
    return <DefaultLayout>{children}</DefaultLayout>
  }

  const Header = HeaderComponent
  const Sidebar = SidebarComponent
  const Footer = FooterComponent

  // 根据主题配置渲染布局（整页使用同一背景，顶部用毛玻璃与内容区一致）
  return (
    <div
      className={cn('flex h-screen flex-col', backgroundImage && 'bg-cover bg-fixed bg-center')}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      data-theme-layout={theme.id}
    >
      {/* Header：整栏全宽、统一背景、延伸至左右边缘 */}
      {Header && (
        <header
          className={cn(
            'z-30 w-full flex-none border-b shadow-sm',
            'bg-background',
            theme.layout.header.position === 'fixed' && 'fixed top-0 right-0 left-0',
            theme.layout.header.position === 'sticky' && 'sticky top-0'
          )}
          style={{
            height: theme.layout.header.height,
          }}
        >
          <Header />
        </header>
      )}

      {/* 主内容区域 */}
      <div
        className={`flex min-h-0 flex-1 overflow-hidden ${
          theme.layout.header.position === 'fixed' ? 'pt-[var(--app-header-height)]' : ''
        }`}
      >
        {/* 左侧边栏 */}
        {Sidebar && theme.layout.sidebar?.position === 'left' && (
          <aside
            className="bg-background flex-none border-r"
            style={{ width: theme.layout.sidebar.width }}
          >
            <Sidebar />
          </aside>
        )}

        {/* 主内容 */}
        <main
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            maxWidth: theme.layout.main.maxWidth === '100%' ? '100%' : theme.layout.main.maxWidth,
            margin: 'auto',
          }}
        >
          {children}
        </main>

        {/* 右侧边栏 */}
        {Sidebar && theme.layout.sidebar?.position === 'right' && (
          <aside
            className="bg-background flex-none border-l"
            style={{ width: theme.layout.sidebar.width }}
          >
            <Sidebar />
          </aside>
        )}
      </div>

      {/* Footer */}
      {Footer && theme.layout.footer?.show && (
        <footer
          className="bg-background flex-none border-t"
          style={{ height: theme.layout.footer.height }}
        >
          <Footer />
        </footer>
      )}
    </div>
  )
}

// 默认布局回退（当前布局）
function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="header-container"
        className="bg-background/90 sticky top-0 z-30 h-[var(--app-header-height)] flex-none border-b shadow-sm backdrop-blur"
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
          <AppLauncher />
        </div>
      </div>
      <div id="main-container" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col p-0">{children}</div>
      </div>
    </>
  )
}

// Header 加载中的回退组件
function DefaultHeaderFallback() {
  return (
    <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
      <div className="bg-muted h-8 w-8 animate-pulse rounded" />
    </div>
  )
}
