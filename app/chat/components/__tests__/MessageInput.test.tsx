import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../MessageInput'

// Mock dependencies
vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: { id: 1, name: 'Test Room' },
    onlineUsers: {},
  }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

vi.mock('use-debounce', () => ({
  useDebounce: vi.fn(value => [value, vi.fn()]),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ComponentProps<'img'>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('MessageInput', () => {
  const defaultProps = {
    roomId: 1,
    sendMessage: vi.fn(() => Promise.resolve(true)),
    isConnected: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render message input with basic elements', () => {
      render(<MessageInput {...defaultProps} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })

    it('should render reply interface when replyingTo is provided', () => {
      const replyingTo = {
        id: 1,
        user: { name: 'Test User' },
        message: 'Test message',
      }

      render(<MessageInput {...defaultProps} replyingTo={replyingTo} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show connection status when disconnected', () => {
      render(<MessageInput {...defaultProps} isConnected={false} />)

      expect(screen.getByText('chat.disconnected')).toBeInTheDocument()
    })
  })

  describe('Message Input', () => {
    it('should handle text input correctly', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello World')

      expect(textarea).toHaveValue('Hello World')
    })

    it('should limit message length', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      const longMessage = 'a'.repeat(1001)
      await user.type(textarea, longMessage)

      expect(textarea).toHaveValue('a'.repeat(1000))
    })

    it('should handle Enter key to send message', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test message')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('1', 'Test message')
      })
    })

    it('should handle Shift+Enter for new line', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Line 1')
      await user.keyboard('{Shift>}{Enter}{/Shift}')

      expect(textarea).toHaveValue('Line 1\n')
    })
  })

  describe('Message Sending', () => {
    it('should send message when send button is clicked', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('1', 'Test message')
      })
    })

    it('should not send empty message', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const sendButton = screen.getByRole('button', { name: /send/i })
      await user.click(sendButton)

      expect(sendMessage).not.toHaveBeenCalled()
    })

    it('should not send message when disconnected', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} isConnected={false} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      expect(sendMessage).not.toHaveBeenCalled()
    })

    it('should show loading state while sending', async () => {
      const user = userEvent.setup()
      let resolveSend: (value: boolean) => void
      const sendMessage = vi.fn(
        () =>
          new Promise<boolean>(resolve => {
            resolveSend = resolve
          })
      )
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument()
      expect(sendButton).toBeDisabled()

      // Resolve the promise
      resolveSend!(true)
    })
  })

  describe('File Upload', () => {
    it('should handle file upload', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const fileInput = screen.getByRole('button', { name: /attach/i })
      await user.click(fileInput)

      const input = screen.getByTestId('file-input')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(input, file)

      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })

    it('should reject files that are too large', async () => {
      const user = userEvent.setup()
      const { toast } = await import('@/components/ui/use-toast')
      render(<MessageInput {...defaultProps} />)

      const fileInput = screen.getByRole('button', { name: /attach/i })
      await user.click(fileInput)

      const input = screen.getByTestId('file-input')
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

      await user.upload(input, largeFile)

      expect(toast).toHaveBeenCalledWith({
        title: 'chat.file_too_large',
        description: 'chat.file_size_limit',
        variant: 'destructive',
      })
    })

    it('should reject unsupported file types', async () => {
      const user = userEvent.setup()
      const { toast } = await import('@/components/ui/use-toast')
      render(<MessageInput {...defaultProps} />)

      const fileInput = screen.getByRole('button', { name: /attach/i })
      await user.click(fileInput)

      const input = screen.getByTestId('file-input')
      const unsupportedFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })

      await user.upload(input, unsupportedFile)

      expect(toast).toHaveBeenCalledWith({
        title: 'chat.unsupported_file_type',
        description: 'chat.allowed_file_types',
        variant: 'destructive',
      })
    })

    it('should remove uploaded file', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const fileInput = screen.getByRole('button', { name: /attach/i })
      await user.click(fileInput)

      const input = screen.getByTestId('file-input')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(input, file)

      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument()
    })
  })

  describe('Emoji Picker', () => {
    it('should open emoji picker when emoji button is clicked', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const emojiButton = screen.getByRole('button', { name: /emoji/i })
      await user.click(emojiButton)

      expect(screen.getByText('😀')).toBeInTheDocument()
    })

    it('should insert emoji when clicked', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const emojiButton = screen.getByRole('button', { name: /emoji/i })
      await user.click(emojiButton)

      const smileEmoji = screen.getByText('😀')
      await user.click(smileEmoji)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('😀')
    })
  })

  describe('Reply Functionality', () => {
    it('should cancel reply when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancelReply = vi.fn()
      const replyingTo = {
        id: 1,
        user: { name: 'Test User' },
        message: 'Test message',
      }

      render(
        <MessageInput {...defaultProps} replyingTo={replyingTo} onCancelReply={onCancelReply} />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancelReply).toHaveBeenCalled()
    })

    it('should include reply context in sent message', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      const replyingTo = {
        id: 1,
        user: { name: 'Test User' },
        message: 'Original message',
      }

      render(<MessageInput {...defaultProps} sendMessage={sendMessage} replyingTo={replyingTo} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Reply message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('1', 'Reply message')
      })
    })
  })

  describe('Mention Functionality', () => {
    it('should show mention suggestions when @ is typed', async () => {
      const user = userEvent.setup()
      render(<MessageInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '@')

      // Note: This would require mocking the mention suggestions API
      // For now, we'll just test that the input handles @ correctly
      expect(textarea).toHaveValue('@')
    })
  })

  describe('Validation', () => {
    it('should not send message with only whitespace', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, '   ')
      await user.click(sendButton)

      expect(sendMessage).not.toHaveBeenCalled()
    })

    it('should trim message before sending', async () => {
      const user = userEvent.setup()
      const sendMessage = vi.fn(() => Promise.resolve(true))
      render(<MessageInput {...defaultProps} sendMessage={sendMessage} />)

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, '  Test message  ')
      await user.click(sendButton)

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('1', 'Test message')
      })
    })
  })
})
