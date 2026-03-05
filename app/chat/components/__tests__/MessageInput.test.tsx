import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../MessageInput'
import { MAX_MESSAGE_LENGTH } from '@/app/chat/utils/message-input/constants'

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: { id: 1, name: 'Test Room' },
    onlineUsers: {},
    messages: {},
    checkMuteStatus: () => false,
    muteUntil: null,
    muteReason: null,
    refreshMuteStatus: vi.fn(),
  }),
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

vi.mock('../UnreadMessageIndicator', () => ({
  UnreadMessageIndicator: () => null,
  useUnreadMessages: () => 0,
  useScrollPosition: () => ({ isAtBottom: true, isNearBottom: true }),
}))

const successResult = { success: true as const }

describe('MessageInput', () => {
  const defaultProps = {
    roomId: 1,
    sendMessage: vi.fn(() => Promise.resolve(successResult)),
    isConnected: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input and action controls', () => {
    const view = render(<MessageInput {...defaultProps} />)

    expect(view.getByRole('textbox', { name: /message input/i })).toBeInTheDocument()
    expect(view.getByRole('button', { name: /upload file/i })).toBeInTheDocument()
    expect(view.getByRole('button', { name: /select emoji/i })).toBeInTheDocument()
    expect(view.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    expect(view.getByTestId('file-input')).toBeInTheDocument()
  })

  it('sends a trimmed message when clicking send', async () => {
    const user = userEvent.setup()
    const sendMessage = vi.fn(() => Promise.resolve(successResult))
    const view = render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

    const textarea = view.getByRole('textbox', { name: /message input/i })
    const sendButton = view.getByRole('button', { name: /send message/i })

    await user.type(textarea, '  hello world  ')
    await user.click(sendButton)

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('1', 'hello world')
    })
  })

  it('does not send when disconnected', async () => {
    const user = userEvent.setup()
    const sendMessage = vi.fn(() => Promise.resolve(successResult))
    const view = render(
      <MessageInput {...defaultProps} sendMessage={sendMessage} isConnected={false} />
    )

    const textarea = view.getByRole('textbox', { name: /message input/i })
    const sendButton = view.getByRole('button', { name: /send message/i })

    expect(textarea).toBeDisabled()
    expect(sendButton).toBeDisabled()

    await user.click(sendButton)
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('renders reply indicator and sends with reply prefix', async () => {
    const user = userEvent.setup()
    const sendMessage = vi.fn(() => Promise.resolve(successResult))
    const onCancelReply = vi.fn()
    const replyingTo = {
      id: 1,
      user: { name: 'Alice' },
      message: 'Original message',
    }

    const view = render(
      <MessageInput
        {...defaultProps}
        sendMessage={sendMessage}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
      />
    )

    expect(view.getByText('Alice')).toBeInTheDocument()
    expect(view.getByText('Original message')).toBeInTheDocument()

    const textarea = view.getByRole('textbox', { name: /message input/i })
    const sendButton = view.getByRole('button', { name: /send message/i })
    await user.type(textarea, 'reply body')
    await user.click(sendButton)

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('1', '@Alice reply body')
    })
    expect(onCancelReply).toHaveBeenCalledTimes(1)

    const cancelButton = view.getByRole('button', { name: /cancel reply/i })
    await user.click(cancelButton)
    expect(onCancelReply).toHaveBeenCalledTimes(2)
  })

  it('enforces max message length', async () => {
    const user = userEvent.setup()
    const view = render(<MessageInput {...defaultProps} />)

    const textarea = view.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'a'.repeat(MAX_MESSAGE_LENGTH + 20))

    expect((textarea as HTMLTextAreaElement).value.length).toBe(MAX_MESSAGE_LENGTH)
  })
})
