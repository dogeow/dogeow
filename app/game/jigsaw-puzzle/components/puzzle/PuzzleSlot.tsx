import React from 'react'
import { PuzzlePiece, PuzzleSlot as PuzzleSlotType } from '../../utils/puzzleUtils'

interface PuzzleSlotProps {
  slot: PuzzleSlotType
  piece: PuzzlePiece | null
  isSelected: boolean
  isWronglyPlaced: boolean
  imageUrl: string
  pieceSize: number
  getBackgroundSize: (pieceSize: number) => string
  getBackgroundPosition: (row: number, col: number, pieceSize: number) => string
  onSlotClick: (slotId: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, slotId: number) => void
  draggedPiece: number | null
  selectedPlacedPiece: number | null
}

/**
 * 单个拼图槽位组件
 */
export const PuzzleSlot = React.memo(function PuzzleSlot({
  slot,
  piece,
  isSelected,
  isWronglyPlaced,
  imageUrl,
  pieceSize,
  getBackgroundSize,
  getBackgroundPosition,
  onSlotClick,
  onDragOver,
  onDrop,
  draggedPiece,
  selectedPlacedPiece,
}: PuzzleSlotProps) {
  const slotImageStyle = piece
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: getBackgroundSize(pieceSize),
        backgroundPosition: getBackgroundPosition(piece.row, piece.col, pieceSize),
        backgroundRepeat: 'no-repeat',
      }
    : {}

  return (
    <div
      onClick={() => onSlotClick(slot.id)}
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, slot.id)}
      className={`relative cursor-pointer ${
        slot.pieceId !== null
          ? isSelected
            ? 'ring-2 ring-gray-400 ring-inset'
            : isWronglyPlaced
              ? 'ring-2 ring-red-400 ring-inset'
              : ''
          : 'border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50'
      } ${draggedPiece !== null && slot.pieceId === null ? 'border-gray-400 bg-gray-100' : ''} ${selectedPlacedPiece !== null && slot.pieceId === null ? 'border-gray-400 bg-gray-100' : ''} `}
      style={{
        width: `${pieceSize}px`,
        height: `${pieceSize}px`,
        ...slotImageStyle,
      }}
    />
  )
})
