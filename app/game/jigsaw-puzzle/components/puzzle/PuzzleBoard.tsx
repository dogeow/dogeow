import React from 'react'
import { PuzzleSlot } from './PuzzleSlot'
import { PuzzlePiece, PuzzleSlot as PuzzleSlotType } from '../../utils/puzzleUtils'

interface PuzzleBoardProps {
  size: number
  puzzleSize: number
  slots: PuzzleSlotType[]
  pieces: PuzzlePiece[]
  wronglyPlacedPieces: Set<number>
  selectedPlacedPiece: number | null
  draggedPiece: number | null
  imageUrl: string
  getBackgroundSize: (pieceSize: number) => string
  getBackgroundPosition: (row: number, col: number, pieceSize: number) => string
  onSlotClick: (slotId: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, slotId: number) => void
}

/**
 * 拼图主板组件
 */
export const PuzzleBoard = React.memo(function PuzzleBoard({
  size,
  puzzleSize,
  slots,
  pieces,
  wronglyPlacedPieces,
  selectedPlacedPiece,
  draggedPiece,
  imageUrl,
  getBackgroundSize,
  getBackgroundPosition,
  onSlotClick,
  onDragOver,
  onDrop,
}: PuzzleBoardProps) {
  const pieceSize = puzzleSize / size

  return (
    <div
      className="relative grid rounded-xl border-2 border-gray-300 bg-white shadow-lg"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: `${puzzleSize}px`,
        height: `${puzzleSize}px`,
      }}
    >
      {slots.map(slot => {
        const placedPiece =
          slot.pieceId !== null ? (pieces.find(p => p.id === slot.pieceId) ?? null) : null
        const isSelected = selectedPlacedPiece === slot.pieceId
        const isWronglyPlaced = placedPiece ? wronglyPlacedPieces.has(placedPiece.id) : false

        return (
          <PuzzleSlot
            key={slot.id}
            slot={slot}
            piece={placedPiece}
            isSelected={isSelected}
            isWronglyPlaced={isWronglyPlaced}
            imageUrl={imageUrl}
            pieceSize={pieceSize}
            getBackgroundSize={getBackgroundSize}
            getBackgroundPosition={getBackgroundPosition}
            onSlotClick={onSlotClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            draggedPiece={draggedPiece}
            selectedPlacedPiece={selectedPlacedPiece}
          />
        )
      })}
    </div>
  )
})
