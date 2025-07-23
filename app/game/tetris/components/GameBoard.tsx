import React, { memo } from 'react'
import { Board, Tetromino } from '../types'
import { createDisplayBoard } from '../utils'

interface GameBoardProps {
  board: Board
  currentPiece: Tetromino | null
}

export const GameBoard = memo<GameBoardProps>(({ board, currentPiece }) => {
  const displayBoard = createDisplayBoard(board, currentPiece)

  return (
    <div className="rounded border border-gray-600 bg-gray-900 p-2 shadow-lg dark:border-green-500/30">
      <div className="relative">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="h-3 w-3 transition-colors duration-150 sm:h-4 sm:w-4 md:h-5 md:w-5"
                style={{
                  backgroundColor: cell || 'rgb(17, 24, 39)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})

GameBoard.displayName = 'GameBoard'
