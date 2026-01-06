import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThingHeader from '../ThingHeader'
import { Category, Tag, Area, Room, Spot, FilterParams } from '../../types'

// Mock child components
vi.mock('../ItemFilters', () => ({
  default: () => <div data-testid="item-filters">Item Filters</div>,
}))

vi.mock('../CategoryTreeSelect', () => ({
  default: ({ onSelect }: any) => (
    <div data-testid="category-tree-select">
      <button onClick={() => onSelect('parent', 1, '电子产品', true)}>选择分类</button>
    </div>
  ),
}))

describe('ThingHeader', () => {
  const mockOnApplyFilters = vi.fn()
  const mockOnViewModeChange = vi.fn()

  const mockCategories: Category[] = [
    { id: 1, name: '电子产品', parent_id: null },
    { id: 2, name: '手机', parent_id: 1 },
  ]

  const mockTags: Tag[] = [
    { id: 1, name: '重要', color: '#ef4444' },
    { id: 2, name: '常用', color: '#3b82f6' },
  ]

  const mockAreas: Area[] = [{ id: 1, name: '客厅' }]
  const mockRooms: Room[] = [{ id: 1, name: '主客厅', area_id: 1 }]
  const mockSpots: Spot[] = [{ id: 1, name: '沙发', room_id: 1 }]

  const mockFilters: FilterParams = {
    search: '',
    category_id: undefined,
    tags: undefined,
    page: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染分类下拉菜单', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('所有分类')).toBeInTheDocument()
    })

    it('应该渲染标签下拉菜单', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('标签')).toBeInTheDocument()
    })

    it('应该渲染视图切换按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      // 视图切换应该存在（通过 TabsList 渲染）
      const tabsList = document.querySelector('[role="tablist"]')
      expect(tabsList).toBeInTheDocument()
    })

    it('应该渲染筛选按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      // 筛选图标应该存在
      const filterButton = screen.getByRole('button', { name: '' })
      expect(filterButton).toBeInTheDocument()
    })

    it('应该在选中分类时显示分类名称', () => {
      const filtersWithCategory = { ...mockFilters, category_id: 1 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('电子产品')).toBeInTheDocument()
    })

    it('应该在选中标签时显示标签数量', () => {
      const filtersWithTags = { ...mockFilters, tags: '1,2' }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('2个标签')).toBeInTheDocument()
    })
  })

  describe('分类筛选', () => {
    it('应该支持打开分类下拉菜单', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const categoryButton = screen.getByText('所有分类')
      await user.click(categoryButton)

      await waitFor(() => {
        expect(screen.getByTestId('category-tree-select')).toBeInTheDocument()
      })
    })

    it('应该在选择分类时调用 onApplyFilters', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const categoryButton = screen.getByText('所有分类')
      await user.click(categoryButton)

      await waitFor(() => {
        expect(screen.getByTestId('category-tree-select')).toBeInTheDocument()
      })

      const selectButton = screen.getByText('选择分类')
      await user.click(selectButton)

      await waitFor(() => {
        expect(mockOnApplyFilters).toHaveBeenCalledWith({
          ...mockFilters,
          category_id: 1,
          page: 1,
        })
      })
    })

    it('应该支持清空分类筛选', async () => {
      const user = userEvent.setup()
      const filtersWithCategory = { ...mockFilters, category_id: 1 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const categoryButton = screen.getByText('电子产品')
      await user.click(categoryButton)

      await waitFor(() => {
        expect(screen.getByText('清空分类筛选')).toBeInTheDocument()
      })

      const clearButton = screen.getByText('清空分类筛选')
      await user.click(clearButton)

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithCategory,
        category_id: undefined,
        page: 1,
      })
    })
  })

  describe('标签筛选', () => {
    it('应该支持打开标签下拉菜单', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByText('标签')
      await user.click(tagButton)

      await waitFor(() => {
        expect(screen.getByText('重要')).toBeInTheDocument()
        expect(screen.getByText('常用')).toBeInTheDocument()
      })
    })

    it('应该在选择标签时调用 onApplyFilters', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByText('标签')
      await user.click(tagButton)

      await waitFor(() => {
        expect(screen.getByText('重要')).toBeInTheDocument()
      })

      const importantTag = screen.getByText('重要')
      await user.click(importantTag)

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...mockFilters,
        tags: '1',
        page: 1,
      })
    })

    it('应该支持清除所有标签', async () => {
      const user = userEvent.setup()
      const filtersWithTags = { ...mockFilters, tags: '1,2' }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByText('2个标签')
      await user.click(tagButton)

      await waitFor(() => {
        expect(screen.getByText('清除所有标签')).toBeInTheDocument()
      })

      const clearButton = screen.getByText('清除所有标签')
      await user.click(clearButton)

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithTags,
        tags: undefined,
        page: 1,
      })
    })
  })

  describe('视图切换', () => {
    it('应该在切换视图时调用 onViewModeChange', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      // 找到画廊视图按钮并点击
      const galleryButton = screen.getByRole('tab', { name: '' })
      const buttons = screen.getAllByRole('tab')
      const galleryTab = buttons[1] // 第二个标签是画廊视图

      await user.click(galleryTab)

      expect(mockOnViewModeChange).toHaveBeenCalledWith('gallery')
    })
  })
})
