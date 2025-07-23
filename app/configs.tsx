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
    console.log('🎯 DogeOW 配置加载完成')
  }
}

// 应用启动器配置
export const configs = {
  tiles: [
    {
      name: '物品管理',
      icon: '',
      href: '/thing',
      color: '#2196F3',
      size: 'large',
      colSpan: 3,
      rowSpan: 1,
      cover: 'thing.png',
      gridArea: 'thing',
      needLogin: true,
    },
    {
      name: '实验室',
      icon: '',
      href: '/lab',
      color: '#388e3c',
      size: 'medium',
      colSpan: 1,
      rowSpan: 2,
      cover: 'lab.png',
      gridArea: 'lab',
      needLogin: false,
    },
    {
      name: '文件',
      icon: '',
      href: '/file',
      color: '#FF5722',
      size: 'medium',
      colSpan: 2,
      rowSpan: 1,
      cover: 'file.png',
      gridArea: 'file',
      needLogin: true,
    },
    {
      name: '工具',
      icon: '',
      href: '/tool',
      color: '#8B5A2B',
      size: 'medium',
      colSpan: 2,
      rowSpan: 1,
      cover: 'tool.png',
      gridArea: 'tool',
      needLogin: false,
    },
    {
      name: '导航',
      icon: '',
      href: '/nav',
      color: '#FFA000',
      size: 'small',
      colSpan: 1,
      rowSpan: 1,
      cover: 'nav.png',
      gridArea: 'nav',
      needLogin: true,
    },
    {
      name: '笔记',
      icon: '',
      href: '/note',
      color: '#1976D2',
      size: 'small',
      colSpan: 1,
      rowSpan: 1,
      cover: 'note.png',
      gridArea: 'note',
      needLogin: true,
    },
    {
      name: '游戏',
      icon: '',
      href: '/game',
      color: '#424242',
      size: 'small',
      colSpan: 1,
      rowSpan: 1,
      cover: 'game.png',
      gridArea: 'game',
      needLogin: false,
    },
  ],

  // 网格布局配置
  gridLayout: {
    columns: 3,
    templateAreas: `
      "thing thing thing"
      "lab file file"
      "lab tool tool"
      "nav note game"
    `,
  },

  // 游戏列表数据
  games: [
    {
      id: 'sliding-puzzle',
      name: '滑块拼图',
      description: '经典的数字滑块拼图游戏，通过移动数字方块来排列顺序',
      icon: '🧩',
    },
    {
      id: 'picture-puzzle',
      name: '图片拼图',
      description: '将打乱的图片碎片重新拼接成完整图片',
      icon: '🖼️',
    },
    {
      id: 'jigsaw-puzzle',
      name: '传统拼图',
      description: '传统的拼图游戏，考验你的观察力和耐心',
      icon: '🧩',
    },
    {
      id: 'shooting-range',
      name: '射击训练场',
      description: '射击训练游戏，提高你的瞄准技巧',
      icon: '🎯',
      hideOnMobile: true,
    },
    {
      id: 'maze',
      name: '迷宫',
      description: '陀螺仪控制的物理迷宫游戏，倾斜设备控制小球到达终点',
      icon: '🌀',
    },
    {
      id: 'bowling',
      name: '保龄球',
      description: '陀螺仪控制的保龄球游戏，倾斜设备瞄准并投球',
      icon: '🎳',
    },
    {
      id: 'tetris',
      name: '俄罗斯方块',
      description: '经典的俄罗斯方块游戏，消除方块获得高分',
      icon: '🧱',
    },
    {
      id: '2048',
      name: '2048',
      description: '数字合并游戏，通过滑动合并相同数字达到2048',
      icon: '🔢',
    },
    {
      id: 'snake',
      name: '贪吃蛇',
      description: '经典的贪吃蛇游戏，控制蛇吃食物并避免撞到自己',
      icon: '🐍',
    },
    {
      id: 'minesweeper',
      name: '扫雷',
      description: '经典的扫雷游戏，通过数字提示找出所有地雷',
      icon: '💣',
    },
    {
      id: 'tic-tac-toe',
      name: '井字棋',
      description: '简单的井字棋游戏，三子连线即可获胜',
      icon: '⭕',
    },
  ],

  // 导航数据
  navigation: [
    {
      id: 'nav-1',
      name: '导航管理',
      description: '管理和组织你的网站导航链接',
      url: '/nav',
    },
  ],

  // 笔记数据
  notes: [
    {
      id: 'note-1',
      name: 'Markdown笔记',
      description: '支持Markdown格式的在线笔记编辑器',
      url: '/note',
    },
  ],

  // 文件数据
  files: [
    {
      id: 'file-1',
      name: '文件管理',
      description: '在线文件存储和管理系统',
      url: '/file',
    },
  ],

  // 实验室数据
  lab: [
    {
      id: 'lab-1',
      name: '实验室工具',
      description: '各种实用的在线工具和实验功能',
      url: '/lab',
    },
  ],

  // 可用的音频文件列表
  availableTracks: [
    {
      name: 'I WiSH - 明日への扉~5 years brew version~',
      path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3',
    },
    { name: '和楽器バンド - 東風破.mp3', path: '/musics/和楽器バンド - 東風破.mp3' },
  ],

  // 系统提供的背景图列表
  systemBackgrounds: [
    { id: 'none', name: '无背景', url: '' },
    { id: 'bg1', name: '你的名字？·untitled', url: 'wallhaven-72rd8e_2560x1440-1.webp' },
    { id: 'bg3', name: '2·untitled', url: 'F_RIhiObMAA-c8N.jpeg' },
  ],

  // 预设的主题色彩配置
  themeColors: [
    {
      id: 'overwatch',
      name: '守望先锋',
      primary: 'hsl(35 97% 55%)',
      color: '#fc9d1c',
    },
    {
      id: 'minecraft',
      name: '我的世界',
      primary: 'hsl(101 50% 43%)',
      color: '#5d9c32',
    },
    {
      id: 'zelda',
      name: '塞尔达传说',
      primary: 'hsl(41 38% 56%)',
      color: '#b99f65',
    },
  ],
}
