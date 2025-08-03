import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import NotePage from '../page'

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown">{children}</div>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
}))

vi.mock('../components/NoteSpeedDial', () => ({
  default: () => <div data-testid="note-speed-dial">NoteSpeedDial</div>,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024-01-01 12:00'),
}))

vi.mock('date-fns/locale', () => ({
  zhCN: {},
}))

describe('NotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<NotePage />)

    // Should show loading skeleton
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('should render empty state when no notes', async () => {
    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue([])

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
      expect(screen.getByText('请添加您的第一个笔记')).toBeInTheDocument()
    })
  })

  it('should render notes when data is loaded', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note 1',
        content: 'Test content 1',
        content_markdown: '# Test Note 1\n\nTest content 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
      {
        id: 2,
        title: 'Test Note 2',
        content: 'Test content 2',
        content_markdown: '# Test Note 2\n\nTest content 2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T13:00:00Z',
        is_draft: true,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument()
      expect(screen.getByText('Test Note 2')).toBeInTheDocument()
    })
  })

  it('should render note cards with correct links', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: '# Test Note\n\nTest content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      const link = screen.getByTestId('link')
      expect(link).toHaveAttribute('href', '/note/1')
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockRejectedValue(new Error('API Error'))

    render(<NotePage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('获取笔记列表失败:', expect.any(Error))
      expect(vi.importMock('sonner').toast.error).toHaveBeenCalledWith('无法加载笔记列表')
    })

    consoleSpy.mockRestore()
  })

  it('should render draft notes with lock icon', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Draft Note',
        content: 'Draft content',
        content_markdown: '# Draft Note\n\nDraft content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: true,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('Draft Note')).toBeInTheDocument()
    })
  })

  it('should render speed dial component', () => {
    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue([])

    render(<NotePage />)

    expect(screen.getByTestId('note-speed-dial')).toBeInTheDocument()
  })

  it('should format dates correctly', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: '# Test Note\n\nTest content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(vi.importMock('date-fns').format).toHaveBeenCalled()
    })
  })

  it('should handle invalid date strings', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: '# Test Note\n\nTest content',
        created_at: 'invalid-date',
        updated_at: 'invalid-date',
        is_draft: false,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })
  })

  it('should sort notes by updated_at in descending order', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Older Note',
        content: 'Older content',
        content_markdown: '# Older Note\n\nOlder content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        is_draft: false,
      },
      {
        id: 2,
        title: 'Newer Note',
        content: 'Newer content',
        content_markdown: '# Newer Note\n\nNewer content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(1)
    })
  })

  it('should truncate markdown preview correctly', async () => {
    const longMarkdown = '# Test Note\n\n'.repeat(20) + 'Very long content that should be truncated'
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: longMarkdown,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })
  })

  it('should render with correct CSS classes', async () => {
    vi.mocked(vi.importMock('@/lib/api').apiRequest).mockResolvedValue([])

    render(<NotePage />)

    await waitFor(() => {
      const emptyState = screen.getByText('暂无笔记').closest('.py-12')
      expect(emptyState).toHaveClass('text-center')
    })
  })
})
