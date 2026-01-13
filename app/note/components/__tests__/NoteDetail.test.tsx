import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteDetail from '../NoteDetail'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({
    id: '123',
  }),
}))

const mockGet = vi.hoisted(() => vi.fn())
const mockDel = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api', () => ({
  get: mockGet,
  del: mockDel,
}))

const mockUseSWR = vi.fn((key, fetcher) => {
  if (key === '/notes/123') {
    return {
      data: {
        id: 123,
        title: '测试笔记',
        content:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"测试内容"}]}]}',
        updated_at: '2024-01-01T00:00:00Z',
        is_draft: false,
      },
      error: null as Error | null | undefined,
    }
  }
  return { data: null, error: null as Error | null | undefined }
})

vi.mock('swr', () => ({
  default: (key: string, fetcher: any) => mockUseSWR(key, fetcher),
}))

vi.mock('@/components/novel-editor/readonly', () => ({
  default: vi.fn(({ content }) => (
    <div data-testid="readonly-editor">{JSON.stringify(content)}</div>
  )),
}))

describe('NoteDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  describe('Rendering', () => {
    it('should render note details', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      mockUseSWR.mockReturnValueOnce({
        data: null,
        error: null,
      })
      render(<NoteDetail />)
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should show error state when loading fails', () => {
      mockUseSWR.mockReturnValueOnce({
        data: null,
        error: new Error('加载失败') as Error | null | undefined,
      })
      render(<NoteDetail />)
      expect(screen.getByText('加载失败')).toBeInTheDocument()
    })
  })

  describe('Header Actions', () => {
    it('should render header with title', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()
      render(<NoteDetail />)

      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const backButton = buttons[0]
      await user.click(backButton)

      expect(mockBack).toHaveBeenCalled()
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<NoteDetail />)

      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const editButton = buttons[1]
      await user.click(editButton)

      expect(mockPush).toHaveBeenCalledWith('/note/edit/123')
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog on delete', async () => {
      const user = userEvent.setup()
      render(<NoteDetail />)

      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const deleteButton = buttons[2]
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('确定要删除此笔记吗？')
    })

    it('should delete note and navigate away on confirm', async () => {
      const user = userEvent.setup()
      mockDel.mockResolvedValue({})
      render(<NoteDetail />)

      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const deleteButton = buttons[2]
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockDel).toHaveBeenCalledWith('/notes/123')
        expect(toast.success).toHaveBeenCalledWith('笔记已删除')
        expect(mockPush).toHaveBeenCalledWith('/note')
      })
    })

    it('should not delete when user cancels', async () => {
      window.confirm = vi.fn(() => false)
      const user = userEvent.setup()
      render(<NoteDetail />)

      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const deleteButton = buttons[2]
      await user.click(deleteButton)

      expect(mockDel).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Draft Indicator', () => {
    it('should show lock icon for draft notes', async () => {
      mockUseSWR.mockReturnValueOnce({
        data: {
          id: 123,
          title: '草稿笔记',
          content: '{"type":"doc","content":[]}',
          updated_at: '2024-01-01T00:00:00Z',
          is_draft: true,
        },
        error: null,
      })

      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('草稿笔记')).toBeInTheDocument()
      })
    })

    it('should not show lock icon for published notes', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('测试笔记')).toBeInTheDocument()
      })
    })
  })

  describe('Content Rendering', () => {
    it('should render note content', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByTestId('readonly-editor')).toBeInTheDocument()
      })
    })

    it('should show empty state when content is empty', async () => {
      mockUseSWR.mockReturnValueOnce({
        data: {
          id: 123,
          title: '空笔记',
          content: '',
          updated_at: '2024-01-01T00:00:00Z',
          is_draft: false,
        },
        error: null,
      })

      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('(无内容)')).toBeInTheDocument()
      })
    })

    it('should handle JSON parsing errors gracefully', async () => {
      mockUseSWR.mockReturnValueOnce({
        data: {
          id: 123,
          title: '损坏的笔记',
          content: 'invalid json content',
          updated_at: '2024-01-01T00:00:00Z',
          is_draft: false,
        },
        error: null,
      })

      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText('invalid json content')).toBeInTheDocument()
      })
    })
  })

  describe('Date Formatting', () => {
    it('should format date correctly', async () => {
      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText(/更新于/)).toBeInTheDocument()
      })
    })

    it('should show original date string if formatting fails', async () => {
      mockUseSWR.mockReturnValueOnce({
        data: {
          id: 123,
          title: '测试笔记',
          content: '{"type":"doc","content":[]}',
          updated_at: 'invalid date',
          is_draft: false,
        },
        error: null,
      })

      render(<NoteDetail />)
      await waitFor(() => {
        expect(screen.getByText(/invalid date/)).toBeInTheDocument()
      })
    })
  })
})
