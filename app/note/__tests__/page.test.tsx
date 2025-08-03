import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    success: vi.fn(),
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
  format: vi.fn((date: Date) => date.toISOString()),
}))

vi.mock('date-fns/locale', () => ({
  zhCN: {},
}))

describe('NotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<NotePage />)

    // Should show loading skeleton
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('should render empty state when no notes', async () => {
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue([])

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

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(mockNotes)

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

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      const link = screen.getByTestId('link')
      expect(link).toHaveAttribute('href', '/note/1')
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockRejectedValue(new Error('API Error'))

    const { toast } = await import('sonner')

    render(<NotePage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('获取笔记列表失败:', expect.any(Error))
      expect(toast.error).toHaveBeenCalledWith('无法加载笔记列表')
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

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(mockNotes)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('Draft Note')).toBeInTheDocument()
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })
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

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(mockNotes)

    const { format } = await import('date-fns')
    vi.mocked(format).mockReturnValue('2024-01-01')

    render(<NotePage />)

    await waitFor(() => {
      expect(format).toHaveBeenCalled()
    })
  })

  it('should handle empty notes array', async () => {
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue([])

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })

  it('should handle null API response', async () => {
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(null)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })

  it('should handle undefined API response', async () => {
    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValue(undefined)

    render(<NotePage />)

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })
})
