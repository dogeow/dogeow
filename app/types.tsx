// 自定义主题类型
export type CustomTheme = {
  id: string;
  name: string;
  primary: string;
  color: string;
}; 

interface Tile {
  name: string;
  icon: string;
  href: string;
  color: string;
  size: 'large' | 'medium' | 'small';
  colSpan: number;
  rowSpan: number;
}

interface AppConfig {
  tiles: Tile[];
} 