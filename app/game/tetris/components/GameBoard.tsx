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
    <div className="bg-gray-900 p-2 rounded border border-gray-600 dark:border-green-500/30 shadow-lg">
      <div className="relative">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-colors duration-150"
                style={{
                  backgroundColor: cell || 'rgb(17, 24, 39)'
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