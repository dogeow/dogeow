export interface LyricGlyph {
  char: string
  startTime: number
  endTime: number
}

export interface LyricLine {
  time: number
  text: string
  glyphs?: LyricGlyph[]
}

const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g
const INLINE_TIMESTAMP_PATTERN = /<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/g
const OFFSET_PATTERN = /^\[offset:([+-]?\d+)\]$/i
const DEFAULT_GLYPH_DURATION = 0.16
const DEFAULT_GLYPH_GROUP_DURATION = 0.64

function parseTimestampParts(
  minutesRaw: string,
  secondsRaw: string,
  fractionRaw = '',
  offsetMs: number
) {
  const minutes = Number(minutesRaw ?? 0)
  const seconds = Number(secondsRaw ?? 0)
  const fraction = fractionRaw ?? ''

  let decimal = 0
  if (fraction.length === 2) {
    decimal = Number(fraction) / 100
  } else if (fraction.length === 3) {
    decimal = Number(fraction) / 1000
  } else if (fraction.length === 1) {
    decimal = Number(fraction) / 10
  }

  return Math.max(0, minutes * 60 + seconds + decimal + offsetMs / 1000)
}

function parseTimestamp(match: RegExpMatchArray, offsetMs: number) {
  return parseTimestampParts(match[1] ?? '0', match[2] ?? '0', match[3] ?? '', offsetMs)
}

function parseInlineGlyphs(source: string, offsetMs: number): LyricGlyph[] | undefined {
  const matches = [...source.matchAll(INLINE_TIMESTAMP_PATTERN)]

  if (matches.length === 0) {
    return undefined
  }

  const glyphs: LyricGlyph[] = []

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const nextMatch = matches[index + 1]
    const startTime = parseTimestampParts(
      match[1] ?? '0',
      match[2] ?? '0',
      match[3] ?? '',
      offsetMs
    )
    const groupText = source.slice((match.index ?? 0) + match[0].length, nextMatch?.index)

    if (groupText.length === 0) {
      continue
    }

    const chars = Array.from(groupText)
    const nextStartTime = nextMatch
      ? parseTimestampParts(nextMatch[1] ?? '0', nextMatch[2] ?? '0', nextMatch[3] ?? '', offsetMs)
      : undefined
    const groupDuration =
      nextStartTime && nextStartTime > startTime
        ? nextStartTime - startTime
        : Math.max(DEFAULT_GLYPH_GROUP_DURATION, chars.length * DEFAULT_GLYPH_DURATION)
    const step = groupDuration / chars.length

    chars.forEach((char, charIndex) => {
      const glyphStartTime = startTime + step * charIndex
      const glyphEndTime =
        charIndex === chars.length - 1
          ? startTime + groupDuration
          : startTime + step * (charIndex + 1)

      glyphs.push({
        char,
        startTime: glyphStartTime,
        endTime: Math.max(glyphStartTime + DEFAULT_GLYPH_DURATION, glyphEndTime),
      })
    })
  }

  return glyphs.length > 0 ? glyphs : undefined
}

function normalizeLyricGlyphs(lyrics: LyricLine[]) {
  return lyrics.map((line, index) => {
    if (!line.glyphs || line.glyphs.length === 0) {
      return line
    }

    const nextLineTime = lyrics[index + 1]?.time
    const glyphs = line.glyphs.map((glyph, glyphIndex, glyphList) => {
      const nextGlyphStartTime = glyphList[glyphIndex + 1]?.startTime
      const endTime =
        nextGlyphStartTime && nextGlyphStartTime > glyph.startTime
          ? nextGlyphStartTime
          : glyphIndex === glyphList.length - 1 && nextLineTime && nextLineTime > glyph.startTime
            ? nextLineTime
            : glyph.endTime

      return {
        ...glyph,
        endTime: Math.max(glyph.startTime + DEFAULT_GLYPH_DURATION, endTime),
      }
    })

    return {
      ...line,
      time: glyphs[0]?.startTime ?? line.time,
      glyphs,
    }
  })
}

export function parseLrcLyrics(source: string): LyricLine[] {
  if (!source.trim()) {
    return []
  }

  const rows = source.split(/\r?\n/)
  const lyrics: LyricLine[] = []
  let offsetMs = 0

  for (const row of rows) {
    const line = row.trim()

    if (!line) {
      continue
    }

    const offsetMatch = line.match(OFFSET_PATTERN)
    if (offsetMatch) {
      offsetMs = Number(offsetMatch[1] ?? 0)
      continue
    }

    const matches = [...line.matchAll(TIMESTAMP_PATTERN)]
    if (matches.length === 0) {
      continue
    }

    const rawText = line.replace(TIMESTAMP_PATTERN, '').trim()
    const glyphs = parseInlineGlyphs(rawText, offsetMs)
    const text = rawText.replace(INLINE_TIMESTAMP_PATTERN, '').trim()

    for (const match of matches) {
      lyrics.push({
        time: glyphs?.[0]?.startTime ?? parseTimestamp(match, offsetMs),
        text,
        glyphs,
      })
    }
  }

  return normalizeLyricGlyphs(lyrics.sort((left, right) => left.time - right.time))
}

export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (lyrics.length === 0) {
    return -1
  }

  for (let index = lyrics.length - 1; index >= 0; index -= 1) {
    if (currentTime >= lyrics[index].time) {
      return index
    }
  }

  return -1
}

export function getLyricGlyphProgress(glyph: LyricGlyph, currentTime: number) {
  if (currentTime <= glyph.startTime) {
    return 0
  }

  if (currentTime >= glyph.endTime) {
    return 1
  }

  const duration = glyph.endTime - glyph.startTime
  if (duration <= 0) {
    return 1
  }

  return Math.min(1, Math.max(0, (currentTime - glyph.startTime) / duration))
}

export function extractTrackFilename(trackPath: string): string | null {
  if (!trackPath) {
    return null
  }

  try {
    const pathname =
      trackPath.startsWith('http://') || trackPath.startsWith('https://')
        ? new URL(trackPath).pathname
        : (trackPath.split('?')[0]?.split('#')[0] ?? trackPath)
    const segment = pathname.split('/').pop()

    if (!segment) {
      return null
    }

    return decodeURIComponent(segment)
  } catch {
    const sanitizedPath = trackPath.split('?')[0]
    const segment = sanitizedPath.split('/').pop()
    return segment ? decodeURIComponent(segment) : null
  }
}
