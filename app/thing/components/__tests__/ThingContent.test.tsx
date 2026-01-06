import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThingContent from '../ThingContent'
import { Item } from '../../types'

// Mock child components
vi.mock('../ItemCard', () => ({
  default: ({ item, isLoading }: any) => (
    <div data-testid={isLoading ? 'loading-card' : 'item-card'}>{!isLoading && item.name}</div>
  ),
}))

vi.mock('../ItemGallery', () => ({
  default: ({ items }: { items: Item[] }) => (
    <div data-testid="item-gallery">Gallery: {items.length} items</div>
  ),
}))

describe('ThingContent', () => {
  const mockOnPageChange = vi.fn()
  const mockOnItemEdit = vi.fn()
  const mockOnItemView = vi.fn()
  const mockOnReload = vi.fn()
  const mockOnClearFilters = vi.fn()

  const mockItems: Item[] = [
    { id: 1, name: 'Item 1' } as Item,
    { id: 2, name: 'Item 2' } as Item,
    { id: 3, name: 'Item 3' } as Item,
  ]

  const mockMeta = {
    current_page: 1,
    last_page: 3,
    per_page: 10,
    total: 30,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('加载状态', () => {
    it('应该显示加载骨架屏', () => {
      render(
        <ThingContent
          items={[]}
          loading={true}
          error={null}
          meta={null}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      const loadingCards = screen.getAllByTestId('loading-card')
      expect(loadingCards.length).toBeGreaterThan(0)
    })
  })

  describe('错误状态', () => {
    it('应该显示错误信息', () => {
      render(
        <ThingContent
          items={[]}
          loading={false}
          error="加载失败"
          meta={null}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText('重新加载')).toBeInTheDocument()
    })

    it('应该在点击重新加载按钮时调用 onReload', async () => {
      const user = userEvent.setup()
      render(
        <ThingContent
          items={[]}
          loading={false}
          error="加载失败"
          meta={null}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      const reloadButton = screen.getByText('重新加载')
      await user.click(reloadButton)

      expect(mockOnReload).toHaveBeenCalledTimes(1)
    })
  })

  describe('空状态', () => {
    it('应该在没有物品时显示空状态', () => {
      render(
        <ThingContent
          items={[]}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      expect(screen.getByText('暂无物品')).toBeInTheDocument()
    })

    it('应该在搜索无结果时显示清除筛选按钮', () => {
      render(
        <ThingContent
          items={[]}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm="test search"
          hasActiveFilters={true}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      expect(screen.getByText('清除筛选条件')).toBeInTheDocument()
    })

    it('应该在点击清除筛选按钮时调用 onClearFilters', async () => {
      const user = userEvent.setup()
      render(
        <ThingContent
          items={[]}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm="test"
          hasActiveFilters={true}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      const clearButton = screen.getByText('清除筛选条件')
      await user.click(clearButton)

      expect(mockOnClearFilters).toHaveBeenCalledTimes(1)
    })
  })

  describe('列表视图', () => {
    it('应该在列表模式下渲染物品', () => {
      render(
        <ThingContent
          items={mockItems}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })
  })

  describe('画廊视图', () => {
    it('应该在画廊模式下渲染物品', () => {
      render(
        <ThingContent
          items={mockItems}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="gallery"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      expect(screen.getByTestId('item-gallery')).toBeInTheDocument()
      expect(screen.getByText('Gallery: 3 items')).toBeInTheDocument()
    })
  })

  describe('分页', () => {
    it('应该在有多页时显示分页', () => {
      render(
        <ThingContent
          items={mockItems}
          loading={false}
          error={null}
          meta={mockMeta}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      // 应该显示页码按钮
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('应该在只有一页时不显示分页', () => {
      const singlePageMeta = { ...mockMeta, last_page: 1 }
      render(
        <ThingContent
          items={mockItems}
          loading={false}
          error={null}
          meta={singlePageMeta}
          currentPage={1}
          searchTerm=""
          hasActiveFilters={false}
          viewMode="list"
          onPageChange={mockOnPageChange}
          onItemEdit={mockOnItemEdit}
          onItemView={mockOnItemView}
          onReload={mockOnReload}
          onClearFilters={mockOnClearFilters}
        />
      )

      // 不应该显示分页组件（没有 Pagination 相关按钮）
      expect(screen.queryByText('2')).not.toBeInTheDocument()
    })
  })
})
