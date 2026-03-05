import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTreeSelect from '../CategoryTreeSelect'
import { useItemStore } from '../../stores/itemStore'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../stores/itemStore', () => ({
  useItemStore: vi.fn(),
}))

vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({ options, value, onChange, onCreateOption, placeholder, createText }: any) => (
    <div data-testid={`combobox-${placeholder}`}>
      <select
        aria-label={placeholder}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {onCreateOption && (
        <button onClick={() => onCreateOption('新分类')}>{createText ?? '创建分类'}</button>
      )}
    </div>
  ),
}))

describe('CategoryTreeSelect', () => {
  const mockOnSelect = vi.fn()
  const mockCreateCategory = vi.fn()
  const mockFetchCategories = vi.fn()

  const baseCategories = [
    { id: 1, name: '电子产品', parent_id: null },
    { id: 2, name: '手机', parent_id: 1 },
    { id: 3, name: '笔记本', parent_id: 1 },
    { id: 4, name: '书籍', parent_id: null },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateCategory.mockReset()
    mockFetchCategories.mockReset()
    vi.mocked(useItemStore).mockReturnValue({
      categories: baseCategories,
      createCategory: mockCreateCategory,
      fetchCategories: mockFetchCategories,
    } as ReturnType<typeof useItemStore>)
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

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), '1')

      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })
    })
  })

  describe('分类选择', () => {
    it('应该在选择未分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), 'none')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('parent', null, '未分类', true)
      })
    })

    it('应该在选择主分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), '1')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('parent', 1, '电子产品', false)
      })
    })

    it('应该在选择子分类时调用 onSelect', async () => {
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), '1')

      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建子分类' }), '2')

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('child', 2, '电子产品 / 手机', true)
      })
    })
  })

  describe('创建分类', () => {
    it('应该支持创建主分类', async () => {
      mockCreateCategory.mockResolvedValue({ id: 5, name: '新主分类' })
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.click(screen.getByRole('button', { name: '创建主分类' }))

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: '新分类',
          parent_id: null,
        })
      })
    })

    it('应该支持创建子分类', async () => {
      mockCreateCategory.mockResolvedValue({ id: 6, name: '新子分类' })
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), '1')

      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '创建子分类' }))

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: '新分类',
          parent_id: 1,
        })
      })
    })

    it('应该在创建子分类失败时提示错误', async () => {
      mockCreateCategory.mockRejectedValue(new Error('创建失败'))
      const user = userEvent.setup()
      render(<CategoryTreeSelect onSelect={mockOnSelect} />)

      await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建主分类' }), '1')
      await waitFor(() => {
        expect(screen.getByText('子分类（可选）')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '创建子分类' }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('创建子分类失败：创建失败')
      })
    })
  })

  describe('初始化', () => {
    it('应该根据 selectedCategory prop 设置选中状态', () => {
      render(
        <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'parent', id: 1 }} />
      )

      expect(screen.getByRole('combobox', { name: '选择或创建主分类' })).toHaveValue('1')
    })

    it('应该根据 child 类型 selectedCategory 同步父子分类', async () => {
      render(
        <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'child', id: 2 }} />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: '选择或创建主分类' })).toHaveValue('1')
      })
      expect(screen.getByRole('combobox', { name: '选择或创建子分类' })).toHaveValue('2')
    })
  })
})
