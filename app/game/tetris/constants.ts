import { TetrominoType, GameConfig } from './types'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

// 方块形状定义
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

// 方块颜色
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#f97316',
  O: '#facc15',
  T: '#a78bfa',
  S: '#34d399',
  Z: '#fb7185',
  J: '#f472b6',
  L: '#a3e635',
}

export const GAME_CONFIG: GameConfig = {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
}

// 游戏速度配置
export const GAME_SPEED = {
  NORMAL_DROP: 16, // 60 FPS
  SOFT_DROP: 50,
  MIN_DROP_SPEED: 50,
  SPEED_DECREASE_PER_LEVEL: 50,
  BASE_DROP_SPEED: 1000,
}

// 得分配置
export const SCORING = {
  BASE_SCORES: [0, 40, 100, 300, 1200],
  SOFT_DROP_BONUS: 1,
  HARD_DROP_BONUS: 2,
  LINES_PER_LEVEL: 10,
}
