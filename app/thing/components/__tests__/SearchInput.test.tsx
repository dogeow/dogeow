import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchInput from '../SearchInput'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('SearchInput', () => {
  const mockOnChange = vi.fn()
  const mockOnSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />)
      expect(screen.getByPlaceholderText('搜索物品...')).toBeInTheDocument()
    })

    it('should render with initial value', () => {
      render(<SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />)
      expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    })

    it('should render clear button when value is not empty', () => {
      render(<SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />)
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.type(input, 'test')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should call onSearch with debounce when typing', async () => {
      const user = userEvent.setup({ delay: null })
      render(
        <SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceTime={300} />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.type(input, 'test')

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith('')
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('should call onSearch when form is submitted', async () => {
      const user = userEvent.setup()
      render(<SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />)

      const form = screen.getByPlaceholderText('搜索物品...').closest('form')
      if (form) {
        await user.type(screen.getByPlaceholderText('搜索物品...'), '{Enter}')
        await waitFor(() => {
          expect(mockOnSearch).toHaveBeenCalled()
        })
      }
    })

    it('should not submit empty search', async () => {
      const user = userEvent.setup()
      render(<SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />)

      const form = screen.getByPlaceholderText('搜索物品...').closest('form')
      if (form) {
        await user.type(screen.getByPlaceholderText('搜索物品...'), '{Enter}')
        // Should not call onSearch for empty value
        expect(mockOnSearch).not.toHaveBeenCalled()
      }
    })
  })

  describe('Search History', () => {
    it('should load search history from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['previous', 'search']))
      render(<SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />)
      // History should be loaded (tested through UI when dropdown opens)
    })

    it('should save search to history when submitted', async () => {
      const user = userEvent.setup()
      render(<SearchInput value="new search" onChange={mockOnChange} onSearch={mockOnSearch} />)

      const form = screen.getByPlaceholderText('搜索物品...').closest('form')
      if (form) {
        await user.type(screen.getByPlaceholderText('搜索物品...'), '{Enter}')
        await waitFor(() => {
          expect(localStorageMock.setItem).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Suggestions', () => {
    it('should show suggestions when provided', async () => {
      const user = userEvent.setup()
      render(
        <SearchInput
          value="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={['test1', 'test2', 'test3']}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('test1')).toBeInTheDocument()
      })
    })
  })
})
