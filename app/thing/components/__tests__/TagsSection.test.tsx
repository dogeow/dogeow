import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagsSection from '../TagsSection'
import { Tag } from '../types'

// Mock CreateTagDialog
vi.mock('../CreateTagDialog', () => ({
  default: ({ open, onOpenChange, onTagCreated, initialName }: any) =>
    open ? (
      <div data-testid="create-tag-dialog">
        <button onClick={() => onTagCreated({ id: 1, name: initialName || 'New Tag' })}>
          Create
        </button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}))

// Mock helpers
vi.mock('@/lib/helpers', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  isLightColor: vi.fn((color: string) => color.toLowerCase().startsWith('#f')),
}))

describe('TagsSection', () => {
  const mockTags: Tag[] = [
    { id: 1, name: 'Tag 1', color: '#3b82f6' },
    { id: 2, name: 'Tag 2', color: '#10b981' },
  ]

  const mockSelectedTags: string[] = []
  const mockSetSelectedTags = vi.fn()
  const mockOnTagCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Rendering', () => {
    it('should render tags section', () => {
      render(
        <TagsSection
          selectedTags={mockSelectedTags}
          setSelectedTags={mockSetSelectedTags}
          tags={mockTags}
          onTagCreated={mockOnTagCreated}
        />
      )

      expect(screen.getByText('标签')).toBeInTheDocument()
      expect(screen.getByText('编辑物品的标签')).toBeInTheDocument()
    })

    it('should show selected tags count', async () => {
      const user = userEvent.setup()
      render(
        <TagsSection
          selectedTags={['1']}
          setSelectedTags={mockSetSelectedTags}
          tags={mockTags}
          onTagCreated={mockOnTagCreated}
        />
      )

      const trigger = screen.getByText(/选择标签|已选择/)
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Tag 1')).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should open create tag dialog when create button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TagsSection
          selectedTags={mockSelectedTags}
          setSelectedTags={mockSetSelectedTags}
          tags={mockTags}
          onTagCreated={mockOnTagCreated}
        />
      )

      const createButton = screen.getByRole('button', { name: /plus|tag/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('create-tag-dialog')).toBeInTheDocument()
      })
    })

    it('should toggle tag selection when tag is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TagsSection
          selectedTags={mockSelectedTags}
          setSelectedTags={mockSetSelectedTags}
          tags={mockTags}
          onTagCreated={mockOnTagCreated}
        />
      )

      const trigger = screen.getByText(/选择标签/)
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Tag 1')).toBeInTheDocument()
      })

      const tag1 = screen.getByText('Tag 1')
      await user.click(tag1)

      expect(mockSetSelectedTags).toHaveBeenCalled()
    })
  })
})
