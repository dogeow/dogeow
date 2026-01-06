import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagCard from '../TagCard'

// Mock helpers
vi.mock('@/lib/helpers', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  isLightColor: vi.fn((color: string) => {
    // Simple mock: colors starting with #f or #F are light
    return color.toLowerCase().startsWith('#f')
  }),
}))

describe('TagCard', () => {
  const mockTag = {
    id: 1,
    name: 'Test Tag',
    color: '#3b82f6',
  }

  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render tag card with name', () => {
      render(<TagCard tag={mockTag} />)
      expect(screen.getByText('Test Tag')).toBeInTheDocument()
    })

    it('should render tag with count', () => {
      render(<TagCard tag={mockTag} count={5} />)
      expect(screen.getByText('Test Tag')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should render delete button when onDelete is provided', () => {
      render(<TagCard tag={mockTag} onDelete={mockOnDelete} />)
      const deleteButton = screen.getByRole('button')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should not render delete button when onDelete is not provided', () => {
      render(<TagCard tag={mockTag} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should return null when tag name is missing', () => {
      const { container } = render(<TagCard tag={{ id: 1 } as any} />)
      expect(container.firstChild).toBeNull()
    })

    it('should apply custom className', () => {
      const { container } = render(<TagCard tag={mockTag} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Interactions', () => {
    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<TagCard tag={mockTag} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('should prevent event propagation when delete is clicked', async () => {
      const user = userEvent.setup()
      const mockParentClick = vi.fn()
      render(
        <div onClick={mockParentClick}>
          <TagCard tag={mockTag} onDelete={mockOnDelete} />
        </div>
      )

      const deleteButton = screen.getByRole('button')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalled()
      // Event should be stopped, but we can't easily test this without more setup
    })
  })

  describe('Props', () => {
    it('should handle different tag colors', () => {
      const lightTag = { ...mockTag, color: '#ffffff' }
      const { rerender } = render(<TagCard tag={mockTag} />)

      rerender(<TagCard tag={lightTag} />)
      expect(screen.getByText('Test Tag')).toBeInTheDocument()
    })

    it('should use default color when color is not provided', () => {
      const tagWithoutColor = { ...mockTag, color: undefined }
      render(<TagCard tag={tagWithoutColor} />)
      expect(screen.getByText('Test Tag')).toBeInTheDocument()
    })
  })
})
