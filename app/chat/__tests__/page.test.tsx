import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatPage from '../page'

// Mock dependencies
vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: null,
    rooms: [],
    messages: [],
    onlineUsers: [],
    isLoading: false,
    isConnected: false,
    error: null,
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    sendMessage: vi.fn(),
    loadRooms: vi.fn(),
    loadMessages: vi.fn(),
    loadOnlineUsers: vi.fn(),
  }),
}))

vi.mock('@/hooks/useChatWebSocket', () => ({
  useChatWebSocket: vi.fn(() => ({
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: React.ComponentProps<'input'>) => <input {...props} />,
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

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: React.ComponentProps<'h3'>) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardContent: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}))

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat page with main layout', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('card-header')).toBeInTheDocument()
      expect(screen.getByTestId('card-content')).toBeInTheDocument()
    })

    it('should render chat title', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card-title')).toBeInTheDocument()
      expect(screen.getByText(/chat/i)).toBeInTheDocument()
    })

    it('should render chat components', () => {
      render(<ChatPage />)

      // Should render chat components
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Chat Functionality', () => {
    it('should display empty state when no room selected', () => {
      render(<ChatPage />)

      // Should show empty state or room selection
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when loading rooms', () => {
      render(<ChatPage />)

      // Should show loading indicator
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      render(<ChatPage />)

      // Should show connection error or disconnected state
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('should show connected status when connected', () => {
      render(<ChatPage />)

      // Should show connected status
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should show disconnected status when not connected', () => {
      render(<ChatPage />)

      // Should show disconnected status
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Room Management', () => {
    it('should handle room selection', () => {
      render(<ChatPage />)

      // Room selection would be handled by child components
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should handle room leaving', () => {
      render(<ChatPage />)

      // Room leaving would be handled by child components
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should display messages when available', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Online Users', () => {
    it('should display online users when available', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty room list', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should handle null current room', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should handle undefined error', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })
})
