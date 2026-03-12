import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThingHeader from '../ThingHeader'
import { Category, Tag, Area, Room, Spot, FilterParams } from '../../types'

// Mock child components
vi.mock('../ItemFilters', () => ({
  default: () => <div data-testid="item-filters">Item Filters</div>,
}))

vi.mock('../CategoryTreeSelect', () => ({
  default: ({ onSelect, selectedCategory, placeholder }: any) => (
    <div data-testid="category-tree-select">
      <span>
        {selectedCategory?.id === 1
          ? '电子产品'
          : selectedCategory?.id === 2
            ? '手机'
            : (placeholder ?? '全部分类')}
      </span>
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

      expect(screen.getByText('全部分类')).toBeInTheDocument()
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

    it('应该在分类 id 无效时回退显示全部分类', () => {
      const filtersWithInvalidCategory = { ...mockFilters, category_id: 99999 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithInvalidCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('全部分类')).toBeInTheDocument()
    })

    it('应该在选中子分类时显示子分类名称', () => {
      const filtersWithChildCategory = { ...mockFilters, category_id: 2 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithChildCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByText('手机')).toBeInTheDocument()
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

    it('应该支持数组格式的 tags 过滤参数', () => {
      const filtersWithArrayTags = { ...mockFilters, tags: [1, 2] }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithArrayTags}
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
    it('应该直接渲染分类选择器，不再额外包一层菜单', () => {
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

      expect(screen.getByTestId('category-tree-select')).toBeInTheDocument()
      expect(screen.getByText('全部分类')).toBeInTheDocument()
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

      const clearButton = screen.getByRole('button', { name: '清空分类筛选' })
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

    it('应该在再次点击已选标签时取消该标签', async () => {
      const user = userEvent.setup()
      const filtersWithTags = { ...mockFilters, tags: '1' }
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

      await user.click(screen.getByText('1个标签'))
      await waitFor(() => {
        expect(screen.getByText('重要')).toBeInTheDocument()
      })

      await user.click(screen.getByText('重要'))

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithTags,
        tags: undefined,
        page: 1,
      })
    })

    it('应该在没有标签时显示空提示', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={[]}
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

      await user.click(screen.getByText('标签'))

      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })

    it('应该在点击标签菜单外部时关闭标签菜单', async () => {
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

      await user.click(screen.getByText('标签'))
      await waitFor(() => {
        expect(screen.getByText('重要')).toBeInTheDocument()
      })

      fireEvent.mouseDown(document.body)
      await waitFor(() => {
        expect(screen.queryByText('重要')).not.toBeInTheDocument()
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

      const buttons = screen.getAllByRole('tab')
      const galleryTab = buttons[1] // 第二个标签是画廊视图

      await user.click(galleryTab)

      expect(mockOnViewModeChange).toHaveBeenCalledWith('gallery')
    })
  })

  describe('筛选侧边栏', () => {
    it('应该在按下 Escape 时关闭筛选侧边栏', async () => {
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

      const filterButton = document.querySelector(
        'button[data-state="closed"]'
      ) as HTMLButtonElement
      await user.click(filterButton)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
      })

      const sheetContent = document.querySelector('[data-slot="sheet-content"]') as HTMLElement
      fireEvent.keyDown(sheetContent, { key: 'Escape', code: 'Escape' })

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
      })
    })

    it('应该在点击外部时关闭筛选侧边栏', async () => {
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

      const filterButton = document.querySelector(
        'button[data-state="closed"]'
      ) as HTMLButtonElement
      await user.click(filterButton)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
      })

      fireEvent.pointerDown(document.body)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
      })
    })
  })
})
