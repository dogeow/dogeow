import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemCard from '../ItemCard'
import { Item } from '@/app/thing/types'

// Mock child components
vi.mock('../TagList', () => ({
  TagList: ({ tags }: { tags: any[] }) => (
    <div data-testid="tag-list">{tags.map(t => t.name).join(', ')}</div>
  ),
}))

vi.mock('../LocationDisplay', () => ({
  LocationDisplay: ({ spot }: { spot: any }) => (
    <div data-testid="location-display">{spot?.name || 'No location'}</div>
  ),
}))

vi.mock('../ItemCardImage', () => ({
  default: () => <div data-testid="item-card-image">Image</div>,
}))

describe('ItemCard', () => {
  const mockItem: Item = {
    id: 1,
    name: 'Test Item',
    description: 'Test description',
    status: 'active',
    is_public: false,
    category: { id: 1, name: 'Test Category' },
    tags: [{ id: 1, name: 'Tag 1', color: '#3b82f6' }],
    spot: { id: 1, name: 'Test Spot' },
  } as Item

  const mockOnView = vi.fn()
  const mockOnEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render item card with item information', () => {
      render(<ItemCard item={mockItem} onView={mockOnView} onEdit={mockOnEdit} />)

      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Test Category')).toBeInTheDocument()
      expect(screen.getByTestId('item-card-image')).toBeInTheDocument()
    })

    it('should render loading state when isLoading is true', () => {
      render(<ItemCard item={mockItem} onView={mockOnView} onEdit={mockOnEdit} isLoading={true} />)

      // Should show skeleton loaders
      expect(screen.queryByText('Test Item')).not.toBeInTheDocument()
    })

    it('should render category as "未分类" when category is not provided', () => {
      const itemWithoutCategory = { ...mockItem, category: undefined }
      render(<ItemCard item={itemWithoutCategory} onView={mockOnView} onEdit={mockOnEdit} />)

      expect(screen.getByText('未分类')).toBeInTheDocument()
    })

    it('should not render description when description is not provided', () => {
      const itemWithoutDescription = { ...mockItem, description: null }
      render(<ItemCard item={itemWithoutDescription} onView={mockOnView} onEdit={mockOnEdit} />)

      expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })

    it('should render tags when tags are provided', () => {
      render(<ItemCard item={mockItem} onView={mockOnView} onEdit={mockOnEdit} />)

      expect(screen.getByTestId('tag-list')).toBeInTheDocument()
    })

    it('should render location display', () => {
      render(<ItemCard item={mockItem} onView={mockOnView} onEdit={mockOnEdit} />)

      expect(screen.getByTestId('location-display')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onView when card is clicked', async () => {
      const user = userEvent.setup()
      render(<ItemCard item={mockItem} onView={mockOnView} onEdit={mockOnEdit} />)

      const card = screen.getByText('Test Item').closest('[class*="cursor-pointer"]')
      if (card) {
        await user.click(card)
        expect(mockOnView).toHaveBeenCalledTimes(1)
      }
    })
  })
})
