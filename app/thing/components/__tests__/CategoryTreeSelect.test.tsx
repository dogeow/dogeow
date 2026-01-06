import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTreeSelect from '../CategoryTreeSelect'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../stores/itemStore', () => ({
  useItemStore: vi.fn(() => ({
    categories: [
      { id: 1, name: '电子产品', parent_id: null },
      { id: 2, name: '手机', parent_id: 1 },
      { id: 3, name: '笔记本', parent_id: 1 },
      { id: 4, name: '书籍', parent_id: null },
    ],
    createCategory: vi.fn(),
    fetchCategories: vi.fn(),
  })),
}))

// Mock Combobox component
vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({ options, value, onChange, onCreateOption, placeholder }: any) => (
    <div data-testid="combobox">
      <button onClick={() => onChange('')}>{placeholder}</button>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {onCreateOption && <button onClick={() => onCreateOption('新分类')}>创建</button>}
    </div>
  ),
}))

describe('CategoryTreeSelect', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染主分类选择器', () => {
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      expect(screen.getByText('主分类')).toBeInTheDocument()
    })

    it('应该在未分类选项中包含"未分类"', () => {
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      expect(screen.getByText('未分类')).toBeInTheDocument()
    })

    it('应该在选择主分类后显示子分类选择器', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, '1')

      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })
    })

    it('应该不在选择"未分类"时显示子分类选择器', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, 'none')

      expect(screen.queryByText('子分类（可选）')).not.toBeInTheDocument()
    })
  })

  describe('分类选择', () => {
    it('应该在选择未分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, 'none')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('parent', null, '未分类', true)
      })
    })

    it('应该在选择主分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, '1')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('parent', 1, '电子产品', false)
      })
    })

    it('应该在选择子分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      // 先选择主分类
      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, '1')

      // 等待子分类选择器出现
      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })

      // 选择子分类
      const childSelect = screen.getAllByRole('combobox')[1]
      await user.selectOptions(childSelect, '2')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('child', 2, '电子产品 / 手机', true)
      })
    })
  })

  describe('创建分类', () => {
    it('应该支持创建主分类', async () => {
      const { useItemStore } = require('../../stores/itemStore')
      const mockCreateCategory = vi.fn().mockResolvedValue({ id: 5, name: '新主分类' })
      useItemStore.mockReturnValue({
        categories: [
          { id: 1, name: '电子产品', parent_id: null },
          { id: 4, name: '书籍', parent_id: null },
        ],
        createCategory: mockCreateCategory,
        fetchCategories: vi.fn(),
      })

      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      const createButton = screen.getAllByText('创建')[0]
      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: '新分类',
          parent_id: null,
        })
      })
    })

    it('应该支持创建子分类', async () => {
      const { useItemStore } = require('../../stores/itemStore')
      const mockCreateCategory = vi.fn().mockResolvedValue({ id: 6, name: '新子分类' })
      useItemStore.mockReturnValue({
        categories: [
          { id: 1, name: '电子产品', parent_id: null },
          { id: 2, name: '手机', parent_id: 1 },
        ],
        createCategory: mockCreateCategory,
        fetchCategories: vi.fn(),
      })

      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      // 先选择主分类
      const select = screen.getAllByRole('combobox')[0]
      await user.selectOptions(select, '1')

      // 等待子分类选择器出现
      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })

      // 创建子分类
      const createButton = screen.getAllByText('创建')[1]
      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: '新分类',
          parent_id: 1,
        })
      })
    })

    it('应该在未选择主分类时不允许创建子分类', async () => {
      const { toast } = require('sonner')
      const { useItemStore } = require('../../stores/itemStore')
      const mockCreateCategory = vi.fn()
      useItemStore.mockReturnValue({
        categories: [{ id: 1, name: '电子产品', parent_id: null }],
        createCategory: mockCreateCategory,
        fetchCategories: vi.fn(),
      })

      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      // 子分类选择器不应该显示（因为没有选择主分类）
      expect(screen.queryByText('子分类（可选）')).not.toBeInTheDocument()
    })
  })

  describe('初始化', () => {
    it('应该根据 selectedCategory prop 设置选中状态', () => {
      render(
        <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'parent', id: 1 }} />
      )

      const select = screen.getAllByRole('combobox')[0]
      expect(select).toHaveValue('1')
    })
  })
})
