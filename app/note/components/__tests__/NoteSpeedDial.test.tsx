import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteSpeedDial from '../NoteSpeedDial'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('NoteSpeedDial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render speed dial button', () => {
      render(<NoteSpeedDial />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render with Plus icon', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // The Plus icon is rendered as SVG, check button exists
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('should have circular button style', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
    })

    it('should have fixed positioning', () => {
      const { container } = render(<NoteSpeedDial />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('fixed')
      expect(wrapper).toHaveClass('right-6')
      expect(wrapper).toHaveClass('bottom-24')
    })

    it('should have proper z-index for overlay', () => {
      const { container } = render(<NoteSpeedDial />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('z-50')
    })

    it('should have shadow styling', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('shadow-lg')
    })

    it('should have correct size', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-14')
      expect(button).toHaveClass('w-14')
    })
  })

  describe('Interactions', () => {
    it('should navigate to /note/new when clicked', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockPush).toHaveBeenCalledWith('/note/new')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should be clickable multiple times', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should handle keyboard interaction', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should handle space key press', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })
  })

  describe('Styling', () => {
    it('should have primary background color', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('should have hover state styling', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-primary/90')
    })

    it('should have white text color', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-white')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should have button role', () => {
      render(<NoteSpeedDial />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be focusable', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Icon', () => {
    it('should render Plus icon with correct size', () => {
      render(<NoteSpeedDial />)
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('h-6')
      expect(svg).toHaveClass('w-6')
    })
  })

  describe('Position', () => {
    it('should be positioned at bottom right', () => {
      const { container } = render(<NoteSpeedDial />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('right-6')
      expect(wrapper).toHaveClass('bottom-24')
    })

    it('should not overlap with other UI elements', () => {
      const { container } = render(<NoteSpeedDial />)
      const wrapper = container.firstChild as HTMLElement
      // Z-index should be high enough to float above content
      expect(wrapper).toHaveClass('z-50')
    })
  })

  describe('Router Integration', () => {
    it('should use Next.js router', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      await user.click(screen.getByRole('button'))

      // Verify router.push is called, not window.location
      expect(mockPush).toHaveBeenCalled()
    })

    it('should navigate to correct route', async () => {
      const user = userEvent.setup()
      render(<NoteSpeedDial />)

      await user.click(screen.getByRole('button'))

      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })
  })
})
