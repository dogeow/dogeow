import { ReactNode } from 'react'

// 自定义主题类型
export type CustomTheme = {
  id: string
  name: string
  primary: string
  color: string
}

// 应用启动器图标类型
export interface Tile {
  name: string // 英文名称，从 href 自动生成
  nameKey: string // 翻译键
  nameCn?: string // 中文名称（向后兼容，已弃用）
  icon: string | ReactNode
  href: string
  color: string
  description?: string // 可选描述，用于不同主题的卡片显示
  cover?: string // 封面图片，自动根据 name 生成
  gridArea?: string // CSS Grid Area 名称，自动根据 name 生成
  needLogin: boolean
}

// 网格布局配置类型
export interface GridLayout {
  columns: number
  templateAreas: string
}

// 应用启动器配置类型
export interface AppConfig {
  gridLayout: GridLayout
  tiles: Tile[]
}
