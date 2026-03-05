import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatRoom } from '@/app/chat/types'
import { ChatRoomList } from '../ChatRoomList'

const setCurrentRoomMock = vi.fn()
const joinRoomMock = vi.fn(() => Promise.resolve())
const loadRoomsMock = vi.fn()
const getRoomUnreadCountMock = vi.fn(() => 0)

type MockChatStore = {
  rooms: ChatRoom[]
  currentRoom: ChatRoom | null
  isLoading: boolean
  error: Error | null
  setCurrentRoom: (room: ChatRoom | null) => void
  joinRoom: (roomId: number) => Promise<void>
  loadRooms: () => void
  getRoomUnreadCount: (roomId: number) => number
}

const baseRoom: ChatRoom = {
  id: 1,
  name: 'General',
  description: 'Main room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 3,
}

const mockStore: MockChatStore = {
  rooms: [baseRoom],
  currentRoom: null,
  isLoading: false,
  error: null,
  setCurrentRoom: setCurrentRoomMock,
  joinRoom: joinRoomMock,
  loadRooms: loadRoomsMock,
  getRoomUnreadCount: getRoomUnreadCountMock,
}

vi.mock('@/app/chat/chatStore', () => ({
  __esModule: true,
  default: vi.fn(() => mockStore),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('../CreateRoomDialog', () => ({
  CreateRoomDialog: ({ open }: { open: boolean }) => (open ? <div>Create Room Dialog</div> : null),
}))

vi.mock('../EditRoomDialog', () => ({
  EditRoomDialog: () => null,
}))

vi.mock('../DeleteRoomDialog', () => ({
  DeleteRoomDialog: () => null,
}))

describe('ChatRoomList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.rooms = [baseRoom]
    mockStore.currentRoom = null
    mockStore.isLoading = false
    mockStore.error = null
  })

  it('opens create dialog when clicking create button', async () => {
    const user = userEvent.setup()
    const view = render(<ChatRoomList />)

    expect(view.queryByText('Create Room Dialog')).not.toBeInTheDocument()
    await user.click(view.getByRole('button', { name: /create/i }))

    expect(view.getByText('Create Room Dialog')).toBeInTheDocument()
  })

  it('joins a room and updates current room when selecting a different room', async () => {
    const user = userEvent.setup()
    const onRoomSelect = vi.fn()
    const view = render(<ChatRoomList onRoomSelect={onRoomSelect} />)

    await user.click(view.getByRole('button', { name: /general/i }))

    await waitFor(() => {
      expect(setCurrentRoomMock).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
      expect(joinRoomMock).toHaveBeenCalledWith(1)
      expect(onRoomSelect).toHaveBeenCalledTimes(1)
    })
  })

  it('does not re-join when selecting the current room', async () => {
    const user = userEvent.setup()
    const onRoomSelect = vi.fn()
    mockStore.currentRoom = baseRoom
    const view = render(<ChatRoomList onRoomSelect={onRoomSelect} />)

    await user.click(view.getByRole('button', { name: /general/i }))

    expect(joinRoomMock).not.toHaveBeenCalled()
    expect(onRoomSelect).toHaveBeenCalledTimes(1)
  })

  it('renders error state and retries loading', async () => {
    const user = userEvent.setup()
    mockStore.error = new Error('load failed')
    const view = render(<ChatRoomList />)

    expect(view.getByText('Error loading rooms')).toBeInTheDocument()
    expect(view.getByText('load failed')).toBeInTheDocument()
    await user.click(view.getByRole('button', { name: 'Try Again' }))
    expect(loadRoomsMock).toHaveBeenCalled()
  })
})
