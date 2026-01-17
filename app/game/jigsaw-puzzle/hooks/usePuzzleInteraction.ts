import { useCallback } from 'react'
import type { PuzzlePiece, PuzzleSlot } from '../utils/puzzleUtils'
import { isPieceCorrectlyPlaced } from '../utils/puzzleUtils'

interface UsePuzzleInteractionProps {
  pieces: PuzzlePiece[]
  slots: PuzzleSlot[]
  draggedPiece: number | null
  setDraggedPiece: React.Dispatch<React.SetStateAction<number | null>>
  selectedPlacedPiece: number | null
  setSelectedPlacedPiece: React.Dispatch<React.SetStateAction<number | null>>
  lastWronglyPlacedPiece: number | null
  setWronglyPlacedPieces: React.Dispatch<React.SetStateAction<Set<number>>>
  setLastWronglyPlacedPiece: React.Dispatch<React.SetStateAction<number | null>>
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>
  setSlots: React.Dispatch<React.SetStateAction<PuzzleSlot[]>>
  placePieceInSlot: (pieceId: number, slotId: number) => void
  swapPieces: (pieceId1: number, pieceId2: number) => void
  replacePieceWithUnplaced: (placedPieceId: number, unplacedPieceId: number) => void
  checkGameCompletion: () => void
}

export const usePuzzleInteraction = ({
  pieces,
  slots,
  draggedPiece,
  setDraggedPiece,
  selectedPlacedPiece,
  setSelectedPlacedPiece,
  lastWronglyPlacedPiece,
  setWronglyPlacedPieces,
  setLastWronglyPlacedPiece,
  setPieces,
  setSlots,
  placePieceInSlot,
  swapPieces,
  replacePieceWithUnplaced,
  checkGameCompletion,
}: UsePuzzleInteractionProps) => {
  // 处理拖拽开始
  const handleDragStart = useCallback(
    (e: React.DragEvent, pieceId: number) => {
      setDraggedPiece(pieceId)
      e.dataTransfer.effectAllowed = 'move'
    },
    [setDraggedPiece]
  )

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
  }, [setDraggedPiece])

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  // 处理放置
  const handleDrop = useCallback(
    (e: React.DragEvent, slotId: number) => {
      e.preventDefault()

      if (draggedPiece === null) return

      const slot = slots.find(s => s.id === slotId)
      if (!slot || slot.pieceId !== null) return

      const piece = pieces.find(p => p.id === draggedPiece)
      if (!piece) return

      placePieceInSlot(draggedPiece, slotId)
      setDraggedPiece(null)

      const isCorrectPosition = isPieceCorrectlyPlaced(piece, slot)
      if (!isCorrectPosition) {
        setLastWronglyPlacedPiece(draggedPiece)
      } else {
        setLastWronglyPlacedPiece(null)
      }
      setSelectedPlacedPiece(null)
    },
    [
      draggedPiece,
      slots,
      pieces,
      placePieceInSlot,
      setDraggedPiece,
      setLastWronglyPlacedPiece,
      setSelectedPlacedPiece,
    ]
  )

  // 处理点击放置（移动端）
  const handlePieceClick = useCallback(
    (pieceId: number) => {
      if (draggedPiece === pieceId) {
        setDraggedPiece(null)
        return
      }

      if (selectedPlacedPiece !== null) {
        replacePieceWithUnplaced(selectedPlacedPiece, pieceId)
        setSelectedPlacedPiece(null)
        setDraggedPiece(null)
        setLastWronglyPlacedPiece(null)
        return
      }

      setSelectedPlacedPiece(null)
      setDraggedPiece(pieceId)
      setLastWronglyPlacedPiece(null)
    },
    [
      draggedPiece,
      selectedPlacedPiece,
      setDraggedPiece,
      setSelectedPlacedPiece,
      setLastWronglyPlacedPiece,
      replacePieceWithUnplaced,
    ]
  )

  // 处理已放置拼图块的点击
  const handlePlacedPieceClick = useCallback(
    (pieceId: number) => {
      if (selectedPlacedPiece === pieceId) {
        setSelectedPlacedPiece(null)
        return
      }

      setDraggedPiece(null)
      setSelectedPlacedPiece(pieceId)
      setLastWronglyPlacedPiece(null)
    },
    [selectedPlacedPiece, setDraggedPiece, setSelectedPlacedPiece, setLastWronglyPlacedPiece]
  )

  // 处理槽位点击（移动端）
  const handleSlotClick = useCallback(
    (slotId: number) => {
      const slot = slots.find(s => s.id === slotId)
      if (!slot) return

      // 优先处理最近错误放置的拼图块
      if (lastWronglyPlacedPiece !== null && slot.pieceId !== lastWronglyPlacedPiece) {
        const originalSlot = slots.find(s => s.pieceId === lastWronglyPlacedPiece)
        if (originalSlot) {
          if (slot.pieceId !== null) {
            swapPieces(lastWronglyPlacedPiece, slot.pieceId)
          } else {
            setSlots(prev =>
              prev.map(s => {
                if (s.id === originalSlot.id) {
                  return { ...s, pieceId: null }
                }
                if (s.id === slotId) {
                  return { ...s, pieceId: lastWronglyPlacedPiece }
                }
                return s
              })
            )

            setWronglyPlacedPieces(prev => {
              const newSet = new Set(prev)
              newSet.delete(lastWronglyPlacedPiece)
              return newSet
            })

            const piece = pieces.find(p => p.id === lastWronglyPlacedPiece)
            if (piece) {
              const isCorrectPosition = isPieceCorrectlyPlaced(piece, slot)
              if (!isCorrectPosition) {
                setWronglyPlacedPieces(prev => {
                  const newSet = new Set(prev)
                  newSet.add(lastWronglyPlacedPiece)
                  return newSet
                })
                setLastWronglyPlacedPiece(lastWronglyPlacedPiece)
              } else {
                setLastWronglyPlacedPiece(null)
              }
            }

            setTimeout(() => {
              checkGameCompletion()
            }, 100)
          }
          return
        }
      }

      if (slot.pieceId !== null) {
        if (selectedPlacedPiece !== null && selectedPlacedPiece !== slot.pieceId) {
          swapPieces(selectedPlacedPiece, slot.pieceId)
          setSelectedPlacedPiece(null)
          return
        }

        if (draggedPiece !== null) {
          replacePieceWithUnplaced(slot.pieceId, draggedPiece)
          setDraggedPiece(null)
          return
        }

        handlePlacedPieceClick(slot.pieceId)
        return
      }

      if (draggedPiece !== null) {
        const piece = pieces.find(p => p.id === draggedPiece)
        if (!piece) return

        placePieceInSlot(draggedPiece, slotId)
        setDraggedPiece(null)
        return
      }

      if (selectedPlacedPiece !== null) {
        const originalSlot = slots.find(s => s.pieceId === selectedPlacedPiece)
        if (originalSlot) {
          setSlots(prev => prev.map(s => (s.id === originalSlot.id ? { ...s, pieceId: null } : s)))

          setWronglyPlacedPieces(prev => {
            const newSet = new Set(prev)
            newSet.delete(selectedPlacedPiece)
            return newSet
          })
        }

        placePieceInSlot(selectedPlacedPiece, slotId)
        setSelectedPlacedPiece(null)
      }
    },
    [
      slots,
      pieces,
      lastWronglyPlacedPiece,
      selectedPlacedPiece,
      draggedPiece,
      setSlots,
      setWronglyPlacedPieces,
      setLastWronglyPlacedPiece,
      setSelectedPlacedPiece,
      setDraggedPiece,
      swapPieces,
      replacePieceWithUnplaced,
      placePieceInSlot,
      handlePlacedPieceClick,
      checkGameCompletion,
    ]
  )

  // 取消所有选择
  const cancelSelection = useCallback(() => {
    setDraggedPiece(null)
    setSelectedPlacedPiece(null)
  }, [setDraggedPiece, setSelectedPlacedPiece])

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handlePieceClick,
    handlePlacedPieceClick,
    handleSlotClick,
    cancelSelection,
  }
}
