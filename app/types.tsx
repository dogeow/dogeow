// 自定义主题类型
export type CustomTheme = {
  id: string
  name: string
  primary: string
  color: string
}

// 应用启动器图标类型
export interface Tile {
  name: string
  icon: string
  href: string
  color: string
  size: 'large' | 'medium' | 'small'
  colSpan: number
  rowSpan: number
  cover?: string // 封面图片可选属性
  gridArea?: string // CSS Grid Area 名称
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
