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
        <>
          <button onClick={() => onCreateOption('新分类')}>{createText ?? '创建分类'}</button>
          <button onClick={() => onCreateOption('电子产品 / 新子分类')}>按路径创建分类</button>
          <button onClick={() => onCreateOption('新父分类 / 新子分类')}>按新路径创建分类</button>
        </>
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

  it('应该渲染单个分类选择器', () => {
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    expect(screen.getByRole('combobox', { name: '选择或创建分类' })).toBeInTheDocument()
  })

  it('应该在分类列表为空时触发 fetchCategories', () => {
    vi.mocked(useItemStore).mockReturnValue({
      categories: [],
      createCategory: mockCreateCategory,
      fetchCategories: mockFetchCategories,
    } as ReturnType<typeof useItemStore>)

    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    expect(mockFetchCategories).toHaveBeenCalledTimes(1)
  })

  it('应该支持选择未分类', async () => {
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建分类' }), 'none')

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('parent', null, '未分类', true)
    })
  })

  it('应该支持自定义全部分类文案并放在第一项', () => {
    render(<CategoryTreeSelect onSelect={mockOnSelect} noneOptionLabel="全部分类" />)

    const select = screen.getByRole('combobox', { name: '选择或创建分类' })
    expect(select).toHaveValue('none')
    expect(screen.getAllByText('全部分类')[0]).toBeInTheDocument()
  })

  it('应该支持直接选择父分类', async () => {
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建分类' }), 'parent:1')

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('parent', 1, '电子产品', true)
    })
  })

  it('应该支持直接选择子分类路径', async () => {
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建分类' }), 'child:2')

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('child', 2, '电子产品 / 手机', true)
    })
  })

  it('应该支持创建主分类', async () => {
    mockCreateCategory.mockResolvedValue({ id: 5, name: '新分类', parent_id: null })
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.click(screen.getByRole('button', { name: '创建分类' }))

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: '新分类',
        parent_id: null,
      })
      expect(mockOnSelect).toHaveBeenCalledWith('parent', 5, '新分类', true)
      expect(toast.success).toHaveBeenCalledWith('已创建主分类 "新分类"')
    })
  })

  it('应该在选中父分类后把新分类创建为子分类', async () => {
    mockCreateCategory.mockResolvedValue({ id: 6, name: '新分类', parent_id: 1 })
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.selectOptions(screen.getByRole('combobox', { name: '选择或创建分类' }), 'parent:1')
    await user.click(screen.getByRole('button', { name: '创建分类' }))

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenLastCalledWith({
        name: '新分类',
        parent_id: 1,
      })
      expect(mockOnSelect).toHaveBeenLastCalledWith('child', 6, '电子产品 / 新分类', true)
      expect(toast.success).toHaveBeenCalledWith('已创建分类 "电子产品 / 新分类"')
    })
  })

  it('应该支持按完整路径创建子分类', async () => {
    mockCreateCategory.mockResolvedValueOnce({ id: 7, name: '新子分类', parent_id: 1 })
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.click(screen.getByRole('button', { name: '按路径创建分类' }))

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: '新子分类',
        parent_id: 1,
      })
      expect(mockOnSelect).toHaveBeenCalledWith('child', 7, '电子产品 / 新子分类', true)
    })
  })

  it('应该在父分类不存在时先创建父分类再创建子分类', async () => {
    mockCreateCategory
      .mockResolvedValueOnce({ id: 8, name: '新父分类', parent_id: null })
      .mockResolvedValueOnce({ id: 9, name: '新子分类', parent_id: 8 })

    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.click(screen.getByRole('button', { name: '按新路径创建分类' }))

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenNthCalledWith(1, {
        name: '新父分类',
        parent_id: null,
      })
      expect(mockCreateCategory).toHaveBeenNthCalledWith(2, {
        name: '新子分类',
        parent_id: 8,
      })
      expect(mockOnSelect).toHaveBeenCalledWith('child', 9, '新父分类 / 新子分类', true)
    })
  })

  it('应该在创建分类失败时提示错误', async () => {
    mockCreateCategory.mockRejectedValue(new Error('创建失败'))
    const user = userEvent.setup()
    render(<CategoryTreeSelect onSelect={mockOnSelect} />)

    await user.click(screen.getByRole('button', { name: '创建分类' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('创建分类失败：创建失败')
    })
  })

  it('应该根据 selectedCategory 同步父分类状态', () => {
    render(
      <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'parent', id: 1 }} />
    )

    expect(screen.getByRole('combobox', { name: '选择或创建分类' })).toHaveValue('parent:1')
  })

  it('应该根据 selectedCategory 同步子分类状态', () => {
    render(
      <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'child', id: 2 }} />
    )

    expect(screen.getByRole('combobox', { name: '选择或创建分类' })).toHaveValue('child:2')
  })

  it('应该在分类不存在时回退为未分类', () => {
    render(
      <CategoryTreeSelect onSelect={mockOnSelect} selectedCategory={{ type: 'child', id: 99999 }} />
    )

    expect(screen.getByRole('combobox', { name: '选择或创建分类' })).toHaveValue('none')
  })
})
