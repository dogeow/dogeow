import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemDetailDialog } from '../ItemDetailDialog'
import { Item } from '../../types'

// Mock Next.js Image component

/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="item-image" />,
}))

// Mock date utils
vi.mock('@/lib/helpers/dateUtils', () => ({
  formatDate: (date: string) => (date ? '2024-01-01' : 'N/A'),
}))

// Mock location utils
vi.mock('@/app/thing/utils', () => ({
  getLocationPath: (spot: any) => spot?.name || 'No location',
}))

describe('ItemDetailDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnViewDetails = vi.fn()

  const mockItem: Item = {
    id: 1,
    name: 'Test Item',
    description: 'Test description',
    status: 'active',
    is_public: true,
    quantity: 5,
    notes: 'Test notes',
    category_id: 1,
    area_id: null,
    room_id: null,
    spot_id: 1,
    purchase_price: null,
    purchase_date: '2024-01-01',
    expiry_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: { id: 1, name: 'Test Category' },
    tags: [
      { id: 1, name: 'Tag 1', color: '#3b82f6' },
      { id: 2, name: 'Tag 2', color: '#ef4444' },
    ],
    spot: { id: 1, name: 'Test Location', room_id: 1 },
    primary_image: {
      id: 1,
      path: '/path/to/image.jpg',
      thumbnail_path: '/path/to/thumb.jpg',
      url: 'https://example.com/image.jpg',
      thumbnail_url: 'https://example.com/thumb.jpg',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该在打开时渲染对话框', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })

    it('应该不在关闭时渲染对话框', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={false}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.queryByText('Test Item')).not.toBeInTheDocument()
    })

    it('应该在 item 为 null 时不渲染', () => {
      render(
        <ItemDetailDialog
          item={null}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.queryByText('Test Item')).not.toBeInTheDocument()
    })

    it('应该渲染物品详情', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Test Category')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Public')).toBeInTheDocument()
    })

    it('应该渲染标签', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.getByText('Tag 2')).toBeInTheDocument()
    })

    it('应该渲染位置信息', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Test Location')).toBeInTheDocument()
    })

    it('应该渲染数量', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('应该渲染备注', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Test notes')).toBeInTheDocument()
    })

    it('应该渲染图片', () => {
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByTestId('item-image')).toBeInTheDocument()
    })

    it('应该在没有图片时显示占位符', () => {
      const itemWithoutImage = { ...mockItem, primary_image: undefined, images: [] }
      render(
        <ItemDetailDialog
          item={itemWithoutImage}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('No Image')).toBeInTheDocument()
    })

    it('应该在私有物品时显示私有图标', () => {
      const privateItem = { ...mockItem, is_public: false }
      render(
        <ItemDetailDialog
          item={privateItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText('Private')).toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该在点击关闭按钮时关闭对话框', async () => {
      const user = userEvent.setup()
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      const closeButton = screen.getByText('Close')
      await user.click(closeButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('应该在点击查看详情按钮时调用 onViewDetails', async () => {
      const user = userEvent.setup()
      render(
        <ItemDetailDialog
          item={mockItem}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      const viewDetailsButton = screen.getByText('View Full Details')
      await user.click(viewDetailsButton)

      expect(mockOnViewDetails).toHaveBeenCalledWith(1)
    })
  })

  describe('状态徽章', () => {
    it.each([
      ['active', 'Active'],
      ['idle', 'Idle'],
      ['expired', 'Expired'],
      ['damaged', 'Damaged'],
      ['inactive', 'Inactive'],
    ])('应该为状态 %s 显示正确的徽章', (status, expectedText) => {
      const itemWithStatus = { ...mockItem, status }
      render(
        <ItemDetailDialog
          item={itemWithStatus}
          open={true}
          onOpenChange={mockOnOpenChange}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })
  })
})
