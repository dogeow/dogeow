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
    <div className="rounded bg-slate-950/90 p-2 shadow-md">
      <div className="relative">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="h-4 w-4 border border-slate-900/30 transition-colors duration-150 sm:h-5 sm:w-5 md:h-6 md:w-6"
                style={{
                  backgroundColor: cell || '#0f0f0f',
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
