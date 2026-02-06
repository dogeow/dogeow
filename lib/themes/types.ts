/**
 * UI 主题系统类型定义
 * 类似 WordPress 主题系统，支持完全不同的 UI 布局和样式
 */

// 主题配置接口
export interface UITheme {
  id: string
  name: string
  description?: string
  version?: string
  author?: string

  // 布局配置
  layout: {
    // Header 配置
    header: {
      component: string // 组件路径，如 'themes/default/Header'
      height: string // CSS 高度值
      position: 'sticky' | 'fixed' | 'static'
      showLogo: boolean
      showNavigation: boolean
      showSearch: boolean
      showUserMenu: boolean
    }

    // Sidebar 配置（可选）
    sidebar?: {
      component: string
      position: 'left' | 'right'
      width: string
      collapsible: boolean
      defaultCollapsed: boolean
    }

    // Footer 配置（可选）
    footer?: {
      component: string
      show: boolean
      height: string
    }

    // 主内容区域配置
    main: {
      maxWidth: string
      padding: string
      containerType: 'full' | 'centered' | 'sidebar'
    }
  }

  // 样式配置
  styles: {
    // CSS 变量覆盖
    cssVariables?: Record<string, string>

    // Tailwind 配置覆盖
    tailwindConfig?: {
      colors?: Record<string, string>
      borderRadius?: Record<string, string>
      spacing?: Record<string, string>
    }

    // 组件样式变体
    componentVariants?: {
      card?: 'default' | 'minimal' | 'glass' | 'bordered'
      button?: 'default' | 'minimal' | 'rounded' | 'square'
      input?: 'default' | 'minimal' | 'outlined'
      tile?: 'default' | 'compact' | 'large' | 'minimal'
    }
  }

  // 组件映射（允许替换特定组件）
  components?: {
    TileCard?: string
    AppLauncher?: string
    Navigation?: string
    [key: string]: string | undefined
  }

  // 元数据
  metadata?: {
    preview?: string // 预览图路径
    tags?: string[]
    compatible?: string[] // 兼容的主题 ID
  }
}

// 主题注册表
export interface ThemeRegistry {
  [themeId: string]: UITheme
}

// 主题切换选项
export interface ThemeSwitchOptions {
  preserveState?: boolean // 是否保留状态
  animate?: boolean // 是否使用过渡动画
  reload?: boolean // 是否需要重新加载
}
