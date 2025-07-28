'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export interface VirtualScrollItem {
  id: string | number
  height?: number
}

export interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[]
  itemHeight: number | ((item: T, index: number) => number)
  containerHeight: number
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode
  overscan?: number
  onScroll?: (scrollTop: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  className?: string
  scrollToIndex?: number
  scrollToBottom?: boolean
}

export function VirtualScroll<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = '',
  scrollToIndex,
  scrollToBottom = false,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  // const [isScrolling, setIsScrolling] = useState(false)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate item heights
  const getItemHeight = useCallback(
    (item: T, index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(item, index)
      }
      return itemHeight
    },
    [itemHeight]
  )

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    let height = 0
    const positions: number[] = []

    items.forEach((item, index) => {
      positions[index] = height
      height += getItemHeight(item, index)
    })

    return {
      totalHeight: height,
      itemPositions: positions,
    }
  }, [items, getItemHeight])

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 }
    }

    let start = 0
    let end = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      if (itemPositions[i] + getItemHeight(items[i], i) > scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
    }

    // Find end index
    for (let i = start; i < items.length; i++) {
      if (itemPositions[i] > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + overscan)
        break
      }
    }

    return { start, end }
  }, [items, itemPositions, scrollTop, containerHeight, overscan, getItemHeight])

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop
      setScrollTop(newScrollTop)
      // setIsScrolling(true)

      // Clear existing timeout
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }

      // Set scrolling to false after scroll ends
      scrollingTimeoutRef.current = setTimeout(() => {
        // setIsScrolling(false)
      }, 150)

      onScroll?.(newScrollTop)

      // Load more when near bottom
      if (
        hasMore &&
        !loading &&
        onLoadMore &&
        newScrollTop + containerHeight >= totalHeight - 200
      ) {
        onLoadMore()
      }
    },
    [onScroll, onLoadMore, hasMore, loading, totalHeight, containerHeight]
  )

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollElementRef.current) {
      const targetPosition = itemPositions[scrollToIndex]
      if (targetPosition !== undefined) {
        scrollElementRef.current.scrollTop = targetPosition
      }
    }
  }, [scrollToIndex, itemPositions])

  // Scroll to bottom
  useEffect(() => {
    if (scrollToBottom && scrollElementRef.current) {
      scrollElementRef.current.scrollTop = totalHeight
    }
  }, [scrollToBottom, totalHeight])

  // Render visible items
  const visibleItems = useMemo(() => {
    const items_to_render = []

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i]
      if (!item) continue

      const style: React.CSSProperties = {
        position: 'absolute',
        top: itemPositions[i],
        left: 0,
        right: 0,
        height: getItemHeight(item, i),
      }

      items_to_render.push(
        <div key={item.id} style={style}>
          {renderItem(item, i, style)}
        </div>
      )
    }

    return items_to_render
  }, [visibleRange, items, itemPositions, renderItem, getItemHeight])

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              left: 0,
              right: 0,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading more...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T extends VirtualScrollItem>({}: {
  items: T[]
  containerHeight: number
  itemHeight: number | ((item: T, index: number) => number)
}) {
  const [scrollToIndex, setScrollToIndex] = useState<number>()
  const [scrollToBottom, setScrollToBottom] = useState(false)

  const scrollToItem = useCallback((index: number) => {
    setScrollToIndex(index)
    setScrollToBottom(false)
  }, [])

  const scrollToEnd = useCallback(() => {
    setScrollToBottom(true)
    setScrollToIndex(undefined)
  }, [])

  return {
    scrollToIndex,
    scrollToBottom,
    scrollToItem,
    scrollToEnd,
  }
}
