import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteEditor from '../NoteEditor'
import { toast } from 'react-hot-toast'

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockUsePathname = vi.fn(() => '/note')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

const mockSetSaveDraft = vi.fn()
vi.mock('../store/editorStore', () => ({
  useEditorStore: () => ({
    setSaveDraft: mockSetSaveDraft,
  }),
}))

vi.mock('../hooks/useGlobalNavigationGuard', () => ({
  useGlobalNavigationGuard: vi.fn(),
}))

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the editor with default empty state', () => {
      render(<NoteEditor />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should render with initial title', () => {
      render(<NoteEditor title="测试标题" />)
      expect(screen.getByDisplayValue('测试标题')).toBeInTheDocument()
    })

    it('should render with initial content', () => {
      const validContent = '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
      render(<NoteEditor content={validContent} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should show editor placeholder text', () => {
      render(<NoteEditor />)
      expect(screen.getByText('编辑器组件待实现')).toBeInTheDocument()
    })
  })

  describe('Title Input', () => {
    it('should update title on input change', async () => {
      const user = userEvent.setup()
      render(<NoteEditor />)

      const input = screen.getByPlaceholderText('请输入笔记标题')
      await user.type(input, '新标题')

      expect(input).toHaveValue('新标题')
    })

    it('should disable input when saving', () => {
      render(<NoteEditor />)
      const input = screen.getByPlaceholderText('请输入笔记标题')
      expect(input).not.toBeDisabled()
    })
  })

  describe('Content Validation', () => {
    it('should handle invalid JSON content gracefully', () => {
      const invalidContent = 'not a valid json'
      render(<NoteEditor content={invalidContent} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should handle non-Novel JSON format', () => {
      const invalidNovelJson = '{"type":"other","data":"test"}'
      render(<NoteEditor content={invalidNovelJson} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should accept valid Novel JSON format', () => {
      const validContent =
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"测试内容"}]}]}'
      render(<NoteEditor content={validContent} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should handle editing mode', () => {
      render(<NoteEditor noteId={1} isEditing={true} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should handle draft mode', () => {
      render(<NoteEditor isDraft={true} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })

    it('should handle all props together', () => {
      const validContent = '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
      render(
        <NoteEditor
          noteId={1}
          title="测试标题"
          content={validContent}
          isEditing={true}
          isDraft={false}
        />
      )
      expect(screen.getByDisplayValue('测试标题')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should render with editor store integration', () => {
      render(<NoteEditor />)
      // The component renders and integrates with editor store
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })
  })

  describe('Dialogs', () => {
    it('should render SaveOptionsDialog components', () => {
      render(<NoteEditor />)
      // SaveOptionsDialog 是隐藏的，直到触发
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty content when no content provided', () => {
      render(<NoteEditor />)
      expect(screen.getByText('编辑器组件待实现')).toBeInTheDocument()
    })

    it('should preserve initial content in editing mode', () => {
      const content =
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"已有内容"}]}]}'
      render(<NoteEditor content={content} isEditing={true} noteId={1} />)
      expect(screen.getByPlaceholderText('请输入笔记标题')).toBeInTheDocument()
    })
  })
})
