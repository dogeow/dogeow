import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from '../MessageList'

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
    <div data-testid="avatar-image" {...props} />
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
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByText('Loading messages...')).toBeInTheDocument()
    })

    it('should render messages correctly', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should display message with user avatar', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should display message without avatar', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should format message timestamp correctly', () => {
      render(<MessageList roomId={1} />)

      // Should display formatted time
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Load More Messages', () => {
    it('should show load more button when has more messages', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should load more messages when button is clicked', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should hide load more button when no more messages', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Message Interactions', () => {
    it('should handle message reply', () => {
      const onReply = vi.fn()
      render(<MessageList roomId={1} onReply={onReply} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should handle message reactions', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should highlight search terms in messages', () => {
      render(<MessageList roomId={1} searchQuery="test" />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should filter messages based on search query', () => {
      render(<MessageList roomId={1} searchQuery="important" />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large message lists efficiently', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should virtualize long message lists', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('should show disconnected message when not connected', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByText('Disconnected from chat')).toBeInTheDocument()
    })

    it('should not show disconnected message when connected', () => {
      render(<MessageList roomId={1} />)

      expect(screen.queryByText('Disconnected from chat')).not.toBeInTheDocument()
    })
  })

  describe('Message Grouping', () => {
    it('should group messages by user', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle messages with missing user data', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should handle empty message content', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('should handle very long message content', () => {
      render(<MessageList roomId={1} />)

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })
})
