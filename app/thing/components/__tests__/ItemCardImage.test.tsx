import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemCardImage from '../ItemCardImage'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={src} alt={alt} onError={onError} data-testid="next-image" {...props} />
  ),
}))

// Mock ImagePlaceholder
vi.mock('@/components/ui/icons/image-placeholder', () => ({
  default: ({ size, className }: { size: number; className?: string }) => (
    <div data-testid="image-placeholder" data-size={size} className={className}>
      Placeholder
    </div>
  ),
}))

describe('ItemCardImage', () => {
  const defaultProps = {
    initialPrimaryImage: null,
    images: [],
    itemName: 'Test Item',
    status: 'active',
    isPublic: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render placeholder when no image is available', () => {
      render(<ItemCardImage {...defaultProps} />)
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    })

    it('should render image when primary image is provided', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
      }
      render(<ItemCardImage {...props} />)
      expect(screen.getByTestId('next-image')).toBeInTheDocument()
      expect(screen.getByTestId('next-image')).toHaveAttribute('alt', 'Test Item 图片')
    })

    it('should render image from images array when primary image is not provided', () => {
      const props = {
        ...defaultProps,
        images: [
          {
            id: 1,
            url: 'https://example.com/image.jpg',
          },
        ],
      }
      render(<ItemCardImage {...props} />)
      expect(screen.getByTestId('next-image')).toBeInTheDocument()
    })

    it('should render public badge when isPublic is true', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
        isPublic: true,
      }
      render(<ItemCardImage {...props} />)
      expect(screen.getByText('公开')).toBeInTheDocument()
    })

    it('should not render public badge when isPublic is false', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
        isPublic: false,
      }
      render(<ItemCardImage {...props} />)
      expect(screen.queryByText('公开')).not.toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should use thumbnail_url when available', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
          thumbnail_url: 'https://example.com/thumb.jpg',
        },
      }
      render(<ItemCardImage {...props} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    })

    it('should apply status border color for expired status', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
        status: 'expired',
      }
      const { container } = render(<ItemCardImage {...props} />)
      expect(container.firstChild).toHaveClass('border-red-500')
    })

    it('should apply status border color for damaged status', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
        status: 'damaged',
      }
      const { container } = render(<ItemCardImage {...props} />)
      expect(container.firstChild).toHaveClass('border-orange-500')
    })

    it('should use custom size when provided', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/image.jpg',
        },
        size: 100,
      }
      const { container } = render(<ItemCardImage {...props} />)
      const element = container.firstChild as HTMLElement
      expect(element).toHaveStyle({ width: '100px', height: '100px' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle image error and show placeholder', () => {
      const props = {
        ...defaultProps,
        initialPrimaryImage: {
          id: 1,
          url: 'https://example.com/invalid.jpg',
        },
      }
      render(<ItemCardImage {...props} />)
      const image = screen.getByTestId('next-image')

      // Simulate error
      const errorEvent = new Event('error')
      image.dispatchEvent(errorEvent)

      // After error, should show placeholder
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    })
  })
})
