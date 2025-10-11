/**
 * 拼图游戏逻辑 Hook
 */
import { useState, useCallback } from 'react'
import {
  PuzzlePiece,
  PuzzleSlot,
  initializePuzzlePieces,
  initializePuzzleSlots,
  isPieceCorrectlyPlaced,
  isGameComplete,
} from '../utils/puzzleUtils'

export const useJigsawGame = (
  size: number,
  imageUrl: string,
  puzzleSize: number,
  onComplete: () => void
) => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [slots, setSlots] = useState<PuzzleSlot[]>([])
  const [startTime, setStartTime] = useState(new Date())
  const [isComplete, setIsComplete] = useState(false)
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null)
  const [selectedPlacedPiece, setSelectedPlacedPiece] = useState<number | null>(null)
  const [wronglyPlacedPieces, setWronglyPlacedPieces] = useState<Set<number>>(new Set())
  const [lastWronglyPlacedPiece, setLastWronglyPlacedPiece] = useState<number | null>(null)

  const initializePuzzle = useCallback(() => {
    const newPieces = initializePuzzlePieces(size, imageUrl, puzzleSize)
    const newSlots = initializePuzzleSlots(size)

    setPieces(newPieces)
    setSlots(newSlots)
    setStartTime(new Date())
    setIsComplete(false)
    setWronglyPlacedPieces(new Set())
    setLastWronglyPlacedPiece(null)
  }, [size, imageUrl, puzzleSize])

  const placePieceInSlot = useCallback(
    (pieceId: number, slotId: number) => {
      const piece = pieces.find(p => p.id === pieceId)
      const slot = slots.find(s => s.id === slotId)

      if (!piece || !slot) return

      const isCorrect = isPieceCorrectlyPlaced(piece, slot)

      setPieces(prev => prev.map(p => (p.id === pieceId ? { ...p, isPlaced: true } : p)))
      setSlots(prev => prev.map(s => (s.id === slotId ? { ...s, pieceId: pieceId } : s)))

      setWronglyPlacedPieces(prev => {
        const newSet = new Set(prev)
        if (isCorrect) {
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
          setIsComplete(true)
          onComplete()
        }
      }, 100)
    },
    [pieces, slots, lastWronglyPlacedPiece, onComplete]
  )

  return {
    pieces,
    slots,
    startTime,
    isComplete,
    draggedPiece,
    setDraggedPiece,
    selectedPlacedPiece,
    setSelectedPlacedPiece,
    wronglyPlacedPieces,
    lastWronglyPlacedPiece,
    initializePuzzle,
    placePieceInSlot,
    setPieces,
    setSlots,
    setWronglyPlacedPieces,
    setLastWronglyPlacedPiece,
  }
}
