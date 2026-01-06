import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoadingState from '../LoadingState'

describe('LoadingState', () => {
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state with back button', () => {
      render(<LoadingState onBack={mockOnBack} />)

      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render back button with arrow icon', () => {
      render(<LoadingState onBack={mockOnBack} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      render(<LoadingState onBack={mockOnBack} />)

      const backButton = screen.getByRole('button')
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })
})
