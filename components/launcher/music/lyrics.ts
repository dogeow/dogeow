export interface LyricLine {
  time: number
  text: string
}

const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g
const OFFSET_PATTERN = /^\[offset:([+-]?\d+)\]$/i

function parseTimestamp(match: RegExpMatchArray, offsetMs: number) {
  const minutes = Number(match[1] ?? 0)
  const seconds = Number(match[2] ?? 0)
  const fraction = match[3] ?? ''

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

    const text = line.replace(TIMESTAMP_PATTERN, '').trim()

    for (const match of matches) {
      lyrics.push({
        time: parseTimestamp(match, offsetMs),
        text,
      })
    }
  }

  return lyrics.sort((left, right) => left.time - right.time)
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
