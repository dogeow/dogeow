import { useMemo } from 'react'
import type { PuzzlePiece } from '../utils/puzzleUtils'
import { toRoman } from '../utils/puzzleUtils'

interface UsePuzzleLayoutProps {
  pieces: PuzzlePiece[]
  size: number
  puzzleSize: number
  availableHeight: number
  showDebugInfo: boolean
}

export const usePuzzleLayout = ({
  pieces,
  size,
  puzzleSize,
  availableHeight,
  showDebugInfo,
}: UsePuzzleLayoutProps) => {
  const layout = useMemo(() => {
    const pieceSize = puzzleSize / size
    const selectionPieceSize = Math.max(60, Math.min(80, 480 / size))
    const allPiecesForDisplay = pieces
    const colsPerRow = Math.min(4, Math.ceil(Math.sqrt(allPiecesForDisplay.length)))

    const cardHeaderHeight = 60
    const debugInfoHeight = showDebugInfo ? 50 : 0
    const cardPadding = 32
    const tabsHeight = 50

    const availableForGrid = Math.max(
      120,
      availableHeight - cardHeaderHeight - tabsHeight - debugInfoHeight - cardPadding
    )
    const maxRows = Math.max(2, Math.floor(availableForGrid / (selectionPieceSize + 8)))
    const piecesPerPage = maxRows * colsPerRow

    const pieceGroups: PuzzlePiece[][] = []
    for (let i = 0; i < allPiecesForDisplay.length; i += piecesPerPage) {
      pieceGroups.push(allPiecesForDisplay.slice(i, i + piecesPerPage))
    }

    const actualAvailableForGrid =
      pieceGroups.length > 1
        ? availableForGrid
        : Math.max(120, availableHeight - cardHeaderHeight - debugInfoHeight - cardPadding)

    return {
      pieceSize,
      selectionPieceSize,
      colsPerRow,
      maxRows,
      piecesPerPage,
      pieceGroups,
      actualAvailableForGrid,
      allPiecesForDisplay,
    }
  }, [pieces, size, puzzleSize, availableHeight, showDebugInfo])

  return {
    ...layout,
    toRoman,
  }
}
