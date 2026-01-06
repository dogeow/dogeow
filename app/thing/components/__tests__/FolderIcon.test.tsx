import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FolderIcon from '../FolderIcon'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}))

describe('FolderIcon', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render folder icon', () => {
      render(<FolderIcon isOpen={false} />)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<FolderIcon isOpen={false} className="custom-class" />)
      const element = container.firstChild
      expect(element).toHaveClass('custom-class')
    })

    it('should use custom size', () => {
      render(<FolderIcon isOpen={false} size={24} />)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup()
      render(<FolderIcon isOpen={false} onClick={mockOnClick} />)

      const icon = screen.getByRole('generic')
      await user.click(icon)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when not provided', async () => {
      const user = userEvent.setup()
      render(<FolderIcon isOpen={false} />)

      const icon = screen.getByRole('generic')
      await user.click(icon)

      // Should not throw error
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should show different styles when isOpen is true', () => {
      const { container: containerOpen } = render(<FolderIcon isOpen={true} />)
      const { container: containerClosed } = render(<FolderIcon isOpen={false} />)

      const openElement = containerOpen.firstChild
      const closedElement = containerClosed.firstChild

      expect(openElement).toHaveClass('text-primary')
      expect(closedElement).toHaveClass('text-muted-foreground')
    })
  })
})
