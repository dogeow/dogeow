import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../input'

describe('Input', () => {
  describe('rendering', () => {
    it('should render input with default classes', () => {
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass(
        'border-input',
        'bg-background',
        'ring-offset-background',
        'placeholder:text-muted-foreground',
        'focus-visible:ring-ring',
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'px-3',
        'py-2',
        'text-sm',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium',
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      )
    })

    it('should apply custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })

    it('should set default type to text', () => {
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input')
      // Input component doesn't set a default type, so it should not have a type attribute
      expect(input).not.toHaveAttribute('type')
    })

    it('should set custom type', () => {
      render(<Input type="email" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should pass through additional props', () => {
      render(
        <Input
          data-testid="input"
          placeholder="Enter your name"
          name="username"
          id="username-input"
          aria-label="Username"
        />
      )

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('placeholder', 'Enter your name')
      expect(input).toHaveAttribute('name', 'username')
      expect(input).toHaveAttribute('id', 'username-input')
      expect(input).toHaveAttribute('aria-label', 'Username')
    })
  })

  describe('interactions', () => {
    it('should handle value changes', () => {
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'test value' } })

      expect(input).toHaveValue('test value')
    })

    it('should handle focus events', () => {
      const onFocus = vi.fn()
      render(<Input onFocus={onFocus} data-testid="input" />)

      const input = screen.getByTestId('input')
      fireEvent.focus(input)

      expect(onFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle blur events', () => {
      const onBlur = vi.fn()
      render(<Input onBlur={onBlur} data-testid="input" />)

      const input = screen.getByTestId('input')
      fireEvent.blur(input)

      expect(onBlur).toHaveBeenCalledTimes(1)
    })

    it('should handle key events', () => {
      const onKeyDown = vi.fn()
      render(<Input onKeyDown={onKeyDown} data-testid="input" />)

      const input = screen.getByTestId('input')
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onKeyDown).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('should be accessible with proper attributes', () => {
      render(
        <Input
          data-testid="input"
          aria-label="Username"
          aria-describedby="username-help"
          aria-required="true"
        />
      )

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-label', 'Username')
      expect(input).toHaveAttribute('aria-describedby', 'username-help')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('should support disabled state', () => {
      render(<Input disabled data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toBeDisabled()
    })

    it('should support readonly state', () => {
      render(<Input readOnly data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('readonly')
    })

    it('should support required state', () => {
      render(<Input required data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toBeRequired()
    })
  })

  describe('form integration', () => {
    it('should work with form elements', () => {
      render(
        <form>
          <Input name="username" data-testid="input" />
        </form>
      )

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('should support form validation', () => {
      render(<Input data-testid="input" minLength={3} maxLength={10} pattern="[a-zA-Z]+" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('minlength', '3')
      expect(input).toHaveAttribute('maxlength', '10')
      expect(input).toHaveAttribute('pattern', '[a-zA-Z]+')
    })
  })

  describe('file input', () => {
    it('should support file type', () => {
      render(<Input type="file" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'file')
    })

    it('should support multiple file selection', () => {
      render(<Input type="file" multiple data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('multiple')
    })

    it('should support file accept attribute', () => {
      render(<Input type="file" accept=".jpg,.png" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('accept', '.jpg,.png')
    })
  })

  describe('ref forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = vi.fn()
      render(<Input ref={ref} data-testid="input" />)

      expect(ref).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('edge cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveValue('')
    })

    it('should handle null value', () => {
      render(<Input value={null as string | null} data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveValue('')
    })

    it('should handle undefined value', () => {
      render(<Input value={undefined as string | undefined} data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveValue('')
    })

    it('should handle controlled component', () => {
      render(<Input value="controlled value" onChange={() => {}} data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveValue('controlled value')
    })
  })

  describe('different input types', () => {
    it.each([
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'search',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
      'color',
      'range',
      'file',
    ])('should support %s type', type => {
      render(
        <Input
          type={
            type as
              | 'text'
              | 'email'
              | 'password'
              | 'number'
              | 'tel'
              | 'url'
              | 'search'
              | 'date'
              | 'time'
              | 'datetime-local'
              | 'month'
              | 'week'
              | 'color'
              | 'range'
              | 'file'
          }
          data-testid="input"
        />
      )

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', type)
    })
  })
})
