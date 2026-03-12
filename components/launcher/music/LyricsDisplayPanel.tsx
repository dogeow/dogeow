'use client'

import React, { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/helpers'
import type { LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'

interface LyricsDisplayPanelProps {
  lyrics: LyricLine[]
  activeLyricIndex: number
  status: LyricsState
  title?: string
  className?: string
  titleClassName?: string
  bodyClassName?: string
  lineClassName?: string
  activeLineClassName?: string
  emptyClassName?: string
  syncKey?: string
}

function getEmptyText(status: LyricsState) {
  if (status === 'loading') {
    return '歌词加载中...'
  }

  if (status === 'error') {
    return '歌词加载失败'
  }

  if (status === 'idle') {
    return '选择歌曲后显示歌词'
  }

  return ''
}

export function LyricsDisplayPanel({
  lyrics,
  activeLyricIndex,
  status,
  title,
  className,
  titleClassName,
  bodyClassName,
  lineClassName,
  activeLineClassName,
  emptyClassName,
  syncKey,
}: LyricsDisplayPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([])

  useLayoutEffect(() => {
    if (activeLyricIndex < 0) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const activeLine = lineRefs.current[activeLyricIndex]
      const container = scrollContainerRef.current

      if (!activeLine || !container) {
        return
      }

      const nextTop =
        activeLine.offsetTop - container.clientHeight / 2 + activeLine.clientHeight / 2
      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activeLyricIndex, lyrics, syncKey])

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-2xl border border-border/50 bg-muted/35 p-4 shadow-sm',
        className
      )}
    >
      {title && (
        <div
          className={cn(
            'mb-3 truncate text-center text-sm font-medium text-muted-foreground',
            titleClassName
          )}
        >
          {title}
        </div>
      )}

      {lyrics.length === 0 ? (
        <div
          className={cn(
            'flex flex-1 items-center justify-center text-center text-sm text-muted-foreground',
            emptyClassName
          )}
        >
          {getEmptyText(status)}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className={cn('flex-1 overflow-y-auto px-2 py-6', bodyClassName)}
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-3">
            {lyrics.map((line, index) => (
              <p
                key={`${line.time}-${index}`}
                ref={node => {
                  lineRefs.current[index] = node
                }}
                className={cn(
                  'min-h-7 w-full max-w-2xl text-center text-sm leading-7 text-foreground/55 transition-all duration-200',
                  lineClassName,
                  index === activeLyricIndex &&
                    cn('text-base font-semibold text-foreground', activeLineClassName)
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
