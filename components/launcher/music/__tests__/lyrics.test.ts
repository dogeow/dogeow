import { describe, expect, it } from 'vitest'
import { extractTrackFilename, getActiveLyricIndex, parseLrcLyrics } from '../lyrics'

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

  it('extracts and decodes the filename from a remote track path', () => {
    const filename = extractTrackFilename(
      'https://cdn.example.com/music/%E5%8F%B9%E4%BA%91%E5%85%AE-%E9%9E%A0%E5%A9%A7%E7%A5%8E.mp3?version=2'
    )

    expect(filename).toBe('叹云兮-鞠婧祎.mp3')
  })
})
