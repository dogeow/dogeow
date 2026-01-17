import React, { memo } from 'react'
import type { PuzzlePiece } from '../../../utils/puzzleUtils'
import { getBackgroundSize, getBackgroundPosition } from '../../../utils/imageUtils'

interface PuzzlePieceItemProps {
  piece: PuzzlePiece
  pieceSize: number
  imageUrl: string
  size: number
  imageDimensions: { width: number; height: number }
  isDragged: boolean
  showPieceNumbers: boolean
  piecePreviewVisible: boolean
  piecePreviewPiece: PuzzlePiece | null
  piecePreviewPosition: { x: number; y: number }
  onDragStart: (e: React.DragEvent, pieceId: number) => void
  onDragEnd: () => void
  onClick: (pieceId: number) => void
  onPreviewStart: (e: React.MouseEvent | React.TouchEvent, piece: PuzzlePiece) => void
  onPreviewEnd: () => void
}

export const PuzzlePieceItem = memo<PuzzlePieceItemProps>(
  ({
    piece,
    pieceSize,
    imageUrl,
    size,
    imageDimensions,
    isDragged,
    showPieceNumbers,
    piecePreviewVisible,
    piecePreviewPiece,
    piecePreviewPosition,
    onDragStart,
    onDragEnd,
    onClick,
    onPreviewStart,
    onPreviewEnd,
  }) => {
    if (piece.isPlaced) {
      return (
        <div
          className="relative flex items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50/30 opacity-30"
          style={{
            width: `${pieceSize}px`,
            height: `${pieceSize}px`,
          }}
        />
      )
    }

    return (
      <div
        key={piece.id}
        data-piece-id={piece.id}
        className={`relative flex items-center justify-center rounded border-2 transition-all duration-200 ${
          isDragged
            ? 'scale-105 border-blue-400 bg-blue-50 shadow-md'
            : 'cursor-pointer border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm'
        }`}
        style={{
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          backgroundSize: getBackgroundSize(pieceSize, size, imageDimensions),
          backgroundImage: `url(${imageUrl})`,
          backgroundPosition: getBackgroundPosition(
            piece.row,
            piece.col,
            pieceSize,
            size,
            imageDimensions
          ),
          backgroundRepeat: 'no-repeat',
        }}
        draggable={true}
        onClick={() => onClick(piece.id)}
        onDragStart={(e: React.DragEvent) => onDragStart(e, piece.id)}
        onDragEnd={onDragEnd}
        onMouseDown={(e: React.MouseEvent) => onPreviewStart(e, piece)}
        onMouseUp={onPreviewEnd}
        onMouseLeave={onPreviewEnd}
        onTouchStart={(e: React.TouchEvent) => onPreviewStart(e, piece)}
        onTouchEnd={onPreviewEnd}
      >
        {/* 拼图块编号（可选显示） */}
        {showPieceNumbers && (
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-xs text-white opacity-80">
            {piece.id + 1}
          </div>
        )}

        {/* 拼图块预览 */}
        {piecePreviewVisible && piecePreviewPiece?.id === piece.id && (
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: `${piecePreviewPosition.x}px`,
              top: `${piecePreviewPosition.y - 220}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="relative rounded-lg border bg-white p-3 shadow-2xl">
              <div
                className="h-40 w-40 rounded border"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: getBackgroundSize(40, size, imageDimensions),
                  backgroundPosition: getBackgroundPosition(
                    piece.row,
                    piece.col,
                    40,
                    size,
                    imageDimensions
                  ),
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="mt-2 text-center text-xs text-gray-600">拼图块 {piece.id + 1}</div>
              {/* 小箭头指向拼图块 */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 transform">
                <div className="h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white border-r-transparent border-l-transparent"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

PuzzlePieceItem.displayName = 'PuzzlePieceItem'
