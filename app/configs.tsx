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

// 输出控制台Logo（仅在客户端执行）
if (typeof window !== 'undefined') {
  console.log(`%c${LOGO_TEXT}`, 'color: yellow')

  // 开发环境下输出额外信息
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 本地开发环境')
  }
}

// 应用启动器配置
export const configs = {
  tiles: [
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
  ],

  // 网格布局配置
  gridLayout: {
    columns: 3,
    templateAreas: `
      "thing thing thing"
      "chat file file"
      "chat tool lab"
      "nav note game"
    `,
  },

  // 游戏列表数据
  games: [
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
    {
      id: 'maze',
      nameKey: 'game.maze',
      descriptionKey: 'game.maze.desc',
      icon: '🌀',
    },
    {
      id: 'bowling',
      nameKey: 'game.bowling',
      descriptionKey: 'game.bowling.desc',
      icon: '🎳',
    },
    {
      id: 'tetris',
      nameKey: 'game.tetris',
      descriptionKey: 'game.tetris.desc',
      icon: '🧱',
    },
    {
      id: '2048',
      nameKey: 'game.2048',
      descriptionKey: 'game.2048.desc',
      icon: '🔢',
    },
    {
      id: 'snake',
      nameKey: 'game.snake',
      descriptionKey: 'game.snake.desc',
      icon: '🐍',
    },
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
  ],

  // 导航数据
  navigation: [
    {
      id: 'nav-1',
      nameKey: 'module.nav.name',
      descriptionKey: 'module.nav.desc',
      url: '/nav',
    },
  ],

  // 笔记数据
  notes: [
    {
      id: 'note-1',
      nameKey: 'module.note.name',
      descriptionKey: 'module.note.desc',
      url: '/note',
    },
  ],

  // 文件数据
  files: [
    {
      id: 'file-1',
      nameKey: 'module.file.name',
      descriptionKey: 'module.file.desc',
      url: '/file',
    },
  ],

  // 实验室数据
  lab: [
    {
      id: 'lab-1',
      nameKey: 'module.lab.name',
      descriptionKey: 'module.lab.desc',
      url: '/lab',
    },
  ],

  // 可用的音频文件列表
  availableTracks: [
    {
      name: 'I WiSH - 明日への扉~5 years brew version~',
      path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3',
    },
    { name: '和楽器バンド - 東风破.mp3', path: '/musics/和乐器バンド - 東风破.mp3' },
  ],

  // 系统提供的背景图列表
  systemBackgrounds: [
    { id: 'none', nameKey: 'background.none', url: '' },
    { id: 'bg1', nameKey: 'background.bg1', url: 'wallhaven-72rd8e_2560x1440-1.webp' },
    { id: 'bg3', nameKey: 'background.bg3', url: 'F_RIhiObMAA-c8N.jpeg' },
  ],

  // 预设的主题色彩配置
  themeColors: [
    {
      id: 'overwatch',
      nameKey: 'theme.overwatch',
      primary: 'hsl(35 97% 55%)',
      color: '#fc9d1c',
    },
    {
      id: 'minecraft',
      nameKey: 'theme.minecraft',
      primary: 'hsl(101 50% 43%)',
      color: '#5d9c32',
    },
    {
      id: 'zelda',
      nameKey: 'theme.zelda',
      primary: 'hsl(41 38% 56%)',
      color: '#b99f65',
    },
  ],
}

// Helper function to get translated config items
export const getTranslatedConfigs = (t: (key: string, fallback?: string) => string) => ({
  ...configs,
  tiles: configs.tiles.map(tile => ({
    ...tile,
    name: t(tile.nameKey, tile.name || tile.nameKey),
  })),
  games: configs.games.map(game => ({
    ...game,
    name: t(game.nameKey, game.nameKey),
    description: t(game.descriptionKey, game.descriptionKey),
  })),
  navigation: configs.navigation.map(nav => ({
    ...nav,
    name: t(nav.nameKey, nav.nameKey),
    description: t(nav.descriptionKey, nav.descriptionKey),
  })),
  notes: configs.notes.map(note => ({
    ...note,
    name: t(note.nameKey, note.nameKey),
    description: t(note.descriptionKey, note.descriptionKey),
  })),
  files: configs.files.map(file => ({
    ...file,
    name: t(file.nameKey, file.nameKey),
    description: t(file.descriptionKey, file.descriptionKey),
  })),
  lab: configs.lab.map(lab => ({
    ...lab,
    name: t(lab.nameKey, lab.nameKey),
    description: t(lab.descriptionKey, lab.descriptionKey),
  })),
  systemBackgrounds: configs.systemBackgrounds.map(bg => ({
    ...bg,
    name: t(bg.nameKey, bg.nameKey),
  })),
  themeColors: configs.themeColors.map(theme => ({
    ...theme,
    name: t(theme.nameKey, theme.nameKey),
  })),
})
