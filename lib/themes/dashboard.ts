/**
 * Dashboard 主题配置
 * 管理后台风格：固定 Header + 可折叠侧边栏 + 卡片网格布局
 */

import type { UITheme } from './types'

export const dashboardTheme: UITheme = {
  id: 'dashboard',
  name: '仪表板主题',
  description: '管理后台风格，带可折叠侧边栏和卡片网格布局',
  version: '1.0.0',

  layout: {
    header: {
      component: 'themes/dashboard/Header',
      height: '64px',
      position: 'fixed',
      showLogo: true,
      showNavigation: false,
      showSearch: true,
      showUserMenu: true,
    },
    sidebar: {
      component: 'themes/dashboard/Sidebar',
      position: 'left',
      width: '280px',
      collapsible: true,
      defaultCollapsed: false,
    },
    main: {
      maxWidth: '1200px',
      padding: '1.5rem',
      containerType: 'centered',
    },
  },

  styles: {
    cssVariables: {
      '--app-header-height': '64px',
      '--sidebar-width': '280px',
    },
    componentVariants: {
      card: 'glass',
      button: 'rounded',
      input: 'outlined',
      tile: 'grid',
    },
  },

  components: {
    TileCard: 'themes/dashboard/TileCard',
  },

  metadata: {
    tags: ['dashboard', 'admin', 'grid', 'glass'],
  },
}
