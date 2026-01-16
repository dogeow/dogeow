import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface MobileControlsProps {
  movePiece: (direction: 'left' | 'right' | 'down') => boolean
  rotatePiece: () => void
  hardDrop: () => void
  startSoftDrop: () => void
  stopSoftDrop: () => void
  isSoftDropping: boolean
}

export const MobileControls = memo<MobileControlsProps>(
  ({ movePiece, rotatePiece, hardDrop, startSoftDrop, stopSoftDrop, isSoftDropping }) => {
    const handleTouchStart = (callback: () => void) => (e: React.TouchEvent) => {
      e.preventDefault()
      callback()
    }

    const handleTouchEnd = (callback: () => void) => (e: React.TouchEvent) => {
      e.preventDefault()
      callback()
    }

    return (
      <div className="mx-auto w-full max-w-md lg:hidden">
        {/* 旋转按钮 */}
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-16 text-xl font-bold"
            onTouchStart={handleTouchStart(rotatePiece)}
            onClick={rotatePiece}
          >
            ↻
          </Button>
        </div>

        {/* 左右移动和软降 */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full text-xl font-bold"
            onTouchStart={handleTouchStart(() => movePiece('left'))}
            onClick={() => movePiece('left')}
          >
            ←
          </Button>
          <Button
            variant="outline"
            className={`h-12 w-full text-sm font-medium ${
              isSoftDropping ? 'bg-amber-500/15 text-amber-700 dark:text-amber-200' : ''
            }`}
            onTouchStart={handleTouchStart(startSoftDrop)}
            onTouchEnd={handleTouchEnd(stopSoftDrop)}
            onMouseDown={startSoftDrop}
            onMouseUp={stopSoftDrop}
            onMouseLeave={stopSoftDrop}
          >
            按住软降 ↓
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full text-xl font-bold"
            onTouchStart={handleTouchStart(() => movePiece('right'))}
            onClick={() => movePiece('right')}
          >
            →
          </Button>
        </div>

        {/* 硬降 */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-20 text-xl font-bold"
            onTouchStart={handleTouchStart(hardDrop)}
            onClick={hardDrop}
          >
            ⬇
          </Button>
        </div>
      </div>
    )
  }
)

MobileControls.displayName = 'MobileControls'
