import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessageToServer, leaveRoomViaAPI } from '../chat-websocket/utils/messageUtils'

vi.mock('@/lib/websocket', () => ({
  getAuthManager: () =>
    ({
      getToken: () => 'token-123',
      setToken: vi.fn(),
      removeToken: vi.fn(),
      refreshToken: vi.fn().mockResolvedValue(null),
      setRefreshCallback: vi.fn(),
      initializeConnection: vi.fn().mockResolvedValue(true),
      destroy: vi.fn(),
    }) as any,
}))

vi.mock('@/app/chat/chatStore', () => ({
  default: {
    getState: () => ({
      updateMuteStatus: vi.fn(),
    }),
  },
}))

// Minimal fetch mock helper
const mockFetch = (status: number, body: any) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Err',
    json: async () => body,
    clone() {
      return this
    },
  } as any)
}

describe('messageUtils', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('succeeds when API returns ok', async () => {
    mockFetch(200, { data: { id: 'm1' } })

    const res = await sendMessageToServer('room-1', 'hello')
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ id: 'm1' })
  })

  it('returns authentication error when no token', async () => {
    const ws = await import('@/lib/websocket')
    ws.getAuthManager = () =>
      ({
        getToken: () => null,
        setToken: vi.fn(),
        removeToken: vi.fn(),
        refreshToken: vi.fn().mockResolvedValue(null),
        setRefreshCallback: vi.fn(),
        initializeConnection: vi.fn().mockResolvedValue(true),
        destroy: vi.fn(),
      }) as any

    const res = await sendMessageToServer('room-1', 'hello')
    expect(res.success).toBe(false)
    expect(res.error?.type).toBe('authentication')
  })

  it('handles non-403 network error', async () => {
    mockFetch(500, { message: 'Server error' })
    const ws = await import('@/lib/websocket')
    ws.getAuthManager = () =>
      ({
        getToken: () => 'token-123',
        setToken: vi.fn(),
        removeToken: vi.fn(),
        refreshToken: vi.fn().mockResolvedValue(null),
        setRefreshCallback: vi.fn(),
        initializeConnection: vi.fn().mockResolvedValue(true),
        destroy: vi.fn(),
      }) as any
    const res = await sendMessageToServer('room-1', 'hello')
    expect(res.success).toBe(false)
    expect(res.error?.type).toBe('network')
  })

  it('leaveRoomViaAPI logs without throwing', async () => {
    mockFetch(200, {})
    await expect(leaveRoomViaAPI('room-1')).resolves.toBeUndefined()
  })
})
