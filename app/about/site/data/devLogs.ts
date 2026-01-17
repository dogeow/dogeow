import type { DevLogEntry } from '../types'

export const DEV_LOGS: DevLogEntry[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    version: '1.2.0',
    type: 'release',
    title: '多语言支持正式发布',
    description:
      '完成了完整的多语言支持功能，包括简体中文、繁體中文、英文和日文。用户现在可以自由切换界面语言，所有主要功能都已本地化。',
    author: '小李世界',
    tags: ['i18n', '国际化', '用户体验'],
  },
  {
    id: '2',
    date: new Date('2024-01-10'),
    version: '1.1.5',
    type: 'update',
    title: '站点日志页面重新设计',
    description: '将站点日志从系统监控日志改为开发日志，记录网站的开发历程、功能更新和重要里程碑。',
    author: '小李世界',
    tags: ['设计', '用户体验'],
  },
  {
    id: '3',
    date: new Date('2024-01-08'),
    version: '1.1.0',
    type: 'milestone',
    title: '游戏模块完成',
    description:
      '完成了所有游戏模块的开发，包括俄罗斯方块、2048、贪吃蛇、扫雷等经典游戏，支持移动端操作。',
    author: '小李世界',
    tags: ['游戏', '移动端', '里程碑'],
  },
  {
    id: '4',
    date: new Date('2024-01-05'),
    version: '1.0.8',
    type: 'bugfix',
    title: '修复主题切换问题',
    description: '修复了深色模式切换时的闪烁问题，优化了主题切换的用户体验。',
    author: '小李世界',
    tags: ['修复', '主题', 'UI'],
  },
  {
    id: '5',
    date: new Date('2024-01-01'),
    version: '1.0.0',
    type: 'milestone',
    title: '网站正式上线',
    description: 'DogeOw网站正式上线，包含物品管理、文件管理、笔记、导航等核心功能模块。',
    author: '小李世界',
    tags: ['上线', '里程碑', '核心功能'],
  },
]
