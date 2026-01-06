import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeedDial } from '../SpeedDial'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SpeedDial', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render speed dial button', () => {
      render(<SpeedDial />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render with default icon', () => {
      render(<SpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render with custom icon', () => {
      render(<SpeedDial icon={<span data-testid="custom-icon">Custom</span>} />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<SpeedDial className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when provided', async () => {
      const user = userEvent.setup()
      render(<SpeedDial onClick={mockOnClick} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should navigate to href when onClick is not provided', async () => {
      const user = userEvent.setup()
      render(<SpeedDial href="/custom-path" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockPush).toHaveBeenCalledWith('/custom-path')
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should use default href when neither onClick nor href is provided', async () => {
      const user = userEvent.setup()
      render(<SpeedDial />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockPush).toHaveBeenCalledWith('/thing/add')
    })
  })

  describe('Props', () => {
    it('should use default href when href is not provided', () => {
      render(<SpeedDial />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
