import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemFilters from '../ItemFilters'
import { Area, Room, Spot, Tag } from '../../types'

// Mock dependencies
vi.mock('../../stores/itemStore', () => ({
  useItemStore: vi.fn(() => ({
    categories: [
      { id: 1, name: '电子产品', parent_id: null },
      { id: 2, name: '手机', parent_id: 1 },
    ],
  })),
}))

vi.mock('../../stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: vi.fn(() => ({
    savedFilters: {},
  })),
}))

vi.mock('../CategoryTreeSelect', () => ({
  default: () => <div data-testid="category-tree-select">Category Tree Select</div>,
}))

vi.mock('@/components/ui/tag-selector', () => ({
  TagSelector: ({ onChange }: any) => (
    <div data-testid="tag-selector">
      <button onClick={() => onChange(['1', '2'])}>Select Tags</button>
    </div>
  ),
  Tag: {} as any,
}))

describe('ItemFilters', () => {
  const mockOnApply = vi.fn()

  const mockAreas: Area[] = [
    { id: 1, name: '客厅' },
    { id: 2, name: '卧室' },
  ]

  const mockRooms: Room[] = [
    { id: 1, name: '主客厅', area_id: 1 },
    { id: 2, name: '主卧', area_id: 2 },
  ]

  const mockSpots: Spot[] = [
    { id: 1, name: '沙发', room_id: 1 },
    { id: 2, name: '书桌', room_id: 2 },
  ]

  const mockTags: Tag[] = [
    { id: 1, name: '重要', color: '#ef4444' },
    { id: 2, name: '常用', color: '#3b82f6' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染基础和详细标签', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('基础')).toBeInTheDocument()
      expect(screen.getByText('详细')).toBeInTheDocument()
    })

    it('应该渲染名称输入框', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('名称')).toBeInTheDocument()
    })

    it('应该渲染描述输入框', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('描述')).toBeInTheDocument()
    })

    it('应该渲染分类选择器', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByTestId('category-tree-select')).toBeInTheDocument()
    })

    it('应该渲染状态选择器', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('状态')).toBeInTheDocument()
    })

    it('应该渲染公开状态选择器', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('公开状态')).toBeInTheDocument()
    })

    it('应该渲染标签选择器', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByTestId('tag-selector')).toBeInTheDocument()
    })

    it('应该渲染重置和应用按钮', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      expect(screen.getByText('重置')).toBeInTheDocument()
      expect(screen.getByText('应用筛选')).toBeInTheDocument()
    })
  })

  describe('详细标签页', () => {
    it('应该在切换到详细标签页时显示购买日期', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const detailTab = screen.getByText('详细')
      await user.click(detailTab)

      await waitFor(() => {
        expect(screen.getByText('购买日期')).toBeInTheDocument()
      })
    })

    it('应该在详细标签页显示价格范围', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const detailTab = screen.getByText('详细')
      await user.click(detailTab)

      await waitFor(() => {
        expect(screen.getByText('价格范围')).toBeInTheDocument()
      })
    })

    it('应该在详细标签页显示位置筛选', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const detailTab = screen.getByText('详细')
      await user.click(detailTab)

      await waitFor(() => {
        expect(screen.getByText('位置')).toBeInTheDocument()
      })
    })
  })

  describe('筛选操作', () => {
    it('应该支持输入名称进行筛选', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const nameInputs = screen.getAllByRole('textbox')
      const nameInput = nameInputs[0] // 第一个文本框是名称输入框
      await user.type(nameInput, '测试物品')

      expect(nameInput).toHaveValue('测试物品')
    })

    it('应该在选择标签时立即应用筛选', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const selectTagsButton = screen.getByText('Select Tags')
      await user.click(selectTagsButton)

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalled()
      })
    })

    it('应该在点击应用按钮时应用筛选', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      // 修改一些筛选条件
      const nameInputs = screen.getAllByRole('textbox')
      await user.type(nameInputs[0], '测试')

      // 点击应用按钮
      const applyButton = screen.getByText('应用筛选')
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalled()
      })
    })

    it('应该在点击重置按钮时清除筛选', async () => {
      const user = userEvent.setup()
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      // 修改一些筛选条件
      const nameInputs = screen.getAllByRole('textbox')
      await user.type(nameInputs[0], '测试')

      // 点击重置按钮
      const resetButton = screen.getByText('重置')
      await user.click(resetButton)

      await waitFor(() => {
        expect(nameInputs[0]).toHaveValue('')
      })
    })

    it('应该在没有活跃筛选条件时禁用应用按钮', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const applyButton = screen.getByText('应用筛选')
      expect(applyButton).toBeDisabled()
    })

    it('应该在没有活跃筛选条件时禁用重置按钮', () => {
      render(
        <ItemFilters
          onApply={mockOnApply}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          tags={mockTags}
          categories={[]}
        />
      )

      const resetButton = screen.getByText('重置')
      expect(resetButton).toBeDisabled()
    })
  })
})
