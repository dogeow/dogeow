import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatableCategorySelect from '../CreatableCategorySelect'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('CreatableCategorySelect', () => {
  const mockOnValueChange = vi.fn()
  const mockOnCreateCategory = vi.fn()

  const mockCategories = [
    { id: 1, name: '电子产品' },
    { id: 2, name: '书籍' },
    { id: 3, name: '家具' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染选择按钮', () => {
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
        />
      )

      expect(screen.getByText('选择分类')).toBeInTheDocument()
    })

    it('应该显示选中的分类名称', () => {
      render(
        <CreatableCategorySelect
          value="1"
          onValueChange={mockOnValueChange}
          categories={mockCategories}
        />
      )

      expect(screen.getByText('电子产品')).toBeInTheDocument()
    })

    it('应该在允许未分类选项时显示"未分类"', () => {
      render(
        <CreatableCategorySelect
          value="none"
          onValueChange={mockOnValueChange}
          categories={mockCategories}
          allowNoneOption={true}
        />
      )

      expect(screen.getByText('未分类')).toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该在点击按钮时打开下拉菜单', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('电子产品')).toBeInTheDocument()
        expect(screen.getByText('书籍')).toBeInTheDocument()
        expect(screen.getByText('家具')).toBeInTheDocument()
      })
    })

    it('应该在选择分类时调用 onValueChange', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('电子产品')).toBeInTheDocument()
      })

      const categoryOption = screen.getByText('电子产品')
      await user.click(categoryOption)

      expect(mockOnValueChange).toHaveBeenCalledWith('1')
    })

    it('应该支持搜索分类', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      // 等待下拉菜单打开和输入框出现
      await waitFor(() => {
        const input = screen.getByPlaceholderText('输入或选择分类')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('输入或选择分类')
      await user.type(input, '电子')

      // 验证搜索结果
      await waitFor(() => {
        expect(screen.getByText('电子产品')).toBeInTheDocument()
      })
    })

    it('应该在输入新分类名称时显示创建选项', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
          onCreateCategory={mockOnCreateCategory}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('输入或选择分类')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('输入或选择分类')
      await user.type(input, '新分类')

      await waitFor(() => {
        expect(screen.getByText(/添加"新分类"/)).toBeInTheDocument()
      })
    })

    it('应该在选择创建选项时创建新分类', async () => {
      mockOnCreateCategory.mockResolvedValue({ id: 4, name: '新分类' })

      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
          onCreateCategory={mockOnCreateCategory}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('输入或选择分类')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('输入或选择分类')
      await user.type(input, '新分类')

      await waitFor(() => {
        expect(screen.getByText(/添加"新分类"/)).toBeInTheDocument()
      })

      const createOption = screen.getByText(/添加"新分类"/)
      await user.click(createOption)

      await waitFor(() => {
        expect(mockOnCreateCategory).toHaveBeenCalledWith('新分类')
        expect(mockOnValueChange).toHaveBeenCalledWith('4')
      })
    })
  })

  describe('未分类选项', () => {
    it('应该在允许未分类时显示未分类选项', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
          allowNoneOption={true}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('未分类')).toBeInTheDocument()
      })
    })

    it('应该支持选择未分类', async () => {
      const user = userEvent.setup()
      render(
        <CreatableCategorySelect
          value=""
          onValueChange={mockOnValueChange}
          categories={mockCategories}
          allowNoneOption={true}
        />
      )

      const button = screen.getByText('选择分类')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('未分类')).toBeInTheDocument()
      })

      const noneOption = screen.getByText('未分类')
      await user.click(noneOption)

      expect(mockOnValueChange).toHaveBeenCalledWith('none')
    })
  })
})
