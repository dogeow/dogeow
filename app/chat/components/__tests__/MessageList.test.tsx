import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '@/app/chat/types'
import { MessageList } from '../MessageList'

const loadMessagesMock = vi.fn(() => Promise.resolve())
const useMessageScrollMock = vi.fn()

type MockChatState = {
  isLoading: boolean
  loadMessages: (roomId: number, page?: number) => Promise<void>
  messages: Record<string, ChatMessage[]>
}

const mockChatState: MockChatState = {
  isLoading: false,
  loadMessages: loadMessagesMock,
  messages: {},
}

vi.mock('@/app/chat/chatStore', () => ({
  __esModule: true,
  default: vi.fn((selector?: (state: MockChatState) => unknown) =>
    selector ? selector(mockChatState) : mockChatState
  ),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => <img alt="" {...props} />,
}))

vi.mock('@/app/chat/hooks/message-list/useMessageScroll', () => ({
  useMessageScroll: (params: unknown) => {
    useMessageScrollMock(params)
  },
}))

vi.mock('../MentionHighlight', () => ({
  MentionHighlight: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>{text}</span>
  ),
  useMentionDetection: (text: string) => ({
    hasMentions: text.includes('@'),
    hasCurrentUserMention: text.includes('@me'),
    mentions: [],
  }),
}))

vi.mock('../MessageInteractions', () => ({
  MessageInteractions: ({
    message,
    onReply,
  }: {
    message: ChatMessage
    onReply?: (message: ChatMessage) => void
  }) => (
    <button type="button" aria-label={`reply-${message.id}`} onClick={() => onReply?.(message)}>
      Reply
    </button>
  ),
}))

const userAlice = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
}

const userBob = {
  id: 2,
  name: 'Bob',
  email: 'bob@example.com',
}

function buildMessage(params: Partial<ChatMessage> = {}): ChatMessage {
  const id = params.id ?? 1
  const createdAt = params.created_at ?? '2026-03-05T10:00:00.000Z'

  return {
    id,
    room_id: 1,
    user_id: params.user?.id ?? userAlice.id,
    message: params.message ?? `message-${id}`,
    message_type: 'text',
    created_at: createdAt,
    updated_at: params.updated_at ?? createdAt,
    user: params.user ?? userAlice,
    reactions: params.reactions,
  }
}

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChatState.isLoading = false
    mockChatState.messages = {}
    loadMessagesMock.mockResolvedValue(undefined)
  })

  it('loads messages for room on mount', async () => {
    render(<MessageList roomId={42} />)

    await waitFor(() => {
      expect(loadMessagesMock).toHaveBeenCalledWith(42)
    })
  })

  it('renders empty state when room has no messages', () => {
    const view = render(<MessageList roomId={1} />)

    expect(view.getByText('No messages yet')).toBeInTheDocument()
    expect(view.getByText('Be the first to start the conversation!')).toBeInTheDocument()
  })

  it('renders loading indicator while loading', () => {
    mockChatState.isLoading = true

    const view = render(<MessageList roomId={1} />)
    expect(view.getByText('Loading more messages...')).toBeInTheDocument()
  })

  it('renders grouped messages and log accessibility attributes', () => {
    mockChatState.messages = {
      '1': [
        buildMessage({
          id: 1,
          message: 'hello one',
          user: userAlice,
          created_at: '2026-03-05T10:00:00.000Z',
        }),
        buildMessage({
          id: 2,
          message: 'hello two',
          user: userAlice,
          created_at: '2026-03-05T10:03:00.000Z',
        }),
        buildMessage({
          id: 3,
          message: 'hello three',
          user: userBob,
          created_at: '2026-03-05T10:20:00.000Z',
        }),
      ],
    }

    const view = render(<MessageList roomId={1} />)
    const log = view.getByRole('log')

    expect(log).toHaveAttribute('aria-live', 'polite')
    expect(log).toHaveAttribute('aria-busy', 'false')
    expect(view.getByText('hello one')).toBeInTheDocument()
    expect(view.getByText('hello two')).toBeInTheDocument()
    expect(view.getByText('hello three')).toBeInTheDocument()
    expect(view.getAllByText('Alice')).toHaveLength(1)
    expect(view.getAllByText('Bob')).toHaveLength(1)
  })

  it('filters messages by search query', () => {
    mockChatState.messages = {
      '1': [
        buildMessage({ id: 1, message: 'important update from ops', user: userAlice }),
        buildMessage({ id: 2, message: 'casual hello', user: userBob }),
      ],
    }

    const view = render(<MessageList roomId={1} searchQuery="important" />)

    expect(view.getByText('important update from ops')).toBeInTheDocument()
    expect(view.queryByText('casual hello')).not.toBeInTheDocument()
  })

  it('forwards reply action to onReply callback', async () => {
    mockChatState.messages = {
      '1': [buildMessage({ id: 7, message: 'reply me', user: userAlice })],
    }
    const onReply = vi.fn()
    const user = userEvent.setup()
    const view = render(<MessageList roomId={1} onReply={onReply} />)

    await user.click(view.getByRole('button', { name: 'reply-7' }))

    expect(onReply).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        message: 'reply me',
      })
    )
  })
})
