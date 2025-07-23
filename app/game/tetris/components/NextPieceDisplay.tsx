import React, { memo } from 'react'
import { Tetromino } from '../types'

interface NextPieceDisplayProps {
  nextPiece: Tetromino | null
  isClient: boolean
}

export const NextPieceDisplay = memo<NextPieceDisplayProps>(({ nextPiece, isClient }) => {
  if (!isClient || !nextPiece) {
    return <div className="text-sm text-gray-400">加载中...</div>
  }

  return (
    <div className="rounded border border-gray-600 bg-gray-900 p-3 dark:border-green-500/30">
      <div className="mb-2 text-center font-mono text-xs text-gray-300 dark:text-green-400">
        NEXT
      </div>
      <div className="flex min-h-[50px] items-center justify-center rounded bg-gray-800 p-2">
        <div className="flex flex-col items-center gap-0">
          {nextPiece.shape.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  style={{
                    backgroundColor: cell ? nextPiece.color : 'transparent',
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
