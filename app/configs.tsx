import { PRESET_THEME_COLORS } from '@/lib/constants/theme-colors'
import { homeGridLayout, homeTiles } from './home-configs'

// 控制台Logo文本
const LOGO_TEXT = `
╔╦╗┌─┐┌─┐┌─┐╔═╗╦ ╦
 ║║│ ││ ┬├┤ ║ ║║║║
═╩╝└─┘└─┘└─┘╚═╝╚╩╝
` as const

// 开发环境控制台输出（仅客户端执行一次）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const hasLogged = '__dogeow_console_logged__' as const
  const globalWindow = window as unknown as Window & { [key: string]: boolean }
  if (!globalWindow[hasLogged]) {
    globalWindow[hasLogged] = true
    requestIdleCallback(
      () => {
        console.log(`%c${LOGO_TEXT}`, 'color: yellow')
        console.log('🎯 本地开发环境')
      },
      { timeout: 2000 }
    )
  }
}

// 游戏列表配置
const GAMES = [
  {
    id: 'rpg',
    nameKey: 'game.rpg',
    descriptionKey: 'game.rpg.desc',
    icon: '⚔️',
  },
  {
    id: 'sliding-puzzle',
    nameKey: 'game.sliding-puzzle',
    descriptionKey: 'game.sliding-puzzle.desc',
    icon: '🧩',
  },
  {
    id: 'picture-puzzle',
    nameKey: 'game.picture-puzzle',
    descriptionKey: 'game.picture-puzzle.desc',
    icon: '🖼️',
  },
  {
    id: 'jigsaw-puzzle',
    nameKey: 'game.jigsaw-puzzle',
    descriptionKey: 'game.jigsaw-puzzle.desc',
    icon: '🧩',
  },
  {
    id: 'shooting-range',
    nameKey: 'game.shooting-range',
    descriptionKey: 'game.shooting-range.desc',
    icon: '🎯',
    hideOnMobile: true,
  },
  { id: 'maze', nameKey: 'game.maze', descriptionKey: 'game.maze.desc', icon: '🌀' },
  { id: 'bowling', nameKey: 'game.bowling', descriptionKey: 'game.bowling.desc', icon: '🎳' },
  { id: 'tetris', nameKey: 'game.tetris', descriptionKey: 'game.tetris.desc', icon: '🧱' },
  { id: '2048', nameKey: 'game.2048', descriptionKey: 'game.2048.desc', icon: '🔢' },
  { id: 'snake', nameKey: 'game.snake', descriptionKey: 'game.snake.desc', icon: '🐍' },
  {
    id: 'minesweeper',
    nameKey: 'game.minesweeper',
    descriptionKey: 'game.minesweeper.desc',
    icon: '💣',
  },
  {
    id: 'tic-tac-toe',
    nameKey: 'game.tic-tac-toe',
    descriptionKey: 'game.tic-tac-toe.desc',
    icon: '⭕',
  },
]

// 统一的模块数据生成函数
const createModule = (id: string, nameKey: string, descriptionKey: string, url: string) =>
  ({
    id,
    nameKey,
    descriptionKey,
    url,
  }) as const

// 背景图配置
const SYSTEM_BACKGROUNDS = [
  { id: 'none', nameKey: 'background.none', url: '' },
  { id: 'bg1', nameKey: 'background.bg1', url: 'wallhaven-72rd8e_2560x1440-1.webp' },
  { id: 'bg3', nameKey: 'background.bg3', url: 'F_RIhiObMAA-c8N.jpeg' },
] as const

// 主配置对象
export const configs = {
  tiles: homeTiles,
  gridLayout: homeGridLayout,
  games: GAMES,
  navigation: [createModule('nav-1', 'module.nav.name', 'module.nav.desc', '/nav')],
  notes: [createModule('note-1', 'module.note.name', 'module.note.desc', '/note')],
  files: [createModule('file-1', 'module.file.name', 'module.file.desc', '/file')],
  lab: [createModule('lab-1', 'module.lab.name', 'module.lab.desc', '/lab')],
  systemBackgrounds: SYSTEM_BACKGROUNDS,
  themeColors: PRESET_THEME_COLORS,
}

// 通用的多语言配置转换函数
export interface TranslatableItem {
  readonly id?: string
  readonly nameKey?: string
  readonly descriptionKey?: string
  readonly name?: string
  readonly description?: string
  readonly url?: string
  readonly icon?: string | React.ReactNode
  readonly color?: string
  readonly primary?: string
  readonly href?: string
  readonly needLogin?: boolean
  readonly hideOnMobile?: boolean
  readonly [key: string]: string | number | boolean | React.ReactNode | undefined
}

// 优化翻译映射函数，减少重复计算
const mapWithTranslation = (
  arr: readonly TranslatableItem[],
  t: (key: string, fallback?: string) => string,
  fields: readonly string[] = ['nameKey']
): TranslatableItem[] => {
  return arr.map(item => {
    const result = { ...item }

    // 处理主要字段
    for (const field of fields) {
      const fieldValue = item[field]
      if (fieldValue && typeof fieldValue === 'string') {
        const fallback = typeof item.name === 'string' ? item.name : fieldValue
        const translatedField = field.replace('Key', '')
        result[translatedField] = t(fieldValue, fallback)
      }
    }

    // 处理描述字段
    if (item.descriptionKey) {
      result.description = t(item.descriptionKey, item.descriptionKey)
    }

    return result
  })
}

// 获取多语言配置
export const getTranslatedConfigs = (t: (key: string, fallback?: string) => string) => ({
  ...configs,
  tiles: mapWithTranslation(configs.tiles as unknown as readonly TranslatableItem[], t, [
    'nameKey',
  ]),
  games: mapWithTranslation(configs.games, t, ['nameKey', 'descriptionKey']),
  navigation: mapWithTranslation(configs.navigation, t, ['nameKey', 'descriptionKey']),
  notes: mapWithTranslation(configs.notes, t, ['nameKey', 'descriptionKey']),
  files: mapWithTranslation(configs.files, t, ['nameKey', 'descriptionKey']),
  lab: mapWithTranslation(configs.lab, t, ['nameKey', 'descriptionKey']),
  systemBackgrounds: mapWithTranslation(configs.systemBackgrounds, t, ['nameKey']),
  themeColors: mapWithTranslation(configs.themeColors, t, ['nameKey']),
})
