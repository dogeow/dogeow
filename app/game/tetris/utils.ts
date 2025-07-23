import { Board, Tetromino, TetrominoType, Position } from './types'
import {
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  SCORING,
  GAME_SPEED,
} from './constants'

// 创建空棋盘
export function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null))
}

// 生成随机方块
export function generateRandomTetromino(): Tetromino {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
  const type = types[Math.floor(Math.random() * types.length)]

  return {
    type,
    shape: TETROMINO_SHAPES[type],
    position: {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2),
      y: 0,
    },
    color: TETROMINO_COLORS[type],
  }
}

// 旋转方块
export function rotateTetromino(tetromino: Tetromino): Tetromino {
  const rotated = tetromino.shape[0].map((_, index) =>
    tetromino.shape.map(row => row[index]).reverse()
  )

  return {
    ...tetromino,
    shape: rotated,
  }
}

// 检查位置是否有效
export function isValidPosition(board: Board, tetromino: Tetromino, position: Position): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = position.x + x
        const newY = position.y + y

        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false
        }
      }
    }
  }
  return true
}

// 将方块放置到棋盘上
export function placeTetromino(board: Board, tetromino: Tetromino): Board {
  const newBoard = board.map(row => [...row])

  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardY = tetromino.position.y + y
        const boardX = tetromino.position.x + x
        if (boardY >= 0) {
          newBoard[boardY][boardX] = tetromino.color
        }
      }
    }
  }

  return newBoard
}

// 清除完整的行
export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null))
  const linesCleared = BOARD_HEIGHT - newBoard.length

  // 在顶部添加空行
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null))
  }

  return { newBoard, linesCleared }
}

// 计算得分
export function calculateScore(linesCleared: number, level: number): number {
  return SCORING.BASE_SCORES[linesCleared] * (level + 1)
}

// 计算等级
export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / SCORING.LINES_PER_LEVEL) + 1
}

// 计算下落速度（毫秒）
export function getDropSpeed(level: number): number {
  return Math.max(
    GAME_SPEED.MIN_DROP_SPEED,
    GAME_SPEED.BASE_DROP_SPEED - (level - 1) * GAME_SPEED.SPEED_DECREASE_PER_LEVEL
  )
}

// 计算硬降距离
export function calculateHardDropDistance(board: Board, tetromino: Tetromino): number {
  let dropDistance = 0
  const newPosition = { ...tetromino.position }

  while (isValidPosition(board, tetromino, { ...newPosition, y: newPosition.y + 1 })) {
    newPosition.y += 1
    dropDistance += 1
  }

  return dropDistance
}

// 创建显示棋盘（包含当前方块）
export function createDisplayBoard(board: Board, currentPiece: Tetromino | null): Board {
  const displayBoard = board.map(row => [...row])

  // 绘制当前方块
  if (currentPiece) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.position.y + y
          const boardX = currentPiece.position.x + x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = currentPiece.color
          }
        }
      }
    }
  }

  return displayBoard
}
