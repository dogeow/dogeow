import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuantityEditor from '../QuantityEditor'

describe('QuantityEditor', () => {
  const mockOnQuantityChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Rendering', () => {
    it('should render quantity badge when not editing', () => {
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      expect(screen.getByText(/× 5/)).toBeInTheDocument()
    })

    it('should render input when editing', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should enter edit mode when badge is clicked', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toHaveValue(5)
      })
    })

    it('should save quantity when Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      const input = await screen.findByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnQuantityChange).toHaveBeenCalledWith(10)
      })
    })

    it('should cancel edit when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      const input = await screen.findByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10')
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
        expect(screen.getByText(/× 5/)).toBeInTheDocument()
      })
    })

    it('should save quantity when input loses focus', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      const input = await screen.findByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10')
      await user.tab()

      await waitFor(() => {
        expect(mockOnQuantityChange).toHaveBeenCalledWith(10)
      })
    })

    it('should not save invalid quantity', async () => {
      const user = userEvent.setup()
      render(<QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />)

      const badge = screen.getByText(/× 5/)
      await user.click(badge)

      const input = await screen.findByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '0')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnQuantityChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('Props', () => {
    it('should update when external quantity changes', () => {
      const { rerender } = render(
        <QuantityEditor quantity={5} onQuantityChange={mockOnQuantityChange} />
      )

      expect(screen.getByText(/× 5/)).toBeInTheDocument()

      rerender(<QuantityEditor quantity={10} onQuantityChange={mockOnQuantityChange} />)

      expect(screen.getByText(/× 10/)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <QuantityEditor
          quantity={5}
          onQuantityChange={mockOnQuantityChange}
          className="custom-class"
        />
      )

      const badge = container.querySelector('.custom-class')
      expect(badge).toBeInTheDocument()
    })
  })
})
