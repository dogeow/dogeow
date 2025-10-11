/**
 * 2048游戏核心算法
 */

export type Board = number[][]
export type Direction = 'up' | 'down' | 'left' | 'right'
export type MoveResult = { newBoard: Board; scoreGained: number; moved: boolean }

const BOARD_SIZE = 4

export const initializeBoard = (): Board => {
  const newBoard = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0))
  addRandomTile(newBoard)
  addRandomTile(newBoard)
  return newBoard
}

export const addRandomTile = (board: Board): void => {
  const emptyCells: [number, number][] = []
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        emptyCells.push([i, j])
      }
    }
  }

  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const [row, col] = emptyCells[randomIndex]
    board[row][col] = Math.random() < 0.9 ? 2 : 4
  }
}

export const transpose = (board: Board): Board => {
  return board[0].map((_, colIndex) => board.map(row => row[colIndex]))
}

export const isGameOver = (board: Board): boolean => {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) return false
    }
  }

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const current = board[i][j]
      if (
        (i < BOARD_SIZE - 1 && board[i + 1][j] === current) ||
        (j < BOARD_SIZE - 1 && board[i][j + 1] === current)
      ) {
        return false
      }
    }
  }
  return true
}

export const moveLeft = (board: Board): MoveResult => {
  const newBoard = board.map(row => [...row])
  let scoreGained = 0
  let moved = false

  for (let i = 0; i < BOARD_SIZE; i++) {
    const row = newBoard[i].filter(cell => cell !== 0)
    const mergedRow: number[] = []
    let j = 0

    while (j < row.length) {
      if (j < row.length - 1 && row[j] === row[j + 1]) {
        const mergedValue = row[j] * 2
        mergedRow.push(mergedValue)
        scoreGained += mergedValue
        j += 2
      } else {
        mergedRow.push(row[j])
        j += 1
      }
    }

    while (mergedRow.length < BOARD_SIZE) {
      mergedRow.push(0)
    }

    for (let k = 0; k < BOARD_SIZE; k++) {
      if (newBoard[i][k] !== mergedRow[k]) {
        moved = true
      }
    }

    newBoard[i] = mergedRow
  }

  return { newBoard, scoreGained, moved }
}

export const moveRight = (board: Board): MoveResult => {
  const rotatedBoard = board.map(row => [...row].reverse())
  const { newBoard, scoreGained, moved } = moveLeft(rotatedBoard)
  return {
    newBoard: newBoard.map(row => [...row].reverse()),
    scoreGained,
    moved,
  }
}

export const moveUp = (board: Board): MoveResult => {
  const transposedBoard = transpose(board)
  const { newBoard, scoreGained, moved } = moveLeft(transposedBoard)
  return {
    newBoard: transpose(newBoard),
    scoreGained,
    moved,
  }
}

export const moveDown = (board: Board): MoveResult => {
  const transposedBoard = transpose(board)
  const { newBoard, scoreGained, moved } = moveRight(transposedBoard)
  return {
    newBoard: transpose(newBoard),
    scoreGained,
    moved,
  }
}
