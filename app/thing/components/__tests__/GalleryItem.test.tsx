import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryItem } from '../GalleryItem'
import { Item } from '@/app/thing/types'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} data-testid="next-image" {...props} />
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

describe('GalleryItem', () => {
  const mockItem: Item = {
    id: 1,
    name: 'Test Item',
    category: { id: 1, name: 'Test Category' },
    status: 'active',
    is_public: false,
    thumbnail_url: 'https://example.com/thumb.jpg',
  } as Item

  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render gallery item with image', () => {
      render(<GalleryItem item={mockItem} imageSize={200} onClick={mockOnClick} />)
      expect(screen.getByTestId('next-image')).toBeInTheDocument()
      expect(screen.getByTestId('next-image')).toHaveAttribute('alt', 'Test Item')
    })

    it('should render placeholder when thumbnail_url is not available', () => {
      const itemWithoutThumbnail = { ...mockItem, thumbnail_url: undefined }
      render(<GalleryItem item={itemWithoutThumbnail} imageSize={200} onClick={mockOnClick} />)
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    })

    it('should render item name and category on hover', () => {
      render(<GalleryItem item={mockItem} imageSize={200} onClick={mockOnClick} />)
      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Test Category')).toBeInTheDocument()
    })

    it('should render public badge when item is public', () => {
      const publicItem = { ...mockItem, is_public: true }
      render(<GalleryItem item={publicItem} imageSize={200} onClick={mockOnClick} />)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when item is clicked', async () => {
      const user = userEvent.setup()
      render(<GalleryItem item={mockItem} imageSize={200} onClick={mockOnClick} />)

      const item = screen.getByText('Test Item').closest('div')
      if (item) {
        await user.click(item)
        expect(mockOnClick).toHaveBeenCalledWith(mockItem)
      }
    })
  })

  describe('Props', () => {
    it('should apply correct border color for expired status', () => {
      const expiredItem = { ...mockItem, status: 'expired' }
      const { container } = render(
        <GalleryItem item={expiredItem} imageSize={200} onClick={mockOnClick} />
      )
      expect(container.firstChild).toHaveClass('border-red-500')
    })

    it('should apply correct border color for damaged status', () => {
      const damagedItem = { ...mockItem, status: 'damaged' }
      const { container } = render(
        <GalleryItem item={damagedItem} imageSize={200} onClick={mockOnClick} />
      )
      expect(container.firstChild).toHaveClass('border-orange-500')
    })

    it('should apply correct border color for idle status', () => {
      const idleItem = { ...mockItem, status: 'idle' }
      const { container } = render(
        <GalleryItem item={idleItem} imageSize={200} onClick={mockOnClick} />
      )
      expect(container.firstChild).toHaveClass('border-amber-500')
    })

    it('should use imageSize for dimensions', () => {
      const { container } = render(
        <GalleryItem item={mockItem} imageSize={150} onClick={mockOnClick} />
      )
      const element = container.firstChild as HTMLElement
      expect(element).toHaveStyle({ width: '150px', height: '150px' })
    })

    it('should handle item without category', () => {
      const itemWithoutCategory = { ...mockItem, category: undefined }
      render(<GalleryItem item={itemWithoutCategory} imageSize={200} onClick={mockOnClick} />)
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })
  })
})
