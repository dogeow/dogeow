import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DarkModeToggle } from '../DarkModeToggle'

// Mock next-themes
const mockSetTheme = vi.fn()
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  setTheme: mockSetTheme,
}))

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}))

describe('DarkModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document classes
    document.documentElement.classList.remove('dark')
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })
  })

  describe('Rendering', () => {
    it('should render nothing when not mounted', () => {
      const { container } = render(<DarkModeToggle />)
      expect(container.firstChild).toBeNull()
    })

    it('should render theme toggle buttons after mount', async () => {
      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('主题:')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should display current theme', async () => {
      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText(/当前模式:/)).toBeInTheDocument()
      })
    })

    it('should show light mode as current when theme is light', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText(/浅色/)).toBeInTheDocument()
      })
    })

    it('should show dark mode as current when theme is dark', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText(/深色/)).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should call setTheme with light when light button is clicked', async () => {
      const user = userEvent.setup()
      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('主题:')).toBeInTheDocument()
      })

      const lightButton = screen.getByLabelText('浅色模式')
      await user.click(lightButton)

      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('should call setTheme with dark and add dark class when dark button is clicked', async () => {
      const user = userEvent.setup()
      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('主题:')).toBeInTheDocument()
      })

      const darkButton = screen.getByLabelText('深色模式')
      await user.click(darkButton)

      expect(mockSetTheme).toHaveBeenCalledWith('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
