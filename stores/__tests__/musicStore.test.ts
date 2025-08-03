import { renderHook, act } from '@testing-library/react'
import { useMusicStore, type MusicTrack } from '../musicStore'

describe('musicStore', () => {
  const mockTracks: MusicTrack[] = [
    {
      path: '/musics/track1.mp3',
      name: 'Track 1',
      duration: 180,
      isHls: false,
    },
    {
      path: '/musics/track2.mp3',
      name: 'Track 2',
      duration: 240,
      isHls: false,
    },
    {
      path: '/musics/stream.m3u8',
      name: 'HLS Stream',
      duration: 0,
      isHls: true,
    },
  ]

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset store state
    useMusicStore.setState({
      currentTrack: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3',
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMusicStore())

    expect(result.current.currentTrack).toBe(
      '/musics/I WiSH - 明日への扉~5 years brew version~.mp3'
    )
    expect(result.current.volume).toBe(0.5)
    expect(result.current.availableTracks).toEqual([])
    expect(result.current.isPlaying).toBe(false)
  })

  it('should set current track', () => {
    const { result } = renderHook(() => useMusicStore())
    const newTrack = '/musics/new-track.mp3'

    act(() => {
      result.current.setCurrentTrack(newTrack)
    })

    expect(result.current.currentTrack).toBe(newTrack)
  })

  it('should set volume within valid range', () => {
    const { result } = renderHook(() => useMusicStore())

    // Test normal volume
    act(() => {
      result.current.setVolume(0.8)
    })
    expect(result.current.volume).toBe(0.8)

    // Test minimum volume
    act(() => {
      result.current.setVolume(0)
    })
    expect(result.current.volume).toBe(0)

    // Test maximum volume
    act(() => {
      result.current.setVolume(1)
    })
    expect(result.current.volume).toBe(1)
  })

  it('should handle volume values outside normal range', () => {
    const { result } = renderHook(() => useMusicStore())

    // Test negative volume (should still be set as the store doesn't validate)
    act(() => {
      result.current.setVolume(-0.1)
    })
    expect(result.current.volume).toBe(-0.1)

    // Test volume above 1 (should still be set as the store doesn't validate)
    act(() => {
      result.current.setVolume(1.5)
    })
    expect(result.current.volume).toBe(1.5)
  })

  it('should set available tracks', () => {
    const { result } = renderHook(() => useMusicStore())

    act(() => {
      result.current.setAvailableTracks(mockTracks)
    })

    expect(result.current.availableTracks).toEqual(mockTracks)
    expect(result.current.availableTracks).toHaveLength(3)
  })

  it('should handle empty tracks array', () => {
    const { result } = renderHook(() => useMusicStore())

    // First set some tracks
    act(() => {
      result.current.setAvailableTracks(mockTracks)
    })
    expect(result.current.availableTracks).toHaveLength(3)

    // Then clear them
    act(() => {
      result.current.setAvailableTracks([])
    })
    expect(result.current.availableTracks).toEqual([])
  })

  it('should set playing state', () => {
    const { result } = renderHook(() => useMusicStore())

    // Start playing
    act(() => {
      result.current.setIsPlaying(true)
    })
    expect(result.current.isPlaying).toBe(true)

    // Stop playing
    act(() => {
      result.current.setIsPlaying(false)
    })
    expect(result.current.isPlaying).toBe(false)
  })

  it('should handle different track types', () => {
    const { result } = renderHook(() => useMusicStore())

    // Regular MP3 track
    act(() => {
      result.current.setCurrentTrack('/musics/song.mp3')
    })
    expect(result.current.currentTrack).toBe('/musics/song.mp3')

    // HLS stream
    act(() => {
      result.current.setCurrentTrack('/musics/stream.m3u8')
    })
    expect(result.current.currentTrack).toBe('/musics/stream.m3u8')

    // URL with query parameters
    act(() => {
      result.current.setCurrentTrack('/musics/track.mp3?version=2&quality=high')
    })
    expect(result.current.currentTrack).toBe('/musics/track.mp3?version=2&quality=high')
  })

  it('should handle tracks with special characters', () => {
    const { result } = renderHook(() => useMusicStore())
    const specialTracks: MusicTrack[] = [
      {
        path: '/musics/track with spaces.mp3',
        name: 'Track with Spaces',
        duration: 200,
      },
      {
        path: '/musics/track-with-特殊字符.mp3',
        name: 'Track with 特殊字符',
        duration: 150,
      },
      {
        path: '/musics/track&with&symbols.mp3',
        name: 'Track & Symbols',
        duration: 180,
      },
    ]

    act(() => {
      result.current.setAvailableTracks(specialTracks)
    })

    expect(result.current.availableTracks).toEqual(specialTracks)

    // Set current track to one with special characters
    act(() => {
      result.current.setCurrentTrack('/musics/track-with-特殊字符.mp3')
    })
    expect(result.current.currentTrack).toBe('/musics/track-with-特殊字符.mp3')
  })

  it('should persist music state', () => {
    const persistedState = {
      currentTrack: '/musics/persisted-track.mp3',
      volume: 0.7,
      availableTracks: mockTracks,
      isPlaying: true,
    }

    // Set state to simulate persistence
    useMusicStore.setState(persistedState)

    // Create new hook instance to simulate rehydration
    const { result } = renderHook(() => useMusicStore())

    expect(result.current.currentTrack).toBe('/musics/persisted-track.mp3')
    expect(result.current.volume).toBe(0.7)
    expect(result.current.availableTracks).toEqual(mockTracks)
    expect(result.current.isPlaying).toBe(true)
  })

  it('should handle track updates while playing', () => {
    const { result } = renderHook(() => useMusicStore())

    // Start playing
    act(() => {
      result.current.setIsPlaying(true)
      result.current.setCurrentTrack('/musics/track1.mp3')
    })

    expect(result.current.isPlaying).toBe(true)
    expect(result.current.currentTrack).toBe('/musics/track1.mp3')

    // Change track while playing
    act(() => {
      result.current.setCurrentTrack('/musics/track2.mp3')
    })

    expect(result.current.isPlaying).toBe(true) // Should remain playing
    expect(result.current.currentTrack).toBe('/musics/track2.mp3')
  })

  it('should handle volume changes during playback', () => {
    const { result } = renderHook(() => useMusicStore())

    // Start playing with initial volume
    act(() => {
      result.current.setIsPlaying(true)
      result.current.setVolume(0.3)
    })

    expect(result.current.isPlaying).toBe(true)
    expect(result.current.volume).toBe(0.3)

    // Change volume during playback
    act(() => {
      result.current.setVolume(0.9)
    })

    expect(result.current.isPlaying).toBe(true) // Should remain playing
    expect(result.current.volume).toBe(0.9)
  })

  it('should handle track list updates', () => {
    const { result } = renderHook(() => useMusicStore())

    // Set initial tracks
    act(() => {
      result.current.setAvailableTracks(mockTracks.slice(0, 2))
    })
    expect(result.current.availableTracks).toHaveLength(2)

    // Add more tracks
    act(() => {
      result.current.setAvailableTracks(mockTracks)
    })
    expect(result.current.availableTracks).toHaveLength(3)

    // Update with different tracks
    const newTracks: MusicTrack[] = [
      {
        path: '/musics/new-track.mp3',
        name: 'New Track',
        duration: 300,
      },
    ]

    act(() => {
      result.current.setAvailableTracks(newTracks)
    })
    expect(result.current.availableTracks).toEqual(newTracks)
    expect(result.current.availableTracks).toHaveLength(1)
  })
})
