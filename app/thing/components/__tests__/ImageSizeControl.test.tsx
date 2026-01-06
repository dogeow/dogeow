import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageSizeControl } from '../ImageSizeControl'

// Mock mathUtils
vi.mock('@/lib/helpers/mathUtils', () => ({
  ensureEven: (n: number) => Math.floor(n / 2) * 2,
}))

describe('ImageSizeControl', () => {
  const mockOnSizeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock container width
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 800,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render size control with preset buttons', () => {
      render(<ImageSizeControl initialSize={100} maxSize={500} onSizeChange={mockOnSizeChange} />)

      expect(screen.getByText(/XS/)).toBeInTheDocument()
      expect(screen.getByText(/S/)).toBeInTheDocument()
      expect(screen.getByText(/M/)).toBeInTheDocument()
      expect(screen.getByText(/L/)).toBeInTheDocument()
      expect(screen.getByText(/XL/)).toBeInTheDocument()
    })

    it('should display current image size', async () => {
      render(<ImageSizeControl initialSize={100} maxSize={500} onSizeChange={mockOnSizeChange} />)

      await waitFor(() => {
        expect(screen.getByText(/px/)).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should call onSizeChange when preset is clicked', async () => {
      const user = userEvent.setup()
      render(<ImageSizeControl initialSize={100} maxSize={500} onSizeChange={mockOnSizeChange} />)

      await waitFor(() => {
        expect(mockOnSizeChange).toHaveBeenCalled()
      })

      const smButton = screen.getByTitle(/Set image size to S/)
      await user.click(smButton)

      await waitFor(() => {
        expect(mockOnSizeChange).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle window resize', async () => {
      render(<ImageSizeControl initialSize={100} maxSize={500} onSizeChange={mockOnSizeChange} />)

      await waitFor(() => {
        expect(mockOnSizeChange).toHaveBeenCalled()
      })

      const initialCallCount = mockOnSizeChange.mock.calls.length

      // Simulate window resize
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: 1200,
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(mockOnSizeChange.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })
  })

  describe('Props', () => {
    it('should respect maxSize constraint', async () => {
      render(<ImageSizeControl initialSize={100} maxSize={200} onSizeChange={mockOnSizeChange} />)

      await waitFor(() => {
        const lastCall = mockOnSizeChange.mock.calls[mockOnSizeChange.mock.calls.length - 1]
        expect(lastCall[0]).toBeLessThanOrEqual(200)
      })
    })

    it('should use initialSize when provided', () => {
      render(<ImageSizeControl initialSize={150} maxSize={500} onSizeChange={mockOnSizeChange} />)

      expect(mockOnSizeChange).toHaveBeenCalled()
    })
  })
})
