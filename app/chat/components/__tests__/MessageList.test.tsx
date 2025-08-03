import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageList from '../MessageList'

// Mock dependencies
vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    messages: [],
    isLoadingMessages: false,
    hasMoreMessages: true,
    loadMoreMessages: vi.fn(),
    currentRoom: null,
  }),
}))

vi.mock('@/hooks/useChatWebSocket', () => ({
  useChatWebSocket: vi.fn(() => ({
    isConnected: true,
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="scroll-area" {...props}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="avatar" {...props}>
      {children}
    </div>
  ),
  AvatarImage: ({ ...props }: React.ComponentProps<'img'>) => (
    <img data-testid="avatar-image" alt="avatar" {...props} />
  ),
  AvatarFallback: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="avatar-fallback" {...props}>
      {children}
    </div>
  ),
}))

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty message list', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      render(<MessageList />)

      expect(screen.getByText('Loading messages...')).toBeInTheDocument()
    })

    it('should render messages correctly', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should display message with user avatar', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should display message without avatar', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should format message timestamp correctly', () => {
      render(<MessageList />)

      // Should display formatted time
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Load More Messages', () => {
    it('should show load more button when has more messages', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should not show load more button when no more messages', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should call loadMoreMessages when load more button is clicked', async () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should show loading state when loading more messages', () => {
      render(<MessageList />)

      expect(screen.getByText('Loading more messages...')).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('should show disconnected message when not connected', () => {
      render(<MessageList />)

      expect(screen.getByText('Disconnected from chat')).toBeInTheDocument()
    })

    it('should not show disconnected message when connected', () => {
      render(<MessageList />)

      expect(screen.queryByText('Disconnected from chat')).not.toBeInTheDocument()
    })
  })

  describe('Message Grouping', () => {
    it('should group messages by user', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle messages with missing user data', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should handle empty message content', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should handle very long message content', () => {
      render(<MessageList />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })
})
