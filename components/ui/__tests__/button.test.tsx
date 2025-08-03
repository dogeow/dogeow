import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render button with default variant', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex items-center justify-center')
    })

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>)

      const button = screen.getByRole('button', { name: /custom button/i })
      expect(button).toHaveClass('custom-class')
    })

    it('should render button with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')

      rerender(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border bg-background')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-secondary')

      rerender(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

      rerender(<Button variant="link">Link</Button>)
      expect(screen.getByRole('button')).toHaveClass('text-primary underline-offset-4')
    })

    it('should render button with different sizes', () => {
      const { rerender } = render(<Button size="default">Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9 px-4 py-2')

      rerender(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-8 rounded-md px-3')

      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10 rounded-md px-6')

      rerender(<Button size="icon">Icon</Button>)
      expect(screen.getByRole('button')).toHaveClass('size-9')
    })

    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>)

      const button = screen.getByRole('button', { name: /disabled/i })
      expect(button).toBeDisabled()
      expect(button).toHaveClass('pointer-events-none opacity-50')
    })
  })

  describe('Interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button', { name: /click me/i })
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not handle click events when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button', { name: /disabled/i })
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn()
      render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>)

      const button = screen.getByRole('button', { name: /keyboard/i })
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('should handle focus events', () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus
        </Button>
      )

      const button = screen.getByRole('button', { name: /focus/i })

      fireEvent.focus(button)
      expect(handleFocus).toHaveBeenCalledTimes(1)

      fireEvent.blur(button)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>)

      const button = screen.getByRole('button', { name: /custom label/i })
      expect(button).toBeInTheDocument()
    })

    it('should have proper role attribute', () => {
      render(<Button>Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should be focusable', () => {
      render(<Button>Focusable</Button>)

      const button = screen.getByRole('button', { name: /focusable/i })
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>)

      const button = screen.getByRole('button', { name: /disabled/i })
      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Content', () => {
    it('should render children correctly', () => {
      render(<Button>Child content</Button>)

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should render with icon', () => {
      const Icon = () => <span data-testid="icon">🔍</span>
      render(
        <Button>
          <Icon />
          Search
        </Button>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button type="submit" form="test-form">
          Submit
        </Button>
      )

      const button = screen.getByRole('button', { name: /submit/i })
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
    })

    it('should handle ref correctly', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Ref Button</Button>)

      const button = screen.getByRole('button', { name: /ref button/i })
      expect(button).toBeInTheDocument()
    })

    it('should handle asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )

      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('Variants and Sizes Combinations', () => {
    it('should handle variant and size combinations', () => {
      const { rerender } = render(
        <Button variant="destructive" size="lg">
          Large Destructive
        </Button>
      )

      const button = screen.getByRole('button', { name: /large destructive/i })
      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveClass('h-10 rounded-md px-6')

      rerender(
        <Button variant="outline" size="sm">
          Small Outline
        </Button>
      )

      const smallButton = screen.getByRole('button', { name: /small outline/i })
      expect(smallButton).toHaveClass('border bg-background')
      expect(smallButton).toHaveClass('h-8 rounded-md px-3')
    })

    it('should handle disabled with different variants', () => {
      const { rerender } = render(
        <Button variant="default" disabled>
          Disabled Default
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('pointer-events-none opacity-50')

      rerender(
        <Button variant="destructive" disabled>
          Disabled Destructive
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('pointer-events-none opacity-50')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle null children', () => {
      render(<Button>{null}</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle undefined className', () => {
      render(<Button className={undefined}>Button</Button>)

      const button = screen.getByRole('button', { name: /button/i })
      expect(button).toBeInTheDocument()
    })

    it('should handle very long text content', () => {
      const longText = 'a'.repeat(1000)
      render(<Button>{longText}</Button>)

      const button = screen.getByRole('button', { name: new RegExp(longText) })
      expect(button).toBeInTheDocument()
    })
  })
})
