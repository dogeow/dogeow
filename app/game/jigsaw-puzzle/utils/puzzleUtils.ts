/**
 * 拼图游戏工具函数
 */

export interface PuzzlePiece {
  id: number
  row: number
  col: number
  isPlaced: boolean
  imageStyle: React.CSSProperties
}

export interface PuzzleSlot {
  id: number
  row: number
  col: number
  pieceId: number | null
}

/**
 * 初始化拼图块
 */
export const initializePuzzlePieces = (
  size: number,
  imageUrl: string,
  puzzleSize: number
): PuzzlePiece[] => {
  const totalPieces = size * size
  const pieceSize = puzzleSize / size
  const newPieces: PuzzlePiece[] = []

  for (let i = 0; i < totalPieces; i++) {
    const row = Math.floor(i / size)
    const col = i % size

    newPieces.push({
      id: i,
      row,
      col,
      isPlaced: false,
      imageStyle: {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
        backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
        backgroundRepeat: 'no-repeat',
      },
    })
  }

  return newPieces.sort(() => Math.random() - 0.5)
}

/**
 * 初始化拼图槽位
 */
export const initializePuzzleSlots = (size: number): PuzzleSlot[] => {
  const totalPieces = size * size
  const newSlots: PuzzleSlot[] = []

  for (let i = 0; i < totalPieces; i++) {
    const row = Math.floor(i / size)
    const col = i % size

    newSlots.push({
      id: i,
      row,
      col,
      pieceId: null,
    })
  }

  return newSlots
}

/**
 * 检查拼图块是否放置正确
 */
export const isPieceCorrectlyPlaced = (piece: PuzzlePiece, slot: PuzzleSlot): boolean => {
  return piece.row === slot.row && piece.col === slot.col
}

/**
 * 检查游戏是否完成
 */
export const isGameComplete = (pieces: PuzzlePiece[], slots: PuzzleSlot[]): boolean => {
  const allPiecesPlaced = pieces.every(p => p.isPlaced)
  if (!allPiecesPlaced) return false

  return pieces.every(p => {
    const currentSlot = slots.find(s => s.pieceId === p.id)
    return currentSlot && currentSlot.row === p.row && currentSlot.col === p.col
  })
}

/**
 * 罗马数字转换
 */
export const toRoman = (num: number): string => {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romanNumerals[num - 1] || num.toString()
}
