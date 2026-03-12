import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrackInfo } from '../TrackInfo'

describe('TrackInfo', () => {
  it('播放且有歌词时默认切到歌词', async () => {
    render(
      <TrackInfo
        isPlaying
        getCurrentTrackName={() => '叹云兮'}
        currentLyric="若这个世界凋谢"
        hasLyrics
        isLoadingTracks={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('若这个世界凋谢')).toBeInTheDocument()
    })
  })

  it('暂停时切回歌曲名', async () => {
    const { rerender } = render(
      <TrackInfo
        isPlaying
        getCurrentTrackName={() => '叹云兮'}
        currentLyric="若这个世界凋谢"
        hasLyrics
        isLoadingTracks={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('若这个世界凋谢')).toBeInTheDocument()
    })

    rerender(
      <TrackInfo
        isPlaying={false}
        getCurrentTrackName={() => '叹云兮'}
        currentLyric="若这个世界凋谢"
        hasLyrics
        isLoadingTracks={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('叹云兮')).toBeInTheDocument()
    })
  })

  it('没有歌词时保持显示歌曲名', async () => {
    render(
      <TrackInfo
        isPlaying
        getCurrentTrackName={() => '叹云兮'}
        currentLyric=""
        hasLyrics={false}
        isLoadingTracks={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('叹云兮')).toBeInTheDocument()
    })
  })
})
