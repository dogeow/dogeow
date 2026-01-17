import React, { memo, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Hash } from 'lucide-react'
import { PuzzlePieceItem } from './PuzzlePieceItem'
import { toRoman, type PuzzlePiece } from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

interface PieceSelectionAreaProps {
  pieces: PuzzlePiece[]
  pieceGroups: PuzzlePiece[][]
  colsPerRow: number
  selectionPieceSize: number
  imageUrl: string
  size: number
  imageDimensions: { width: number; height: number }
  draggedPiece: number | null
  showPieceNumbers: boolean
  showDebugInfo: boolean
  piecePreviewVisible: boolean
  piecePreviewPiece: PuzzlePiece | null
  piecePreviewPosition: { x: number; y: number }
  currentTab: string
  tabsNeedScrolling: boolean
  availableHeight: number
  actualAvailableForGrid: number
  maxRows: number
  piecesPerPage: number
  onTabChange: (value: string) => void
  onToggleDebugInfo: () => void
  onTogglePieceNumbers: () => void
  onDragStart: (e: React.DragEvent, pieceId: number) => void
  onDragEnd: () => void
  onPieceClick: (pieceId: number) => void
  onPreviewStart: (e: React.MouseEvent | React.TouchEvent, piece: PuzzlePiece) => void
  onPreviewEnd: () => void
  onTabsScrollingChange: (needsScroll: boolean) => void
}

export const PieceSelectionArea = memo<PieceSelectionAreaProps>(
  ({
    pieces,
    pieceGroups,
    colsPerRow,
    selectionPieceSize,
    imageUrl,
    size,
    imageDimensions,
    draggedPiece,
    showPieceNumbers,
    showDebugInfo,
    piecePreviewVisible,
    piecePreviewPiece,
    piecePreviewPosition,
    currentTab,
    tabsNeedScrolling,
    availableHeight,
    actualAvailableForGrid,
    maxRows,
    piecesPerPage,
    onTabChange,
    onToggleDebugInfo,
    onTogglePieceNumbers,
    onDragStart,
    onDragEnd,
    onPieceClick,
    onPreviewStart,
    onPreviewEnd,
    onTabsScrollingChange,
  }) => {
    const remainingCount = useMemo(() => pieces.filter(piece => !piece.isPlaced).length, [pieces])

    // 检测标签页是否需要滚动
    useEffect(() => {
      if (pieceGroups.length <= 1) {
        onTabsScrollingChange(false)
        return
      }

      const checkTabsScrolling = () => {
        const tabsList = document.querySelector('[role="tablist"]')
        if (tabsList) {
          const needsScroll = tabsList.scrollWidth > tabsList.clientWidth
          onTabsScrollingChange(needsScroll)
        }
      }

      const timer = setTimeout(checkTabsScrolling, 100)
      window.addEventListener('resize', checkTabsScrolling)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', checkTabsScrolling)
      }
    }, [pieceGroups.length, pieces, onTabsScrollingChange])

    return (
      <Card className="w-full max-w-md p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-600">拼图块选择</h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDebugInfo}
              className="h-7 w-7 p-0 text-xs"
              title={showDebugInfo ? '隐藏调试信息' : '显示调试信息'}
            >
              D
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePieceNumbers}
              className="h-7 w-7 p-0"
              title={showPieceNumbers ? '隐藏编号' : '显示编号'}
            >
              <Hash className="h-3 w-3" />
            </Button>
            <span className="text-xs text-gray-500">剩余 {remainingCount} 块</span>
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
              拼图块大小: {selectionPieceSize}px | 最大行数: {maxRows} | 列数: {colsPerRow} | 每页:{' '}
              {piecesPerPage}块 | 总页数: {pieceGroups.length}
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
          <Tabs value={currentTab} onValueChange={onTabChange}>
            <div className="mb-4 w-full overflow-x-auto">
              <TabsList className="inline-flex h-auto min-w-full gap-1 p-1">
                {pieceGroups.map((group, index) => {
                  const remainingCount = group.filter(piece => !piece.isPlaced).length
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
                    <PuzzlePieceItem
                      key={piece.id}
                      piece={piece}
                      pieceSize={selectionPieceSize}
                      imageUrl={imageUrl}
                      size={size}
                      imageDimensions={imageDimensions}
                      isDragged={draggedPiece === piece.id}
                      showPieceNumbers={showPieceNumbers}
                      piecePreviewVisible={piecePreviewVisible}
                      piecePreviewPiece={piecePreviewPiece}
                      piecePreviewPosition={piecePreviewPosition}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onClick={onPieceClick}
                      onPreviewStart={onPreviewStart}
                      onPreviewEnd={onPreviewEnd}
                    />
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
            {pieces.map((piece: PuzzlePiece) => (
              <PuzzlePieceItem
                key={piece.id}
                piece={piece}
                pieceSize={selectionPieceSize}
                imageUrl={imageUrl}
                size={size}
                imageDimensions={imageDimensions}
                isDragged={draggedPiece === piece.id}
                showPieceNumbers={showPieceNumbers}
                piecePreviewVisible={piecePreviewVisible}
                piecePreviewPiece={piecePreviewPiece}
                piecePreviewPosition={piecePreviewPosition}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onPieceClick}
                onPreviewStart={onPreviewStart}
                onPreviewEnd={onPreviewEnd}
              />
            ))}
          </div>
        )}
      </Card>
    )
  }
)

PieceSelectionArea.displayName = 'PieceSelectionArea'
