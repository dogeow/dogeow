import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useAudioManager } from '../useAudioManager'

// Mock functions using vi.hoisted
const {
  mockSetCurrentTrack,
  mockSetAvailableTracks,
  mockSetIsPlaying,
  mockGetState,
  mockAudioController,
  mockApiRequest,
} = vi.hoisted(() => ({
  mockSetCurrentTrack: vi.fn(),
  mockSetAvailableTracks: vi.fn(),
  mockSetIsPlaying: vi.fn(),
  mockGetState: vi.fn(),
  mockAudioController: {
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
  },
  mockApiRequest: vi.fn(),
}))

// Mock the music store
vi.mock('@/stores/musicStore', () => {
  const mockUseMusicStore = () => ({
    currentTrack: '/music/test-track.mp3',
    volume: 0.7,
    isPlaying: false,
    setCurrentTrack: mockSetCurrentTrack,
    setAvailableTracks: mockSetAvailableTracks,
    setIsPlaying: mockSetIsPlaying,
    availableTracks: [
      { path: '/music/test-track.mp3', name: 'Test Track' },
      { path: '/music/another-track.mp3', name: 'Another Track' },
    ],
  })

  mockUseMusicStore.getState = mockGetState

  return {
    useMusicStore: mockUseMusicStore,
  }
})

// Mock the AudioController
vi.mock('@/components/launcher/AudioController', () => ({
  AudioController: () => mockAudioController,
}))

// Mock the API request
vi.mock('@/lib/api', () => ({
  apiRequest: mockApiRequest,
}))

describe('useAudioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetState.mockReturnValue({
      currentTrack: '/music/test-track.mp3',
    })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAudioManager())

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isMuted).toBe(false)
    expect(result.current.volume).toBe(0.7)
    expect(result.current.duration).toBe(0)
    expect(result.current.currentTime).toBe(0)
    expect(result.current.audioError).toBe(null)
    expect(result.current.currentTrack).toBe('/music/test-track.mp3')
    expect(result.current.readyToPlay).toBe(false)
  })

  it('should toggle mute state', () => {
    const { result } = renderHook(() => useAudioManager())

    expect(result.current.isMuted).toBe(false)

    act(() => {
      result.current.toggleMute()
    })

    expect(result.current.isMuted).toBe(true)

    act(() => {
      result.current.toggleMute()
    })

    expect(result.current.isMuted).toBe(false)
  })

  it('should get current track name from available tracks', () => {
    const { result } = renderHook(() => useAudioManager())

    const trackName = result.current.getCurrentTrackName()
    expect(trackName).toBe('Test Track')
  })

  it('should format time correctly', () => {
    const { result } = renderHook(() => useAudioManager())

    expect(result.current.formatTime(0)).toBe('0:00')
    expect(result.current.formatTime(65)).toBe('1:05')
    expect(result.current.formatTime(125)).toBe('2:05')
    expect(result.current.formatTime(3661)).toBe('61:01')
  })

  it('should fetch available tracks successfully', async () => {
    const mockTracks = [
      { path: '/music/track1.mp3', name: 'Track 1' },
      { path: '/music/track2.mp3', name: 'Track 2' },
    ]
    mockApiRequest.mockResolvedValue(mockTracks)

    const { result } = renderHook(() => useAudioManager())

    await act(async () => {
      await result.current.fetchAvailableTracks()
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/musics')
    expect(mockSetAvailableTracks).toHaveBeenCalledWith(mockTracks)
  })

  it('should handle fetch tracks error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockApiRequest.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useAudioManager())

    await act(async () => {
      await result.current.fetchAvailableTracks()
    })

    expect(consoleSpy).toHaveBeenCalledWith('加载音频列表失败:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should return audio controller methods', () => {
    const { result } = renderHook(() => useAudioManager())

    expect(result.current.audioRef).toBeDefined()
    expect(result.current.togglePlay).toBeDefined()
    expect(result.current.switchTrack).toBeDefined()
    expect(result.current.handleProgressChange).toBeDefined()
    expect(result.current.toggleMute).toBeDefined()
    expect(result.current.handleLoadedMetadata).toBeDefined()
    expect(result.current.handleTimeUpdate).toBeDefined()
    expect(result.current.handleAudioError).toBeDefined()
    expect(result.current.setupMediaSource).toBeDefined()
    expect(result.current.fetchAvailableTracks).toBeDefined()
    expect(result.current.getCurrentTrackName).toBeDefined()
    expect(result.current.formatTime).toBeDefined()
  })
})
