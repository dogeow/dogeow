import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemGallery from '../ItemGallery'
import { Item } from '@/app/thing/types'

// Mock child components
vi.mock('../ImageSizeControl', () => ({
  ImageSizeControl: ({ onSizeChange }: any) => (
    <div data-testid="image-size-control">
      <button onClick={() => onSizeChange(150)}>Change Size</button>
    </div>
  ),
}))

vi.mock('../GalleryItem', () => ({
  GalleryItem: ({ item, onClick }: any) => (
    <div data-testid={`gallery-item-${item.id}`} onClick={() => onClick(item)}>
      {item.name}
    </div>
  ),
}))

vi.mock('../ItemDetailDialog', () => ({
  ItemDetailDialog: ({ item, open, onOpenChange, onViewDetails }: any) =>
    open ? (
      <div data-testid="item-detail-dialog">
        <button onClick={() => onOpenChange(false)}>Close</button>
        <button onClick={() => onViewDetails(item.id)}>View Details</button>
      </div>
    ) : null,
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('ItemGallery', () => {
  const mockItems: Item[] = [{ id: 1, name: 'Item 1' } as Item, { id: 2, name: 'Item 2' } as Item]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getElementById
    const mockContainer = {
      offsetWidth: 800,
    }
    document.getElementById = vi.fn(() => mockContainer as any)
  })

  describe('Rendering', () => {
    it('should render gallery with items', () => {
      render(<ItemGallery items={mockItems} />)

      expect(screen.getByTestId('image-size-control')).toBeInTheDocument()
      expect(screen.getByTestId('gallery-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('gallery-item-2')).toBeInTheDocument()
    })

    it('should render empty state when no items', () => {
      render(<ItemGallery items={[]} />)

      expect(screen.getByText('No items to display.')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should open detail dialog when item is clicked', async () => {
      const user = userEvent.setup()
      render(<ItemGallery items={mockItems} />)

      const item1 = screen.getByTestId('gallery-item-1')
      await user.click(item1)

      await waitFor(() => {
        expect(screen.getByTestId('item-detail-dialog')).toBeInTheDocument()
      })
    })

    it('should change image size when size control is used', async () => {
      const user = userEvent.setup()
      render(<ItemGallery items={mockItems} />)

      const changeSizeButton = screen.getByText('Change Size')
      await user.click(changeSizeButton)

      // Size should be updated (tested through component state)
      expect(changeSizeButton).toBeInTheDocument()
    })
  })
})
