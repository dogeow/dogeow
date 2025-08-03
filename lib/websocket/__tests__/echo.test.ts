import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Laravel Echo
const mockEchoInstance = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  channel: vi.fn(() => ({
    listen: vi.fn(),
    stopListening: vi.fn(),
  })),
  private: vi.fn(() => ({
    listen: vi.fn(),
    stopListening: vi.fn(),
  })),
}

const EchoMock = vi.fn().mockImplementation(() => mockEchoInstance)

vi.mock('laravel-echo', () => ({
  default: EchoMock,
}))

// Mock Pusher
vi.mock('pusher-js', () => ({
  default: vi.fn(),
}))

// Mock connection monitor
vi.mock('./connection-monitor', () => ({
  getConnectionMonitor: vi.fn(() => ({
    initializeWithEcho: vi.fn(),
  })),
}))

describe('WebSocket Echo', () => {
  let originalWindow: typeof window

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window object
    originalWindow = global.window
    global.window = {
      ...global.window,
      Pusher: vi.fn(),
      Echo: undefined,
    } as unknown as typeof window

    // Mock environment variables
    process.env.NEXT_PUBLIC_REVERB_APP_KEY = 'test-key'
    process.env.NEXT_PUBLIC_REVERB_HOST = 'test-host'
    process.env.NEXT_PUBLIC_REVERB_PORT = '8080'
    process.env.NEXT_PUBLIC_REVERB_SCHEME = 'https'
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  describe('createEchoInstance', () => {
    it('should create Echo instance with correct configuration', async () => {
      const { createEchoInstance } = await import('../echo')
      const echo = createEchoInstance()

      expect(echo).toBeTruthy()
      expect(echo?.connect).toBeDefined()
      expect(echo?.disconnect).toBeDefined()
      expect(echo?.channel).toBeDefined()
      expect(echo?.private).toBeDefined()
    })

    it('should return null when window is not available', async () => {
      // Mock window as undefined
      const originalWindow = global.window
      global.window = undefined as unknown as typeof window

      const { createEchoInstance } = await import('../echo')
      const echo = createEchoInstance()

      expect(echo).toBeNull()

      // Restore window
      global.window = originalWindow
    })

    it('should prevent rapid successive creations', async () => {
      const { createEchoInstance } = await import('../echo')
      const echo1 = createEchoInstance()
      const echo2 = createEchoInstance()

      expect(echo1).toBeTruthy()
      expect(echo2).toBe(echo1) // Should return the same instance
    })
  })

  describe('destroyEchoInstance', () => {
    it('should do nothing when no instance exists', async () => {
      const { destroyEchoInstance } = await import('../echo')
      expect(() => destroyEchoInstance()).not.toThrow()
    })
  })

  describe('getEchoInstance', () => {
    it('should return null when no instance exists', async () => {
      const { getEchoInstance } = await import('../echo')
      const echo = getEchoInstance()
      expect(echo).toBeNull()
    })
  })
})
