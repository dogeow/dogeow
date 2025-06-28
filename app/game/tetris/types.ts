export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Position {
  x: number
  y: number
}

export type Board = (string | null)[][]

export interface Tetromino {
  type: TetrominoType
  shape: number[][]
  position: Position
  color: string
}

export interface GameState {
  board: Board
  currentPiece: Tetromino | null
  nextPiece: Tetromino | null
  score: number
  lines: number
  level: number
  gameOver: boolean
  paused: boolean
  isClient: boolean
}

export interface GameConfig {
  BOARD_WIDTH: number
  BOARD_HEIGHT: number
  TETROMINO_SHAPES: Record<TetrominoType, number[][]>
  TETROMINO_COLORS: Record<TetrominoType, string>
} 