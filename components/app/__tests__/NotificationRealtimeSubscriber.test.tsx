import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationRealtimeSubscriber } from '../NotificationRealtimeSubscriber'

const {
  mockAuthState,
  mockSetUser,
  mockFetchCurrentUser,
  mockMutate,
  mockChannel,
  mockEcho,
  mockGetEchoInstance,
  mockCreateEchoInstance,
} = vi.hoisted(() => {
  const mockChannel = {
    listen: vi.fn(),
    stopListening: vi.fn(),
  }

  const mockEcho = {
    private: vi.fn(() => mockChannel),
    leave: vi.fn(),
  }

  return {
    mockAuthState: {
      loading: false,
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'stale@example.com',
        name: 'Stale User',
      },
    },
    mockSetUser: vi.fn(),
    mockFetchCurrentUser: vi.fn(),
    mockMutate: vi.fn(),
    mockChannel,
    mockEcho,
    mockGetEchoInstance: vi.fn(() => mockEcho),
    mockCreateEchoInstance: vi.fn(() => mockEcho),
  }
})

vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: typeof mockAuthState & { setUser: typeof mockSetUser }) => unknown) =>
    selector({
      ...mockAuthState,
      setUser: mockSetUser,
    }),
}))

vi.mock('@/lib/api', () => ({
  fetchCurrentUser: mockFetchCurrentUser,
}))

vi.mock('@/lib/websocket', () => ({
  getEchoInstance: mockGetEchoInstance,
  createEchoInstance: mockCreateEchoInstance,
}))

vi.mock('swr', async importOriginal => {
  const actual = await importOriginal<typeof import('swr')>()
  return {
    ...actual,
    useSWRConfig: () => ({
      mutate: mockMutate,
    }),
  }
})

describe('NotificationRealtimeSubscriber', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockAuthState.loading = false
    mockAuthState.isAuthenticated = true
    mockAuthState.user = {
      id: 1,
      email: 'stale@example.com',
      name: 'Stale User',
    }

    mockSetUser.mockImplementation(user => {
      mockAuthState.user = user
    })

    mockFetchCurrentUser.mockResolvedValue({
      id: 2,
      email: 'fresh@example.com',
      name: 'Fresh User',
    })

    mockGetEchoInstance.mockReturnValue(mockEcho)
    mockCreateEchoInstance.mockReturnValue(mockEcho)
    mockEcho.private.mockReturnValue(mockChannel)
  })

  it('subscribes with the server-confirmed user id instead of stale local state', async () => {
    const { unmount } = render(<NotificationRealtimeSubscriber />)

    await waitFor(() => {
      expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: 2,
        email: 'fresh@example.com',
        name: 'Fresh User',
      })
      expect(mockEcho.private).toHaveBeenCalledWith('user.2.notifications')
      expect(mockChannel.listen).toHaveBeenCalledWith('.notification.created', expect.any(Function))
    })

    unmount()

    expect(mockChannel.stopListening).toHaveBeenCalledWith('.notification.created')
    expect(mockEcho.leave).toHaveBeenCalledWith('user.2.notifications')
  })

  it('waits for auth initialization before attempting subscription', async () => {
    mockAuthState.loading = true

    render(<NotificationRealtimeSubscriber />)

    await waitFor(() => {
      expect(mockFetchCurrentUser).not.toHaveBeenCalled()
      expect(mockEcho.private).not.toHaveBeenCalled()
    })
  })
})
