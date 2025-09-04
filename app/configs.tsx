import {
  Package,
  FlaskConical,
  FileText,
  Wrench,
  Compass,
  BookOpen,
  Gamepad2,
  MessageSquare,
} from 'lucide-react'

// 控制台Logo文本
const LOGO_TEXT = `
╔╦╗┌─┐┌─┐┌─┐╔═╗╦ ╦
 ║║│ ││ ┬├┤ ║ ║║║║
═╩╝└─┘└─┘└─┘╚═╝╚╩╝
`

// 仅在客户端输出控制台Logo和开发环境提示
if (typeof window !== 'undefined') {
  console.log(`%c${LOGO_TEXT}`, 'color: yellow')
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 本地开发环境')
  }
}

const TILES = [
  {
    name: 'thing',
    nameKey: 'nav.thing',
    icon: <Package />,
    href: '/thing',
    color: '#2196F3',
    needLogin: true,
  },
  {
    name: 'lab',
    nameKey: 'nav.lab',
    icon: <FlaskConical />,
    href: '/lab',
    color: '#388e3c',
    needLogin: false,
  },
  {
    name: 'file',
    nameKey: 'nav.file',
    icon: <FileText />,
    href: '/file',
    color: '#FF5722',
    needLogin: true,
  },
  {
    name: 'tool',
    nameKey: 'nav.tool',
    icon: <Wrench />,
    href: '/tool',
    color: '#8B5A2B',
    needLogin: false,
  },
  {
    name: 'nav',
    nameKey: 'nav.nav',
    icon: <Compass />,
    href: '/nav',
    color: '#FFA000',
    needLogin: true,
  },
  {
    name: 'note',
    nameKey: 'nav.note',
    icon: <BookOpen />,
    href: '/note',
    color: '#1976D2',
    needLogin: true,
  },
  {
    name: 'game',
    nameKey: 'nav.game',
    icon: <Gamepad2 />,
    href: '/game',
    color: '#424242',
    needLogin: false,
  },
  {
    name: 'chat',
    nameKey: 'nav.chat',
    icon: <MessageSquare />,
    href: '/chat',
    color: '#E91E63',
    needLogin: true,
  },
]

// 游戏列表配置
const GAMES = [
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
const createModule = (id: string, nameKey: string, descriptionKey: string, url: string) => ({
  id,
  nameKey,
  descriptionKey,
  url,
})

// 统一的主题色配置
const THEME_COLORS = [
  { id: 'overwatch', nameKey: 'theme.overwatch', primary: 'hsl(35 97% 55%)', color: '#fc9d1c' },
  { id: 'minecraft', nameKey: 'theme.minecraft', primary: 'hsl(101 50% 43%)', color: '#5d9c32' },
  { id: 'zelda', nameKey: 'theme.zelda', primary: 'hsl(41 38% 56%)', color: '#b99f65' },
]

// 背景图配置
const SYSTEM_BACKGROUNDS = [
  { id: 'none', nameKey: 'background.none', url: '' },
  { id: 'bg1', nameKey: 'background.bg1', url: 'wallhaven-72rd8e_2560x1440-1.webp' },
  { id: 'bg3', nameKey: 'background.bg3', url: 'F_RIhiObMAA-c8N.jpeg' },
]

// 主配置对象
export const configs = {
  tiles: TILES,
  gridLayout: {
    columns: 3,
    templateAreas: `
      "thing thing thing"
      "chat file file"
      "chat tool lab"
      "nav note game"
    `,
  },
  games: GAMES,
  navigation: [createModule('nav-1', 'module.nav.name', 'module.nav.desc', '/nav')],
  notes: [createModule('note-1', 'module.note.name', 'module.note.desc', '/note')],
  files: [createModule('file-1', 'module.file.name', 'module.file.desc', '/file')],
  lab: [createModule('lab-1', 'module.lab.name', 'module.lab.desc', '/lab')],
  systemBackgrounds: SYSTEM_BACKGROUNDS,
  themeColors: THEME_COLORS,
}

// 通用的多语言配置转换函数
interface TranslatableItem {
  [key: string]: string | number | boolean | React.ReactNode | undefined
  nameKey?: string
  descriptionKey?: string
  name?: string
  description?: string
}

const mapWithTranslation = (
  arr: TranslatableItem[],
  t: (key: string, fallback?: string) => string,
  fields: string[] = ['nameKey']
) =>
  arr.map(item => {
    const result = { ...item }
    fields.forEach(field => {
      if (item[field] && typeof item[field] === 'string') {
        // 兼容 tiles 里有 name 字段的情况
        const fallback = typeof item.name === 'string' ? item.name : String(item[field])
        result[field.replace('Key', '')] = t(item[field] as string, fallback)
      }
    })
    // 处理 descriptionKey
    if (item.descriptionKey) {
      result.description = t(item.descriptionKey, item.descriptionKey)
    }
    return result
  })

// 获取多语言配置
export const getTranslatedConfigs = (t: (key: string, fallback?: string) => string) => ({
  ...configs,
  tiles: mapWithTranslation(configs.tiles, t, ['nameKey']),
  games: mapWithTranslation(configs.games, t, ['nameKey', 'descriptionKey']),
  navigation: mapWithTranslation(configs.navigation, t, ['nameKey', 'descriptionKey']),
  notes: mapWithTranslation(configs.notes, t, ['nameKey', 'descriptionKey']),
  files: mapWithTranslation(configs.files, t, ['nameKey', 'descriptionKey']),
  lab: mapWithTranslation(configs.lab, t, ['nameKey', 'descriptionKey']),
  systemBackgrounds: mapWithTranslation(configs.systemBackgrounds, t, ['nameKey']),
  themeColors: mapWithTranslation(configs.themeColors, t, ['nameKey']),
})
