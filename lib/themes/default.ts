/**
 * 默认主题配置
 * 基于当前 UI 设计的第一套主题
 */

import type { UITheme } from './types'

export const defaultTheme: UITheme = {
  id: 'default',
  name: '默认主题',
  description: '基于当前设计的默认 UI 主题',
  version: '1.0.0',

  layout: {
    header: {
      component: 'themes/default/Header',
      height: '50px',
      position: 'sticky',
      showLogo: true,
      showNavigation: true,
      showSearch: true,
      showUserMenu: true,
    },
    main: {
      maxWidth: '1280px', // max-w-7xl
      padding: '0',
      containerType: 'centered',
    },
  },

  styles: {
    cssVariables: {
      '--app-header-height': '50px',
    },
    componentVariants: {
      card: 'default',
      button: 'default',
      input: 'default',
      tile: 'default',
    },
  },

  components: {
    TileCard: 'components/app/TileCard',
    AppLauncher: 'components/launcher',
  },

  metadata: {
    tags: ['default', 'classic'],
  },
}
