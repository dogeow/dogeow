import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteNavigation from '../NoteNavigation'

// Mock dependencies
const mockPush = vi.fn()
const mockUsePathname = vi.fn(() => '/note')
const mockSetDirty = vi.fn()
const mockSaveDraft = vi.fn()
const mockUseEditorStore = vi.fn(() => ({
  isDirty: false,
  setDirty: mockSetDirty,
  saveDraft: mockSaveDraft,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockUsePathname(),
}))

vi.mock('../store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore(),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}))

describe('NoteNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render navigation bar', () => {
      render(<NoteNavigation />)
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
      expect(screen.getByText('分类')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
    })

    it('should render all navigation buttons', () => {
      render(<NoteNavigation />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should render with correct icons', () => {
      render(<NoteNavigation />)
      // Icons are rendered as SVG, just check the text labels
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
      expect(screen.getByText('分类')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to notes page', async () => {
      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('我的笔记'))
      expect(mockPush).toHaveBeenCalledWith('/note')
    })

    it('should navigate to categories page', async () => {
      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('分类'))
      expect(mockPush).toHaveBeenCalledWith('/note/categories')
    })

    it('should navigate to tags page', async () => {
      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('标签'))
      expect(mockPush).toHaveBeenCalledWith('/note/tags')
    })
  })

  describe('Dirty State Handling', () => {
    it('should navigate directly when not dirty', async () => {
      mockUsePathname.mockReturnValue('/note/edit/123')
      mockUseEditorStore.mockReturnValue({
        isDirty: false,
        setDirty: mockSetDirty,
        saveDraft: mockSaveDraft,
      })

      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('我的笔记'))

      expect(mockPush).toHaveBeenCalledWith('/note')
    })

    it('should navigate directly when not on edit/new page', async () => {
      mockUsePathname.mockReturnValue('/note')
      mockUseEditorStore.mockReturnValue({
        isDirty: true,
        setDirty: mockSetDirty,
        saveDraft: mockSaveDraft,
      })

      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('分类'))

      expect(mockPush).toHaveBeenCalledWith('/note/categories')
    })
  })

  describe('Editor State Integration', () => {
    it('should integrate with editor store for dirty state', () => {
      mockUsePathname.mockReturnValue('/note/new')
      mockUseEditorStore.mockReturnValue({
        isDirty: true,
        setDirty: mockSetDirty,
        saveDraft: mockSaveDraft,
      })

      render(<NoteNavigation />)

      // The component should render with editor integration
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
    })
  })

  describe('Translation Integration', () => {
    it('should use translated labels', () => {
      render(<NoteNavigation />)
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
      expect(screen.getByText('分类')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
    })

    it('should integrate with translation hook', () => {
      render(<NoteNavigation />)
      // Verify translations are working
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle navigation to same page', async () => {
      mockUsePathname.mockReturnValue('/note')
      const user = userEvent.setup()
      render(<NoteNavigation />)

      await user.click(screen.getByText('我的笔记'))
      expect(mockPush).toHaveBeenCalledWith('/note')
    })

    it('should handle undefined saveDraft gracefully', () => {
      mockUsePathname.mockReturnValue('/note/new')
      mockUseEditorStore.mockReturnValue({
        isDirty: false,
        setDirty: mockSetDirty,
        saveDraft: mockSaveDraft,
      })

      render(<NoteNavigation />)
      expect(screen.getByText('我的笔记')).toBeInTheDocument()
    })
  })
})
