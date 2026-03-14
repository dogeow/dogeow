'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/helpers'
import { getLyricGlyphProgress, type LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'

interface LyricsDisplayPanelProps {
  lyrics: LyricLine[]
  activeLyricIndex: number
  status: LyricsState
  currentTime?: number
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

function renderGlyphChar(char: string) {
  if (char === ' ') {
    return '\u00A0'
  }

  if (char === '\t') {
    return '\u00A0\u00A0'
  }

  return char
}

export function LyricsDisplayPanel({
  lyrics,
  activeLyricIndex,
  status,
  currentTime = 0,
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
  const [containerHeight, setContainerHeight] = useState(0)
  const [activeLineHeight, setActiveLineHeight] = useState(28)

  const measureLayout = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const sampleLine =
      lineRefs.current[activeLyricIndex] ??
      lineRefs.current.find((line): line is HTMLParagraphElement => Boolean(line)) ??
      null

    const nextContainerHeight = container.clientHeight
    const nextLineHeight = sampleLine?.clientHeight ?? 28

    setContainerHeight(prev => (prev === nextContainerHeight ? prev : nextContainerHeight))
    setActiveLineHeight(prev => (prev === nextLineHeight ? prev : nextLineHeight))
  }, [activeLyricIndex])

  const edgeSpacerHeight = useMemo(
    () => Math.max(24, containerHeight / 2 - activeLineHeight / 2),
    [activeLineHeight, containerHeight]
  )

  const syncToActiveLine = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (activeLyricIndex < 0) {
        return
      }

      const activeLine = lineRefs.current[activeLyricIndex]
      const container = scrollContainerRef.current

      if (!activeLine || !container) {
        return
      }

      const nextTop =
        activeLine.offsetTop - container.clientHeight / 2 + activeLine.clientHeight / 2
      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior,
      })
    },
    [activeLyricIndex]
  )

  useLayoutEffect(() => {
    if (activeLyricIndex < 0) {
      return
    }

    measureLayout()

    const frameId = window.requestAnimationFrame(() => {
      measureLayout()
      syncToActiveLine('smooth')
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activeLyricIndex, edgeSpacerHeight, lyrics, measureLayout, syncKey, syncToActiveLine])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    let frameId: number | null = null
    const syncOnResize = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      frameId = window.requestAnimationFrame(() => {
        measureLayout()
        syncToActiveLine('auto')
      })
    }

    syncOnResize()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(syncOnResize)
      observer.observe(container)

      return () => {
        if (frameId) {
          window.cancelAnimationFrame(frameId)
        }
        observer.disconnect()
      }
    }

    window.addEventListener('resize', syncOnResize)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('resize', syncOnResize)
    }
  }, [measureLayout, syncToActiveLine])

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
          className={cn('scrollbar-none flex-1 overflow-y-auto px-2', bodyClassName)}
        >
          <div
            className="flex flex-col items-center gap-3"
            style={{
              paddingTop: edgeSpacerHeight,
              paddingBottom: edgeSpacerHeight,
            }}
          >
            {lyrics.map((line, index) => (
              <p
                key={`${line.time}-${index}`}
                ref={node => {
                  lineRefs.current[index] = node
                }}
                aria-label={line.text}
                className={cn(
                  'min-h-7 w-full max-w-2xl text-center text-sm leading-7 text-foreground/55 transition-all duration-200',
                  lineClassName,
                  index === activeLyricIndex &&
                    cn('text-base font-semibold text-foreground', activeLineClassName)
                )}
              >
                {index === activeLyricIndex && line.glyphs?.length ? (
                  <span
                    aria-hidden="true"
                    className="inline-flex max-w-full flex-wrap justify-center [text-wrap:balance]"
                  >
                    {line.glyphs.map((glyph, glyphIndex) => {
                      const progress = getLyricGlyphProgress(glyph, currentTime)
                      const displayChar = renderGlyphChar(glyph.char)

                      return (
                        <span
                          key={`${glyph.startTime}-${glyphIndex}-${glyph.char}`}
                          className="relative inline-block"
                        >
                          <span className="select-none opacity-35">{displayChar}</span>
                          <span
                            className="absolute inset-y-0 left-0 overflow-hidden text-current"
                            style={{ width: `${(progress * 100).toFixed(2)}%` }}
                          >
                            <span className="select-none">{displayChar}</span>
                          </span>
                        </span>
                      )
                    })}
                  </span>
                ) : (
                  line.text
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
