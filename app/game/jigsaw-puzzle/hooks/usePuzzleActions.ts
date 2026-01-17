import { useCallback } from 'react'
import type { PuzzlePiece, PuzzleSlot } from '../utils/puzzleUtils'
import { isPieceCorrectlyPlaced, isGameComplete } from '../utils/puzzleUtils'

interface UsePuzzleActionsProps {
  pieces: PuzzlePiece[]
  slots: PuzzleSlot[]
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>
  setSlots: React.Dispatch<React.SetStateAction<PuzzleSlot[]>>
  wronglyPlacedPieces: Set<number>
  setWronglyPlacedPieces: React.Dispatch<React.SetStateAction<Set<number>>>
  lastWronglyPlacedPiece: number | null
  setLastWronglyPlacedPiece: React.Dispatch<React.SetStateAction<number | null>>
  onComplete: () => void
}

export const usePuzzleActions = ({
  pieces,
  slots,
  setPieces,
  setSlots,
  wronglyPlacedPieces,
  setWronglyPlacedPieces,
  lastWronglyPlacedPiece,
  setLastWronglyPlacedPiece,
  onComplete,
}: UsePuzzleActionsProps) => {
  // 统一的拼图块放置逻辑
  const placePieceInSlot = useCallback(
    (pieceId: number, slotId: number) => {
      const piece = pieces.find(p => p.id === pieceId)
      const slot = slots.find(s => s.id === slotId)

      if (!piece || !slot) return

      const isCorrectPosition = isPieceCorrectlyPlaced(piece, slot)

      setPieces(prev => prev.map(p => (p.id === pieceId ? { ...p, isPlaced: true } : p)))
      setSlots(prev => prev.map(s => (s.id === slotId ? { ...s, pieceId: pieceId } : s)))

      setWronglyPlacedPieces(prev => {
        const newSet = new Set(prev)
        if (isCorrectPosition) {
          newSet.delete(pieceId)
          if (lastWronglyPlacedPiece === pieceId) {
            setLastWronglyPlacedPiece(null)
          }
        } else {
          newSet.add(pieceId)
          setLastWronglyPlacedPiece(pieceId)
        }
        return newSet
      })

      setTimeout(() => {
        if (isGameComplete(pieces, slots)) {
          onComplete()
        }
      }, 100)
    },
    [
      pieces,
      slots,
      lastWronglyPlacedPiece,
      setPieces,
      setSlots,
      setWronglyPlacedPieces,
      setLastWronglyPlacedPiece,
      onComplete,
    ]
  )

  // 交换两个拼图块的位置
  const swapPieces = useCallback(
    (pieceId1: number, pieceId2: number) => {
      const slot1 = slots.find(s => s.pieceId === pieceId1)
      const slot2 = slots.find(s => s.pieceId === pieceId2)

      if (!slot1 || !slot2) return

      setSlots(prev =>
        prev.map(s => {
          if (s.id === slot1.id) return { ...s, pieceId: pieceId2 }
          if (s.id === slot2.id) return { ...s, pieceId: pieceId1 }
          return s
        })
      )

      const piece1 = pieces.find(p => p.id === pieceId1)
      const piece2 = pieces.find(p => p.id === pieceId2)

      if (piece1 && piece2) {
        let newLastWronglyPlacedPiece = lastWronglyPlacedPiece

        setWronglyPlacedPieces(prev => {
          const newSet = new Set(prev)

          const piece1Correct = isPieceCorrectlyPlaced(piece1, slot2)
          if (piece1Correct) {
            newSet.delete(pieceId1)
            if (newLastWronglyPlacedPiece === pieceId1) {
              newLastWronglyPlacedPiece = null
            }
          } else {
            newSet.add(pieceId1)
            newLastWronglyPlacedPiece = pieceId1
          }

          const piece2Correct = isPieceCorrectlyPlaced(piece2, slot1)
          if (piece2Correct) {
            newSet.delete(pieceId2)
            if (newLastWronglyPlacedPiece === pieceId2) {
              newLastWronglyPlacedPiece = null
            }
          } else {
            newSet.add(pieceId2)
            newLastWronglyPlacedPiece = pieceId2
          }

          return newSet
        })

        setLastWronglyPlacedPiece(newLastWronglyPlacedPiece)
      }

      setTimeout(() => {
        if (isGameComplete(pieces, slots)) {
          onComplete()
        }
      }, 100)
    },
    [
      pieces,
      slots,
      lastWronglyPlacedPiece,
      setSlots,
      setWronglyPlacedPieces,
      setLastWronglyPlacedPiece,
      onComplete,
    ]
  )

  // 用未放置的拼图块替换已放置的拼图块
  const replacePieceWithUnplaced = useCallback(
    (placedPieceId: number, unplacedPieceId: number) => {
      const placedSlot = slots.find(s => s.pieceId === placedPieceId)
      if (!placedSlot) return

      setPieces(prev => prev.map(p => (p.id === placedPieceId ? { ...p, isPlaced: false } : p)))

      setWronglyPlacedPieces(prev => {
        const newSet = new Set(prev)
        newSet.delete(placedPieceId)
        return newSet
      })

      placePieceInSlot(unplacedPieceId, placedSlot.id)
    },
    [slots, setPieces, setWronglyPlacedPieces, placePieceInSlot]
  )

  return {
    placePieceInSlot,
    swapPieces,
    replacePieceWithUnplaced,
  }
}
