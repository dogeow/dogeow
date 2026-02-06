/**
 * 侧边栏布局主题配置
 * 展示完全不同的界面布局
 */

import type { UITheme } from './types'

export const sidebarTheme: UITheme = {
  id: 'sidebar',
  name: '侧边栏布局',
  description: '带左侧边栏的经典布局，类似管理后台',
  version: '1.0.0',

  layout: {
    header: {
      component: 'themes/sidebar/Header',
      height: '60px',
      position: 'fixed',
      showLogo: true,
      showNavigation: false,
      showSearch: true,
      showUserMenu: true,
    },
    sidebar: {
      component: 'themes/sidebar/Sidebar',
      position: 'left',
      width: '240px',
      collapsible: true,
      defaultCollapsed: false,
    },
    main: {
      maxWidth: '100%',
      padding: '1.5rem',
      containerType: 'sidebar',
    },
  },

  styles: {
    cssVariables: {
      '--app-header-height': '60px',
      '--sidebar-width': '240px',
    },
    componentVariants: {
      card: 'bordered',
      button: 'minimal',
      input: 'outlined',
      tile: 'compact',
    },
  },

  components: {
    TileCard: 'themes/sidebar/TileCard',
  },

  metadata: {
    tags: ['sidebar', 'admin', 'classic'],
  },
}
