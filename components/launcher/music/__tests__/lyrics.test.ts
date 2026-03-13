import { describe, expect, it } from 'vitest'
import {
  extractTrackFilename,
  getActiveLyricIndex,
  getLyricGlyphProgress,
  parseLrcLyrics,
} from '../lyrics'

describe('lyrics utils', () => {
  it('parses timed lrc lines and offset', () => {
    const lyrics = parseLrcLyrics(`
[offset:500]
[00:01.00]第一句
[00:02.50][00:04.00]副歌
    `)

    expect(lyrics).toEqual([
      { time: 1.5, text: '第一句' },
      { time: 3, text: '副歌' },
      { time: 4.5, text: '副歌' },
    ])
  })

  it('returns the active lyric index for the current playback time', () => {
    const lyrics = parseLrcLyrics(`
[00:01.00]第一句
[00:03.00]第二句
[00:05.00]第三句
    `)

    expect(getActiveLyricIndex(lyrics, 0.2)).toBe(-1)
    expect(getActiveLyricIndex(lyrics, 3.4)).toBe(1)
    expect(getActiveLyricIndex(lyrics, 7)).toBe(2)
  })

  it('parses enhanced lrc glyph timings and preserves spaces', () => {
    const lyrics = parseLrcLyrics(`
[00:01.00]<00:01.00>台<00:01.20>下 <00:01.50>人
[00:02.00]第二句
    `)

    expect(lyrics).toHaveLength(2)
    expect(lyrics[0]?.time).toBe(1)
    expect(lyrics[0]?.text).toBe('台下 人')
    const glyphs = lyrics[0]?.glyphs ?? []
    expect(glyphs.map(glyph => glyph.char)).toEqual(['台', '下', ' ', '人'])
    expect(glyphs[0]?.startTime).toBeCloseTo(1, 1)
    expect(glyphs[0]?.endTime).toBeCloseTo(1.2, 1)
    expect(glyphs[1]?.startTime).toBeCloseTo(1.2, 1)
    expect(glyphs[1]?.endTime).toBeGreaterThan(glyphs[1]?.startTime ?? 0)
    expect(glyphs[2]?.char).toBe(' ')
    expect(glyphs[2]?.startTime).toBeGreaterThan(glyphs[1]?.startTime ?? 0)
    expect(glyphs[2]?.endTime).toBeGreaterThan(glyphs[2]?.startTime ?? 0)
    expect(glyphs[3]?.startTime).toBeGreaterThan(glyphs[2]?.startTime ?? 0)
    expect(glyphs[3]?.endTime).toBeCloseTo(2, 1)
    expect(lyrics[1]).toMatchObject({ time: 2, text: '第二句' })
  })

  it('returns linear glyph progress from 0 to 1', () => {
    const glyph = {
      char: '台',
      startTime: 1,
      endTime: 2,
    }

    expect(getLyricGlyphProgress(glyph, 0.5)).toBe(0)
    expect(getLyricGlyphProgress(glyph, 1.25)).toBe(0.25)
    expect(getLyricGlyphProgress(glyph, 1.5)).toBe(0.5)
    expect(getLyricGlyphProgress(glyph, 2)).toBe(1)
    expect(getLyricGlyphProgress(glyph, 2.5)).toBe(1)
  })

  it('extracts and decodes the filename from a remote track path', () => {
    const filename = extractTrackFilename(
      'https://cdn.example.com/music/%E5%8F%B9%E4%BA%91%E5%85%AE-%E9%9E%A0%E5%A9%A7%E7%A5%8E.mp3?version=2'
    )

    expect(filename).toBe('叹云兮-鞠婧祎.mp3')
  })
})
