// 自定义主题类型
export type CustomTheme = {
  id: string;
  name: string;
  primary: string;
  color: string;
}; 

// 应用启动器图标类型
export interface Tile {
  name: string;
  icon: string;
  href: string;
  color: string;
  size: 'large' | 'medium' | 'small';
  colSpan: number;
  rowSpan: number;
}

// 应用启动器配置类型
export interface AppConfig {
  tiles: Tile[];
} 