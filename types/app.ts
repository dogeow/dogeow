export interface Tile {
  name: string;
  icon: string;
  href: string;
  color: string;
  size: 'large' | 'medium' | 'small';
  colSpan: number;
  rowSpan: number;
}

export interface AppConfig {
  tiles: Tile[];
} 