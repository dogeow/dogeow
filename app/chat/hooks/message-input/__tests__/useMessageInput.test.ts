import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMessageInput } from '../useMessageInput'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: { id: 1, name: 'Test Room' },
    checkMuteStatus: () => false,
    muteUntil: null,
  }),
}))

const localStorageMock = window.localStorage as unknown as {
  getItem: ReturnType<typeof vi.fn>
  setItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
}

describe('useMessageInput draft isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves old room draft and loads new room draft when room changes', async () => {
    const storage = new Map<string, string>([['chat-draft-2', 'Room 2 draft']])

    localStorageMock.getItem.mockImplementation((key: string) => storage.get(key) ?? null)
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      storage.set(key, value)
    })
    localStorageMock.removeItem.mockImplementation((key: string) => {
      storage.delete(key)
    })

    const sendMessage = vi.fn(async () => ({ success: true as const }))

    const { result, rerender } = renderHook(
      ({ roomId }: { roomId: number }) =>
        useMessageInput({
          roomId,
          sendMessage,
          isConnected: true,
          replyingTo: undefined,
          onCancelReply: undefined,
        }),
      {
        initialProps: { roomId: 1 },
      }
    )

    act(() => {
      result.current.handleInputChange('Room 1 draft')
    })

    await act(async () => {
      rerender({ roomId: 2 })
    })

    expect(result.current.message).toBe('Room 2 draft')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chat-draft-1', 'Room 1 draft')
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('chat-draft-2', 'Room 1 draft')
    expect(storage.get('chat-draft-1')).toBe('Room 1 draft')
  })
})
