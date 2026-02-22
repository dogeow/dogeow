import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// mock chat store
vi.mock('@/app/chat/chatStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    rooms: [],
    currentRoom: null,
    isLoading: false,
    error: null,
    setCurrentRoom: vi.fn(),
    joinRoom: vi.fn(),
    loadRooms: vi.fn(),
  })),
}))

// Need to provide Translation hook stub
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}))

import { ChatRoomList } from '../ChatRoomList'

describe('ChatRoomList', () => {
  it('opens create dialog when create button clicked', async () => {
    const { getByText, queryByText } = render(<ChatRoomList />)

    // dialog should not be in DOM initially
    expect(queryByText('创建新聊天房间')).toBeNull()

    const createBtn = getByText('Create')
    fireEvent.click(createBtn)

    await waitFor(() => {
      expect(getByText('创建新聊天房间')).toBeInTheDocument()
    })
  })
})
