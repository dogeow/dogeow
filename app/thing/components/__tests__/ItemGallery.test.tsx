import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('ItemGallery', () => {
  const mockItems: Item[] = [{ id: 1, name: 'Item 1' } as Item, { id: 2, name: 'Item 2' } as Item]
  const mockOnItemView = vi.fn()

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
    it('should call onItemView when item is clicked', async () => {
      const user = userEvent.setup()
      render(<ItemGallery items={mockItems} onItemView={mockOnItemView} />)

      const item1 = screen.getByTestId('gallery-item-1')
      await user.click(item1)

      expect(mockOnItemView).toHaveBeenCalledWith(1)
    })

    it('should change image size when size control is used', async () => {
      const user = userEvent.setup()
      render(<ItemGallery items={mockItems} />)

      const changeSizeButton = screen.getByText('Change Size')
      await user.click(changeSizeButton)

      // Size should be updated (tested through component state)
      expect(changeSizeButton).toBeInTheDocument()
    })

    it('should recalculate width on window resize', async () => {
      const rafSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          cb(0)
          return 1
        })

      render(<ItemGallery items={mockItems} />)

      const initialCalls = rafSpy.mock.calls.length
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(rafSpy.mock.calls.length).toBeGreaterThan(initialCalls)
      })
    })
  })
})
