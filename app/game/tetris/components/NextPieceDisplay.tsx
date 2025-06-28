import React, { memo } from 'react'
import { Tetromino } from '../types'

interface NextPieceDisplayProps {
  nextPiece: Tetromino | null
  isClient: boolean
}

export const NextPieceDisplay = memo<NextPieceDisplayProps>(({ nextPiece, isClient }) => {
  if (!isClient || !nextPiece) {
    return (
      <div className="text-gray-400 text-sm">
        加载中...
      </div>
    )
  }

  return (
    <div className="bg-gray-900 p-3 rounded border border-gray-600 dark:border-green-500/30">
      <div className="text-xs text-gray-300 dark:text-green-400 mb-2 text-center font-mono">NEXT</div>
      <div className="flex justify-center bg-gray-800 rounded p-2 min-h-[50px] items-center">
        <div className="flex flex-col items-center gap-0">
          {nextPiece.shape.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{
                    backgroundColor: cell ? nextPiece.color : 'transparent'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

NextPieceDisplay.displayName = 'NextPieceDisplay' 