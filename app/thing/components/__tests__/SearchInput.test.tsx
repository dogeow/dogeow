import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import SearchInput from '../SearchInput'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

interface ControlledSearchInputProps {
  initialValue?: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  debounceTime?: number
  suggestions?: string[]
}

function ControlledSearchInput({
  initialValue = '',
  onChange,
  onSearch,
  debounceTime,
  suggestions,
}: ControlledSearchInputProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <SearchInput
      value={value}
      onChange={newValue => {
        setValue(newValue)
        onChange(newValue)
      }}
      onSearch={onSearch}
      debounceTime={debounceTime}
      suggestions={suggestions}
    />
  )
}

describe('SearchInput', () => {
  const mockOnChange = vi.fn()
  const mockOnSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} />)
      expect(screen.getByPlaceholderText('搜索物品...')).toBeInTheDocument()
    })

    it('should render with initial value', () => {
      render(
        <ControlledSearchInput
          initialValue="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      )
      expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    })

    it('should render clear button when value is not empty', () => {
      render(
        <ControlledSearchInput
          initialValue="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      )
      expect(screen.getByRole('button', { name: '清除搜索' })).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      render(<ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.type(input, 'test')

      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnChange).toHaveBeenLastCalledWith('test')
    })

    it('should call onSearch with debounce when typing', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} debounceTime={300} />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.type(input, 'test')

      vi.advanceTimersByTime(299)
      expect(mockOnSearch).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ControlledSearchInput
          initialValue="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      )

      const clearButton = screen.getByRole('button', { name: '清除搜索' })
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith('')
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('should call onSearch when form is submitted', async () => {
      const user = userEvent.setup()
      render(
        <ControlledSearchInput
          initialValue="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      )

      const submitButton = screen.getByRole('button', { name: '搜索' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('should not submit empty search', async () => {
      const user = userEvent.setup()
      render(<ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} />)

      const submitButton = screen.getByRole('button', { name: '搜索' })
      expect(submitButton).toBeDisabled()
      await user.click(submitButton)
      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('should no-op when forcing submit with blank value', () => {
      render(
        <ControlledSearchInput initialValue="   " onChange={mockOnChange} onSearch={mockOnSearch} />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.submit(input.closest('form')!)
      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('should trigger empty search after debounce when input is cleared by typing', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ControlledSearchInput
          initialValue="abc"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          debounceTime={200}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      await user.clear(input)

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('')
      })
    })

    it('should clear pending debounce timer and refocus input on submit', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      const originalRaf = globalThis.requestAnimationFrame
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        cb(0)
        return 1
      })

      const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus')

      render(
        <ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} debounceTime={300} />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      input.focus()
      focusSpy.mockClear()

      await user.type(input, 'timer')
      fireEvent.submit(input.closest('form')!)

      expect(mockOnSearch).toHaveBeenCalledWith('timer')
      vi.advanceTimersByTime(300)
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
      expect(focusSpy).toHaveBeenCalled()

      focusSpy.mockRestore()
      vi.stubGlobal('requestAnimationFrame', originalRaf)
    })
  })

  describe('Search History', () => {
    it('should load search history from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['previous search']))
      const user = userEvent.setup()
      render(
        <ControlledSearchInput initialValue="pre" onChange={mockOnChange} onSearch={mockOnSearch} />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.focus(input)

      await waitFor(() => {
        expect(screen.getByText('previous search')).toBeInTheDocument()
      })
    })

    it('should save search to history when submitted', async () => {
      const user = userEvent.setup()
      render(
        <ControlledSearchInput
          initialValue="new search"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      )

      const submitButton = screen.getByRole('button', { name: '搜索' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })
    })

    it('should tolerate malformed search history in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('not-valid-json')

      render(<ControlledSearchInput onChange={mockOnChange} onSearch={mockOnSearch} />)

      expect(screen.getByPlaceholderText('搜索物品...')).toBeInTheDocument()
    })
  })

  describe('Suggestions', () => {
    it('should show suggestions when provided', async () => {
      const user = userEvent.setup()
      render(
        <ControlledSearchInput
          initialValue="test"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={['test1', 'test2', 'test3']}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.focus(input)

      await waitFor(() => {
        expect(screen.getByText('test1')).toBeInTheDocument()
      })
    })

    it('should select suggestion and trigger change/search', async () => {
      const user = userEvent.setup()
      render(
        <ControlledSearchInput
          initialValue="te"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={['test1', 'test2']}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.focus(input)

      const suggestion = await screen.findByText('test1')
      await user.click(suggestion)

      expect(mockOnChange).toHaveBeenCalledWith('test1')
      expect(mockOnSearch).toHaveBeenCalledWith('test1')
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should clear history and close suggestions after blur timeout', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['history one']))

      render(
        <ControlledSearchInput
          initialValue="hi"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={['hint']}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.focus(input)
      await screen.findByText('history one')

      await user.click(screen.getByRole('button', { name: '清除' }))
      expect(localStorageMock.removeItem).toHaveBeenCalled()

      fireEvent.blur(input)
      vi.advanceTimersByTime(200)
      await waitFor(() => {
        expect(screen.queryByText('hint')).not.toBeInTheDocument()
      })
    })

    it('should select history item and trigger search', async () => {
      const user = userEvent.setup()
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['history pick']))

      render(
        <ControlledSearchInput
          initialValue="his"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={[]}
        />
      )

      const input = screen.getByPlaceholderText('搜索物品...')
      fireEvent.focus(input)

      const historyItem = await screen.findByText('history pick')
      await user.click(historyItem)

      expect(mockOnChange).toHaveBeenCalledWith('history pick')
      expect(mockOnSearch).toHaveBeenCalledWith('history pick')
    })
  })
})
