import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Avatar, AvatarImage, AvatarFallback } from '../avatar'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    onLoad,
    onError,
    ...props
  }: {
    src?: string
    alt?: string
    className?: string
    onLoad?: () => void
    onError?: () => void
    [key: string]: unknown
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      data-testid="avatar-image"
      {...props}
    />
  ),
}))

describe('Avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Avatar', () => {
    it('should render avatar with default classes', () => {
      render(<Avatar data-testid="avatar" />)

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveClass(
        'relative',
        'flex',
        'h-10',
        'w-10',
        'shrink-0',
        'overflow-hidden',
        'rounded-full'
      )
    })

    it('should apply custom className', () => {
      render(<Avatar className="custom-class" data-testid="avatar" />)

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveClass('custom-class')
    })

    it('should pass through additional props', () => {
      render(<Avatar data-testid="avatar" aria-label="User avatar" />)

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveAttribute('aria-label', 'User avatar')
    })

    it('should render children', () => {
      render(
        <Avatar data-testid="avatar">
          <span data-testid="child">Child content</span>
        </Avatar>
      )

      const avatar = screen.getByTestId('avatar')
      const child = screen.getByTestId('child')

      expect(avatar).toBeInTheDocument()
      expect(child).toBeInTheDocument()
      expect(child).toHaveTextContent('Child content')
    })
  })

  describe('AvatarImage', () => {
    it('should render image when src is provided', () => {
      render(<AvatarImage src="/test-image.jpg" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/test-image.jpg')
      expect(image).toHaveAttribute('alt', 'Test avatar')
    })

    it('should not render when src is not provided', () => {
      render(<AvatarImage alt="Test avatar" />)

      const image = screen.queryByTestId('avatar-image')
      expect(image).not.toBeInTheDocument()
    })

    it('should not render when image fails to load', () => {
      render(<AvatarImage src="/test-image.jpg" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      fireEvent.error(image)

      // After error, image should not be rendered
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<AvatarImage src="/test-image.jpg" className="custom-class" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toHaveClass('custom-class')
    })

    it('should handle image load event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(<AvatarImage src="/test-image.jpg" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      fireEvent.load(image)

      expect(consoleSpy).toHaveBeenCalledWith('Avatar image loaded:', '/test-image.jpg')

      consoleSpy.mockRestore()
    })

    it('should handle image error event', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<AvatarImage src="/test-image.jpg" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      fireEvent.error(image)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Avatar image failed to load:',
        '/test-image.jpg',
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })

    it('should handle dicebear URLs with unoptimized loading', () => {
      render(<AvatarImage src="https://dicebear.com/api/avataaars/test.svg" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toBeInTheDocument()
    })

    it('should handle ui-avatars URLs with unoptimized loading', () => {
      render(<AvatarImage src="https://ui-avatars.com/api/?name=Test" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toBeInTheDocument()
    })

    it('should handle robohash URLs with unoptimized loading', () => {
      render(<AvatarImage src="https://robohash.org/test" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toBeInTheDocument()
    })

    it('should handle width and height props', () => {
      render(<AvatarImage src="/test-image.jpg" width={100} height={100} alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toHaveAttribute('width', '100')
      expect(image).toHaveAttribute('height', '100')
    })

    it('should handle string width and height', () => {
      render(<AvatarImage src="/test-image.jpg" width="100" height="100" alt="Test avatar" />)

      const image = screen.getByTestId('avatar-image')
      expect(image).toBeInTheDocument()
      // String values should not be passed as width/height attributes
      expect(image).not.toHaveAttribute('width')
      expect(image).not.toHaveAttribute('height')
    })
  })

  describe('AvatarFallback', () => {
    it('should render fallback with default classes', () => {
      render(<AvatarFallback data-testid="fallback" />)

      const fallback = screen.getByTestId('fallback')
      expect(fallback).toBeInTheDocument()
      expect(fallback).toHaveClass(
        'bg-muted',
        'flex',
        'h-full',
        'w-full',
        'items-center',
        'justify-center',
        'rounded-full'
      )
    })

    it('should apply custom className', () => {
      render(<AvatarFallback className="custom-class" data-testid="fallback" />)

      const fallback = screen.getByTestId('fallback')
      expect(fallback).toHaveClass('custom-class')
    })

    it('should render children', () => {
      render(
        <AvatarFallback data-testid="fallback">
          <span data-testid="fallback-content">JD</span>
        </AvatarFallback>
      )

      const fallback = screen.getByTestId('fallback')
      const content = screen.getByTestId('fallback-content')

      expect(fallback).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('JD')
    })

    it('should pass through additional props', () => {
      render(<AvatarFallback data-testid="fallback" aria-label="Avatar fallback" />)

      const fallback = screen.getByTestId('fallback')
      expect(fallback).toHaveAttribute('aria-label', 'Avatar fallback')
    })
  })

  describe('Integration', () => {
    it('should work together as a complete avatar component', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarImage src="/test-image.jpg" alt="User avatar" />
          <AvatarFallback data-testid="fallback">JD</AvatarFallback>
        </Avatar>
      )

      const avatar = screen.getByTestId('avatar')
      const image = screen.getByTestId('avatar-image')
      const fallback = screen.getByTestId('fallback')

      expect(avatar).toBeInTheDocument()
      expect(image).toBeInTheDocument()
      expect(fallback).toBeInTheDocument()
    })

    it('should show fallback when image fails to load', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarImage src="/test-image.jpg" alt="User avatar" />
          <AvatarFallback data-testid="fallback">JD</AvatarFallback>
        </Avatar>
      )

      const image = screen.getByTestId('avatar-image')
      fireEvent.error(image)

      // After error, image should not be rendered but fallback should remain
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
    })
  })
})
