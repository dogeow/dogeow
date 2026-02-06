/**
 * 极简主题配置
 * 展示完全不同的界面：极简设计、无边框、大留白
 */

import type { UITheme } from './types'

export const minimalTheme: UITheme = {
  id: 'minimal',
  name: '极简主题',
  description: '极简主义设计，去除多余元素，专注内容',
  version: '1.0.0',

  layout: {
    header: {
      component: 'themes/minimal/Header',
      height: '48px',
      position: 'sticky',
      showLogo: true,
      showNavigation: false,
      showSearch: false,
      showUserMenu: true,
    },
    main: {
      maxWidth: '1200px',
      padding: '3rem 2rem',
      containerType: 'centered',
    },
  },

  styles: {
    cssVariables: {
      '--app-header-height': '48px',
    },
    componentVariants: {
      card: 'minimal',
      button: 'minimal',
      input: 'minimal',
      tile: 'minimal',
    },
  },

  components: {
    TileCard: 'themes/minimal/TileCard',
  },

  metadata: {
    tags: ['minimal', 'clean', 'simple'],
  },
}
