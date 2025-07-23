'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Hash } from 'lucide-react'
import { useJigsawStats } from '../hooks/useJigsawStats'

// 计时器组件
function Timer({ startTime, isComplete }: { startTime: Date; isComplete: boolean }) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (isComplete) return // 游戏完成时不启动计时器

    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isComplete])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="text-center font-mono">
      <div className="text-sm text-gray-500">用时</div>
      <div className="font-semibold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  )
}

// 拼图游戏组件接口
interface JigsawPuzzleProps {
  imageUrl: string
  size: number
  onComplete: () => void
}

// 拼图块接口
interface PuzzlePiece {
  id: number
  row: number
  col: number
  isPlaced: boolean
  imageStyle: React.CSSProperties
}

// 拼图槽位接口
interface PuzzleSlot {
  id: number
  row: number
  col: number
  pieceId: number | null
}

export default function JigsawPuzzle({ imageUrl, size, onComplete }: JigsawPuzzleProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [slots, setSlots] = useState<PuzzleSlot[]>([])
  const [startTime, setStartTime] = useState(new Date())
  const [isComplete, setIsComplete] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null)

  const [showFloatingReference, setShowFloatingReference] = useState(false)
  const [selectedPlacedPiece, setSelectedPlacedPiece] = useState<number | null>(null)
  const [wronglyPlacedPieces, setWronglyPlacedPieces] = useState<Set<number>>(new Set())
  const [lastWronglyPlacedPiece, setLastWronglyPlacedPiece] = useState<number | null>(null)
  const [magnifierVisible, setMagnifierVisible] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [currentTab, setCurrentTab] = useState('0')
  const [showPieceNumbers, setShowPieceNumbers] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(true) // 默认显示调试信息
  const [tabsNeedScrolling, setTabsNeedScrolling] = useState(false)
  const [piecePreviewVisible, setPiecePreviewVisible] = useState(false)
  const [piecePreviewPiece, setPiecePreviewPiece] = useState<PuzzlePiece | null>(null)
  const [piecePreviewPosition, setPiecePreviewPosition] = useState({ x: 0, y: 0 })
  const [availableHeight, setAvailableHeight] = useState(400) // 初始默认值
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const { stats, updateStats } = useJigsawStats(size)

  // 计算保持长宽比的背景图片尺寸
  const getBackgroundSize = (containerSize: number) => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return `${containerSize * size}px ${containerSize * size}px`
    }

    const aspectRatio = imageDimensions.width / imageDimensions.height
    const totalSize = containerSize * size

    // 使用 cover 的逻辑：确保图片完全覆盖拼图区域
    // 计算需要的尺寸以完全覆盖正方形区域
    if (aspectRatio > 1) {
      // 宽图：以高度为准，宽度按比例放大
      return `${totalSize * aspectRatio}px ${totalSize}px`
    } else {
      // 高图：以宽度为准，高度按比例放大
      return `${totalSize}px ${totalSize / aspectRatio}px`
    }
  }

  // 计算背景位置，确保拼图块显示正确的图片区域
  const getBackgroundPosition = (row: number, col: number, containerSize: number) => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return `-${col * containerSize}px -${row * containerSize}px`
    }

    const aspectRatio = imageDimensions.width / imageDimensions.height
    const totalSize = containerSize * size

    if (aspectRatio > 1) {
      // 宽图：需要水平居中
      const actualWidth = totalSize * aspectRatio
      const offsetX = (actualWidth - totalSize) / 2
      return `-${col * containerSize + offsetX / size}px -${row * containerSize}px`
    } else {
      // 高图：需要垂直居中
      const actualHeight = totalSize / aspectRatio
      const offsetY = (actualHeight - totalSize) / 2
      return `-${col * containerSize}px -${row * containerSize + offsetY / size}px`
    }
  }

  const puzzleSize = Math.min(400, Math.max(300, 60 * size)) // 动态调整拼图总大小
  const pieceSize = puzzleSize / size
  const selectionPieceSize = Math.max(60, Math.min(80, 480 / size)) // 选择区域的拼图块大小
  // 初始化拼图
  const initializePuzzle = useCallback(() => {
    const totalPieces = size * size

    const newPieces: PuzzlePiece[] = []
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / size)
      const col = i % size

      newPieces.push({
        id: i,
        row,
        col,
        isPlaced: false,
        imageStyle: {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
          backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
          backgroundRepeat: 'no-repeat',
        },
      })
    }

    const shuffledPieces = [...newPieces].sort(() => Math.random() - 0.5)

    const newSlots: PuzzleSlot[] = []
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / size)
      const col = i % size

      newSlots.push({
        id: i,
        row,
        col,
        pieceId: null,
      })
    }

    setPieces(shuffledPieces)
    setSlots(newSlots)
    setStartTime(new Date())
    setIsComplete(false)
    setWronglyPlacedPieces(new Set())
    setLastWronglyPlacedPiece(null)
  }, [imageUrl, size, pieceSize, puzzleSize])

  // 图片加载完成后初始化拼图
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        setImageLoaded(true)
        initializePuzzle()
      }
      img.onerror = () => {
        console.error('图片加载失败')
        setImageLoaded(false)
      }
      img.src = imageUrl
    }
  }, [imageUrl, initializePuzzle])

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 计算可用高度
  useEffect(() => {
    const calculateAvailableHeight = () => {
      const windowHeight = window.innerHeight

      // 更精确地计算已占用的高度
      const appBarHeight = 64 // 导航栏高度
      const gameInfoCardHeight = 140 // 游戏信息卡片高度（包含内边距）
      const puzzleAreaHeight = puzzleSize + 60 // 拼图区域 + 标题 + 边距
      const statisticsCardHeight = stats.gamesCompleted > 0 ? 120 : 0 // 统计信息卡片
      const verticalSpacing = 80 // 各种垂直间距

      const usedHeight =
        appBarHeight +
        gameInfoCardHeight +
        puzzleAreaHeight +
        statisticsCardHeight +
        verticalSpacing

      // 为拼图块选择区域保留的高度，最少300px，最多不超过屏幕的60%
      const available = Math.max(300, Math.min(windowHeight * 0.6, windowHeight - usedHeight))
      setAvailableHeight(available)
    }

    calculateAvailableHeight()
    window.addEventListener('resize', calculateAvailableHeight)

    return () => {
      window.removeEventListener('resize', calculateAvailableHeight)
    }
  }, [puzzleSize, stats.gamesCompleted])

  // 取消所有选择
  const cancelSelection = () => {
    setDraggedPiece(null)
    setSelectedPlacedPiece(null)
  }

  // 处理放大镜事件
  const handleMagnifierStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setMagnifierPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    setMagnifierVisible(true)
  }

  const handleMagnifierMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!magnifierVisible) return
    e.preventDefault()

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setMagnifierPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  const handleMagnifierEnd = () => {
    setMagnifierVisible(false)
  }

  // 处理拼图块预览事件
  const handlePiecePreviewStart = (e: React.MouseEvent | React.TouchEvent, piece: PuzzlePiece) => {
    e.preventDefault()
    e.stopPropagation()

    // 获取拼图块元素的位置
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPiecePreviewPosition({
      x: rect.left + rect.width / 2, // 拼图块中心的 x 坐标
      y: rect.top, // 拼图块顶部的 y 坐标
    })

    setPiecePreviewPiece(piece)
    setPiecePreviewVisible(true)
  }

  const handlePiecePreviewEnd = () => {
    setPiecePreviewVisible(false)
    setPiecePreviewPiece(null)
  }

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    setDraggedPiece(pieceId)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedPiece(null)
  }

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // 处理放置
  const handleDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault()

    if (draggedPiece === null) return

    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.pieceId !== null) return

    const piece = pieces.find(p => p.id === draggedPiece)
    if (!piece) return

    const pieceId = draggedPiece
    placePieceInSlot(pieceId, slotId)
    setDraggedPiece(null)

    // 检查是否放置正确，如果错误则记录最近错误放置的拼图块
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
    if (!isCorrectPosition) {
      setLastWronglyPlacedPiece(pieceId)
    } else {
      setLastWronglyPlacedPiece(null)
    }
    setSelectedPlacedPiece(null)
  }

  // 处理点击放置（移动端）
  const handlePieceClick = (pieceId: number) => {
    if (draggedPiece === pieceId) {
      setDraggedPiece(null)
      return
    }

    // 如果有选中的已放置拼图块，则进行替换
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
  }

  // 处理已放置拼图块的点击
  const handlePlacedPieceClick = (pieceId: number) => {
    if (selectedPlacedPiece === pieceId) {
      setSelectedPlacedPiece(null)
      return
    }

    setDraggedPiece(null)
    setSelectedPlacedPiece(pieceId)
    setLastWronglyPlacedPiece(null)
  }

  // 交换两个拼图块的位置
  const swapPieces = (pieceId1: number, pieceId2: number) => {
    const slot1 = slots.find(s => s.pieceId === pieceId1)
    const slot2 = slots.find(s => s.pieceId === pieceId2)

    if (!slot1 || !slot2) return

    // 交换槽位中的拼图块
    setSlots(prev =>
      prev.map(s => {
        if (s.id === slot1.id) return { ...s, pieceId: pieceId2 }
        if (s.id === slot2.id) return { ...s, pieceId: pieceId1 }
        return s
      })
    )

    // 更新错误状态
    const piece1 = pieces.find(p => p.id === pieceId1)
    const piece2 = pieces.find(p => p.id === pieceId2)

    if (piece1 && piece2) {
      let newLastWronglyPlacedPiece = lastWronglyPlacedPiece

      setWronglyPlacedPieces(prev => {
        const newSet = new Set(prev)

        // 检查piece1在slot2的位置是否正确
        const piece1Correct = piece1.row === slot2.row && piece1.col === slot2.col
        if (piece1Correct) {
          newSet.delete(pieceId1)
          // 如果这个拼图块之前是错误的，现在正确了，清除记录
          if (newLastWronglyPlacedPiece === pieceId1) {
            newLastWronglyPlacedPiece = null
          }
        } else {
          newSet.add(pieceId1)
          // 如果这个拼图块现在错误了，记住它
          newLastWronglyPlacedPiece = pieceId1
        }

        // 检查piece2在slot1的位置是否正确
        const piece2Correct = piece2.row === slot1.row && piece2.col === slot1.col
        if (piece2Correct) {
          newSet.delete(pieceId2)
          // 如果这个拼图块之前是错误的，现在正确了，清除记录
          if (newLastWronglyPlacedPiece === pieceId2) {
            newLastWronglyPlacedPiece = null
          }
        } else {
          newSet.add(pieceId2)
          // 如果这个拼图块现在错误了，记住它（优先记住piece2）
          newLastWronglyPlacedPiece = pieceId2
        }

        return newSet
      })

      // 更新最近错误放置的拼图块
      setLastWronglyPlacedPiece(newLastWronglyPlacedPiece)
    }

    setTimeout(() => {
      checkGameCompletion()
    }, 100)
  }

  // 用未放置的拼图块替换已放置的拼图块
  const replacePieceWithUnplaced = (placedPieceId: number, unplacedPieceId: number) => {
    const placedSlot = slots.find(s => s.pieceId === placedPieceId)
    if (!placedSlot) return

    // 将已放置的拼图块设为未放置状态
    setPieces(prev => prev.map(p => (p.id === placedPieceId ? { ...p, isPlaced: false } : p)))

    // 从错误状态中移除原来的拼图块
    setWronglyPlacedPieces(prev => {
      const newSet = new Set(prev)
      newSet.delete(placedPieceId)
      return newSet
    })

    // 将新的拼图块放置到该位置
    placePieceInSlot(unplacedPieceId, placedSlot.id)
  }

  // 处理槽位点击（移动端）
  const handleSlotClick = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return

    // 优先处理最近错误放置的拼图块 - 用户可以立即点击其他位置移动它
    if (lastWronglyPlacedPiece !== null && slot.pieceId !== lastWronglyPlacedPiece) {
      const originalSlot = slots.find(s => s.pieceId === lastWronglyPlacedPiece)
      if (originalSlot) {
        // 如果目标槽位已有拼图块，则交换位置
        if (slot.pieceId !== null) {
          swapPieces(lastWronglyPlacedPiece, slot.pieceId)
        } else {
          // 如果目标槽位为空，则直接移动
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

          // 从错误状态中移除（因为已经移走了）
          setWronglyPlacedPieces(prev => {
            const newSet = new Set(prev)
            newSet.delete(lastWronglyPlacedPiece)
            return newSet
          })

          // 重新检查新位置是否正确
          const piece = pieces.find(p => p.id === lastWronglyPlacedPiece)
          if (piece) {
            const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
            if (!isCorrectPosition) {
              setWronglyPlacedPieces(prev => {
                const newSet = new Set(prev)
                newSet.add(lastWronglyPlacedPiece)
                return newSet
              })
              // 如果新位置仍然错误，继续记住这个拼图块
              setLastWronglyPlacedPiece(lastWronglyPlacedPiece)
            } else {
              // 如果新位置正确，清除记录
              setLastWronglyPlacedPiece(null)
            }
          }

          // 检查游戏完成状态
          setTimeout(() => {
            checkGameCompletion()
          }, 100)
        }

        // 注意：不要在这里清除 lastWronglyPlacedPiece，因为上面的逻辑已经处理了

        return
      }
    }

    // 如果点击的槽位有拼图块
    if (slot.pieceId !== null) {
      // 如果有选中的已放置拼图块，则交换位置
      if (selectedPlacedPiece !== null && selectedPlacedPiece !== slot.pieceId) {
        swapPieces(selectedPlacedPiece, slot.pieceId)
        setSelectedPlacedPiece(null)
        return
      }

      // 如果有选中的未放置拼图块，则进行替换
      if (draggedPiece !== null) {
        replacePieceWithUnplaced(slot.pieceId, draggedPiece)
        setDraggedPiece(null)
        return
      }

      // 否则选中这个拼图块
      handlePlacedPieceClick(slot.pieceId)
      return
    }

    // 如果点击的是空槽位
    if (draggedPiece !== null) {
      const piece = pieces.find(p => p.id === draggedPiece)
      if (!piece) return

      placePieceInSlot(draggedPiece, slotId)
      setDraggedPiece(null)
      return
    }

    if (selectedPlacedPiece !== null) {
      // 先从原位置移除拼图块
      const originalSlot = slots.find(s => s.pieceId === selectedPlacedPiece)
      if (originalSlot) {
        setSlots(prev => prev.map(s => (s.id === originalSlot.id ? { ...s, pieceId: null } : s)))

        // 从错误状态中移除（因为已经移走了）
        setWronglyPlacedPieces(prev => {
          const newSet = new Set(prev)
          newSet.delete(selectedPlacedPiece)
          return newSet
        })
      }

      // 放置到新位置
      placePieceInSlot(selectedPlacedPiece, slotId)

      // 清除选中状态，允许用户继续操作其他拼图块
      setSelectedPlacedPiece(null)

      return
    }
  }

  // 统一的拼图块放置逻辑
  const placePieceInSlot = (pieceId: number, slotId: number) => {
    const piece = pieces.find(p => p.id === pieceId)
    const slot = slots.find(s => s.id === slotId)

    if (!piece || !slot) return

    // 检查是否放置正确
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col

    setPieces(prev => prev.map(p => (p.id === pieceId ? { ...p, isPlaced: true } : p)))

    setSlots(prev => prev.map(s => (s.id === slotId ? { ...s, pieceId: pieceId } : s)))

    // 立即更新错误放置的拼图块状态
    setWronglyPlacedPieces(prev => {
      const newSet = new Set(prev)
      if (isCorrectPosition) {
        newSet.delete(pieceId)
        // 如果放置正确，清除最近错误放置的记录
        if (lastWronglyPlacedPiece === pieceId) {
          setLastWronglyPlacedPiece(null)
        }
      } else {
        newSet.add(pieceId)
        // 如果放置错误，记住这个拼图块，用户可以立即点击其他位置移动它
        setLastWronglyPlacedPiece(pieceId)
      }
      return newSet
    })

    setTimeout(() => {
      checkGameCompletion()
    }, 100)
  }

  // 检查游戏完成状态
  const checkGameCompletion = () => {
    const allPiecesPlaced = pieces.every(p => p.isPlaced)
    if (!allPiecesPlaced) return

    const allInCorrectPosition = pieces.every(p => {
      const currentSlot = slots.find(s => s.pieceId === p.id)
      return currentSlot && currentSlot.row === p.row && currentSlot.col === p.col
    })

    if (allInCorrectPosition) {
      setIsComplete(true)
      const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      updateStats(completionTime, pieces.length)
      onComplete()
    }
  }

  // 重新开始游戏
  const resetGame = () => {
    initializePuzzle()
    setCurrentTab('0')
    setDraggedPiece(null)
    setSelectedPlacedPiece(null)
    setWronglyPlacedPieces(new Set())
    setLastWronglyPlacedPiece(null)
    setMagnifierVisible(false)
  }

  // 获取所有拼图块
  const allPiecesForDisplay = pieces

  // 计算动态分页逻辑
  const colsPerRow = Math.min(4, Math.ceil(Math.sqrt(allPiecesForDisplay.length))) // 每排最多4列

  // 根据可用高度动态计算可显示的行数
  const cardHeaderHeight = 60 // 卡片标题和按钮区域高度
  const debugInfoHeight = showDebugInfo ? 50 : 0 // 调试信息高度（可选）
  const cardPadding = 32 // 卡片内边距

  // 先假设有标签页，计算可用空间
  const tabsHeight = 50 // 标签页高度
  const availableForGrid = Math.max(
    120,
    availableHeight - cardHeaderHeight - tabsHeight - debugInfoHeight - cardPadding
  )
  const maxRows = Math.max(2, Math.floor(availableForGrid / (selectionPieceSize + 8))) // 每个拼图块高度 + 间距

  const piecesPerPage = maxRows * colsPerRow // 每页最多显示的拼图块数量

  // 将拼图块分组到不同的标签页
  const pieceGroups = []
  for (let i = 0; i < allPiecesForDisplay.length; i += piecesPerPage) {
    pieceGroups.push(allPiecesForDisplay.slice(i, i + piecesPerPage))
  }

  // 如果只有一页，重新计算可用空间（不需要标签页高度）
  const actualAvailableForGrid =
    pieceGroups.length > 1
      ? availableForGrid
      : Math.max(120, availableHeight - cardHeaderHeight - debugInfoHeight - cardPadding)

  // 罗马数字转换函数
  const toRoman = (num: number): string => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
    return romanNumerals[num - 1] || num.toString()
  }

  // 检测标签页是否需要滚动
  const placedPiecesCount = pieces.filter(p => p.isPlaced).length
  useEffect(() => {
    if (pieceGroups.length <= 1) {
      setTabsNeedScrolling(false)
      return
    }

    const checkTabsScrolling = () => {
      const tabsList = document.querySelector('[role="tablist"]')
      if (tabsList) {
        const needsScroll = tabsList.scrollWidth > tabsList.clientWidth
        setTabsNeedScrolling(needsScroll)
      }
    }

    // 延迟检测，确保DOM已渲染
    const timer = setTimeout(checkTabsScrolling, 100)

    window.addEventListener('resize', checkTabsScrolling)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkTabsScrolling)
    }
  }, [pieceGroups.length, placedPiecesCount]) // 当标签页数量或拼图块状态变化时重新检测

  if (!imageLoaded) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-64 w-64 rounded-lg bg-gray-200"></div>
          <p>加载图片中...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 游戏信息和操作提示 */}
      <Card className="w-full max-w-4xl p-4">
        <div className="flex flex-col space-y-3">
          {/* 主要游戏信息 */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="font-semibold">
                {pieces.filter(p => p.isPlaced).length}/{pieces.length}
              </div>
            </div>
            <Timer startTime={startTime} isComplete={isComplete} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFloatingReference(!showFloatingReference)}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                {showFloatingReference ? '隐藏' : '显示'}参考
              </Button>
              <Button variant="outline" size="sm" onClick={resetGame}>
                重新开始
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">完成进度</span>
              <span className="text-xs font-medium text-gray-700">
                {Math.round((pieces.filter(p => p.isPlaced).length / pieces.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                style={{
                  width: `${pieces.length > 0 ? (pieces.filter(p => p.isPlaced).length / pieces.length) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <div className="relative flex w-full max-w-6xl flex-col items-center justify-center gap-6 lg:flex-row">
        {/* 浮动原图参考 */}
        {showFloatingReference && (
          <div className="fixed top-4 right-4 z-50 lg:absolute lg:top-0 lg:right-0 lg:z-10">
            <Card className="border-primary/20 border-2 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">原图参考</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFloatingReference(false)}
                  className="h-5 w-5 p-0 hover:bg-gray-100"
                >
                  <EyeOff className="h-3 w-3" />
                </Button>
              </div>
              <div className="relative h-32 w-32 overflow-hidden rounded border border-gray-200">
                <div
                  className="relative h-full w-full cursor-crosshair"
                  onMouseDown={handleMagnifierStart}
                  onMouseMove={handleMagnifierMove}
                  onMouseUp={handleMagnifierEnd}
                  onMouseLeave={handleMagnifierEnd}
                  onTouchStart={handleMagnifierStart}
                  onTouchMove={handleMagnifierMove}
                  onTouchEnd={handleMagnifierEnd}
                >
                  <Image
                    src={imageUrl}
                    alt="浮动原图参考"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />

                  {/* 放大镜 */}
                  {magnifierVisible && (
                    <div
                      className="pointer-events-none absolute z-50"
                      style={{
                        left: `${magnifierPosition.x}%`,
                        top: `${magnifierPosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: '500%',
                            backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        {/* 十字准线 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-0.5 w-full bg-red-500 opacity-50"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-full w-0.5 bg-red-500 opacity-50"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 拼图区域 */}
        <div className="flex flex-col items-center">
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
                slot.pieceId !== null ? pieces.find(p => p.id === slot.pieceId) : null
              const isSelected = selectedPlacedPiece === slot.pieceId
              const isWronglyPlaced = placedPiece && wronglyPlacedPieces.has(placedPiece.id)

              // 使用拼图块自己的图片样式，而不是根据槽位位置计算
              const slotImageStyle = placedPiece
                ? {
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: getBackgroundSize(pieceSize),
                    backgroundPosition: getBackgroundPosition(
                      placedPiece.row,
                      placedPiece.col,
                      pieceSize
                    ),
                    backgroundRepeat: 'no-repeat',
                  }
                : {}

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, slot.id)}
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
                ></div>
              )
            })}
          </div>

          {isComplete && (
            <div className="mt-4 animate-bounce text-center">
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 shadow-lg">
                <p className="mb-2 text-xl font-bold text-green-600">🎉 恭喜完成！</p>
                <div className="mb-3 text-sm text-gray-600">
                  <p>用时 {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)} 秒</p>
                  {stats.gamesCompleted > 1 &&
                    stats.bestTime ===
                      Math.floor((new Date().getTime() - startTime.getTime()) / 1000) && (
                      <p className="mt-1 font-medium text-green-600">⚡ 新的最佳时间记录！</p>
                    )}
                </div>
                <Button onClick={resetGame} className="mt-2" size="sm">
                  再玩一次
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 拼图块选择区域 */}
        <div className="flex w-full flex-col items-center space-y-4 lg:w-auto">
          {/* 统计信息 */}
          {stats.gamesCompleted > 0 && (
            <Card className="w-full max-w-md p-3">
              <h4 className="mb-2 text-sm font-medium text-gray-600">个人记录</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">最佳时间:</span>
                  <span className="font-mono">
                    {stats.bestTime
                      ? `${Math.floor(stats.bestTime / 60)}:${(stats.bestTime % 60).toString().padStart(2, '0')}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">完成次数:</span>
                  <span className="font-mono">{stats.gamesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">总拼图块:</span>
                  <span className="font-mono">{stats.totalPiecesPlaced}</span>
                </div>
              </div>
            </Card>
          )}

          <Card className="w-full max-w-md p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-600">拼图块选择</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="h-7 w-7 p-0 text-xs"
                  title={showDebugInfo ? '隐藏调试信息' : '显示调试信息'}
                >
                  D
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPieceNumbers(!showPieceNumbers)}
                  className="h-7 w-7 p-0"
                  title={showPieceNumbers ? '隐藏编号' : '显示编号'}
                >
                  <Hash className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-500">
                  剩余 {allPiecesForDisplay.filter(piece => !piece.isPlaced).length} 块
                </span>
              </div>
            </div>

            {/* 调试信息 */}
            {showDebugInfo && (
              <div className="mb-2 rounded bg-gray-50 p-2 text-xs text-gray-400">
                <div>
                  屏幕高度: {typeof window !== 'undefined' ? window.innerHeight : 0}px | 可用高度:{' '}
                  {availableHeight}px | 网格空间: {actualAvailableForGrid}px
                </div>
                <div>
                  拼图块大小: {selectionPieceSize}px | 最大行数: {maxRows} | 列数: {colsPerRow} |
                  每页: {piecesPerPage}块 | 总页数: {pieceGroups.length}
                </div>
                <div>
                  标签页滚动: {tabsNeedScrolling ? '是' : '否'} | 表情符号标签页:{' '}
                  {
                    pieceGroups.filter(
                      group => tabsNeedScrolling && group.filter(p => !p.isPlaced).length === 0
                    ).length
                  }
                  个
                </div>
              </div>
            )}

            {pieceGroups.length > 1 ? (
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <div className="mb-4 w-full overflow-x-auto">
                  <TabsList className="inline-flex h-auto min-w-full gap-1 p-1">
                    {pieceGroups.map((group, index) => {
                      const remainingCount = group.filter(piece => !piece.isPlaced).length

                      // 如果需要滚动且该标签页剩余数量为0，显示表情符号
                      const showEmoji = tabsNeedScrolling && remainingCount === 0

                      return (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className={`flex-shrink-0 px-2 py-1 text-xs whitespace-nowrap ${
                            showEmoji ? 'min-w-[32px] justify-center' : ''
                          }`}
                          title={showEmoji ? `第${toRoman(index + 1)}页 - 已完成` : undefined}
                        >
                          {showEmoji ? '😑' : `${toRoman(index + 1)} (${remainingCount})`}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>

                {pieceGroups.map((group, groupIndex) => (
                  <TabsContent key={groupIndex} value={groupIndex.toString()}>
                    <div
                      className="grid justify-items-center gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${colsPerRow}, 1fr)`,
                      }}
                    >
                      {group.map((piece: PuzzlePiece) => (
                        <div
                          key={piece.id}
                          data-piece-id={piece.id}
                          className={`relative flex items-center justify-center rounded border-2 transition-all duration-200 ${
                            piece.isPlaced
                              ? 'border-dashed border-gray-200 bg-gray-50/30 opacity-30'
                              : `cursor-pointer ${
                                  draggedPiece === piece.id
                                    ? 'scale-105 border-blue-400 bg-blue-50 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm'
                                }`
                          } `}
                          style={{
                            width: `${selectionPieceSize}px`,
                            height: `${selectionPieceSize}px`,
                            ...(piece.isPlaced
                              ? {}
                              : {
                                  backgroundSize: getBackgroundSize(selectionPieceSize),
                                  backgroundImage: `url(${imageUrl})`,
                                  backgroundPosition: getBackgroundPosition(
                                    piece.row,
                                    piece.col,
                                    selectionPieceSize
                                  ),
                                  backgroundRepeat: 'no-repeat',
                                }),
                          }}
                          {...(!piece.isPlaced && {
                            draggable: true,
                            onClick: () => handlePieceClick(piece.id),
                            onDragStart: (e: React.DragEvent) => handleDragStart(e, piece.id),
                            onDragEnd: handleDragEnd,
                            onMouseDown: (e: React.MouseEvent) => handlePiecePreviewStart(e, piece),
                            onMouseUp: handlePiecePreviewEnd,
                            onMouseLeave: handlePiecePreviewEnd,
                            onTouchStart: (e: React.TouchEvent) =>
                              handlePiecePreviewStart(e, piece),
                            onTouchEnd: handlePiecePreviewEnd,
                          })}
                        >
                          {/* 拼图块编号（可选显示） */}
                          {!piece.isPlaced && showPieceNumbers && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-xs text-white opacity-80">
                              {piece.id + 1}
                            </div>
                          )}

                          {/* 拼图块预览 */}
                          {!piece.isPlaced &&
                            piecePreviewVisible &&
                            piecePreviewPiece?.id === piece.id && (
                              <div
                                className="pointer-events-none fixed z-50"
                                style={{
                                  left: `${piecePreviewPosition.x}px`,
                                  top: `${piecePreviewPosition.y - 220}px`, // 在拼图块上方显示
                                  transform: 'translateX(-50%)', // 水平居中
                                }}
                              >
                                <div className="relative rounded-lg border bg-white p-3 shadow-2xl">
                                  <div
                                    className="h-40 w-40 rounded border"
                                    style={{
                                      backgroundImage: `url(${imageUrl})`,
                                      backgroundSize: getBackgroundSize(40),
                                      backgroundPosition: getBackgroundPosition(
                                        piece.row,
                                        piece.col,
                                        40
                                      ),
                                      backgroundRepeat: 'no-repeat',
                                    }}
                                  />
                                  <div className="mt-2 text-center text-xs text-gray-600">
                                    拼图块 {piece.id + 1}
                                  </div>
                                  {/* 小箭头指向拼图块 */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 transform">
                                    <div className="h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white border-r-transparent border-l-transparent"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div
                className="grid justify-items-center gap-2"
                style={{
                  gridTemplateColumns: `repeat(${colsPerRow}, 1fr)`,
                }}
              >
                {allPiecesForDisplay.map((piece: PuzzlePiece) => (
                  <div
                    key={piece.id}
                    data-piece-id={piece.id}
                    className={`relative flex items-center justify-center rounded border-2 transition-all duration-200 ${
                      piece.isPlaced
                        ? 'border-dashed border-gray-200 bg-gray-50/30 opacity-30'
                        : `cursor-pointer ${
                            draggedPiece === piece.id
                              ? 'scale-105 border-blue-400 bg-blue-50 shadow-md'
                              : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm'
                          }`
                    } `}
                    style={{
                      width: `${selectionPieceSize}px`,
                      height: `${selectionPieceSize}px`,
                      ...(piece.isPlaced
                        ? {}
                        : {
                            backgroundSize: getBackgroundSize(selectionPieceSize),
                            backgroundImage: `url(${imageUrl})`,
                            backgroundPosition: getBackgroundPosition(
                              piece.row,
                              piece.col,
                              selectionPieceSize
                            ),
                            backgroundRepeat: 'no-repeat',
                          }),
                    }}
                    {...(!piece.isPlaced && {
                      draggable: true,
                      onClick: () => handlePieceClick(piece.id),
                      onDragStart: (e: React.DragEvent) => handleDragStart(e, piece.id),
                      onDragEnd: handleDragEnd,
                      onMouseDown: (e: React.MouseEvent) => handlePiecePreviewStart(e, piece),
                      onMouseUp: handlePiecePreviewEnd,
                      onMouseLeave: handlePiecePreviewEnd,
                      onTouchStart: (e: React.TouchEvent) => handlePiecePreviewStart(e, piece),
                      onTouchEnd: handlePiecePreviewEnd,
                    })}
                  >
                    {/* 拼图块编号（可选显示） */}
                    {!piece.isPlaced && showPieceNumbers && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-xs text-white opacity-80">
                        {piece.id + 1}
                      </div>
                    )}

                    {/* 拼图块预览 */}
                    {!piece.isPlaced &&
                      piecePreviewVisible &&
                      piecePreviewPiece?.id === piece.id && (
                        <div
                          className="pointer-events-none fixed z-50"
                          style={{
                            left: `${piecePreviewPosition.x}px`,
                            top: `${piecePreviewPosition.y - 220}px`, // 在拼图块上方显示
                            transform: 'translateX(-50%)', // 水平居中
                          }}
                        >
                          <div className="relative rounded-lg border bg-white p-3 shadow-2xl">
                            <div
                              className="h-40 w-40 rounded border"
                              style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: getBackgroundSize(40),
                                backgroundPosition: getBackgroundPosition(piece.row, piece.col, 40),
                                backgroundRepeat: 'no-repeat',
                              }}
                            />
                            <div className="mt-2 text-center text-xs text-gray-600">
                              拼图块 {piece.id + 1}
                            </div>
                            {/* 小箭头指向拼图块 */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 transform">
                              <div className="h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white border-r-transparent border-l-transparent"></div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
