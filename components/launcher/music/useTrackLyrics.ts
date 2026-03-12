'use client'

import { useEffect, useMemo, useState } from 'react'
import { API_URL } from '@/lib/api'
import { extractTrackFilename, getActiveLyricIndex, parseLrcLyrics, type LyricLine } from './lyrics'

export type LyricsState = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export function useTrackLyrics(currentTrack: string, currentTime: number) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [status, setStatus] = useState<LyricsState>('idle')

  useEffect(() => {
    const filename = extractTrackFilename(currentTrack)

    if (!filename) {
      setLyrics([])
      setStatus('idle')
      return
    }

    const controller = new AbortController()

    const loadLyrics = async () => {
      setStatus('loading')
      setLyrics([])

      try {
        const response = await fetch(
          `${API_URL}/api/musics/lyrics/${encodeURIComponent(filename)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'text/plain',
            },
          }
        )

        if (response.status === 404) {
          setStatus('missing')
          return
        }

        if (!response.ok) {
          throw new Error(`歌词加载失败: ${response.status}`)
        }

        const nextLyrics = parseLrcLyrics(await response.text())
        setLyrics(nextLyrics)
        setStatus(nextLyrics.length > 0 ? 'ready' : 'missing')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.warn('加载歌词失败:', error)
        setStatus('error')
      }
    }

    loadLyrics()

    return () => controller.abort()
  }, [currentTrack])

  const activeIndex = useMemo(() => getActiveLyricIndex(lyrics, currentTime), [lyrics, currentTime])
  const currentLyric = activeIndex >= 0 ? (lyrics[activeIndex]?.text ?? '') : ''

  return {
    lyrics,
    activeLyricIndex: activeIndex,
    currentLyric,
    status,
    hasLyrics: status === 'ready' && lyrics.length > 0,
  }
}
