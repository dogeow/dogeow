import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTagDialog from '../CreateTagDialog'
import { Tag } from '../../types'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('@/lib/helpers/colorUtils', () => ({
  generateRandomColor: vi.fn(() => '#3b82f6'),
}))

describe('CreateTagDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnTagCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该在打开时渲染对话框', () => {
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      expect(screen.getByText('创建新标签')).toBeInTheDocument()
    })

    it('应该不在关闭时渲染对话框', () => {
      render(
        <CreateTagDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      expect(screen.queryByText('创建新标签')).not.toBeInTheDocument()
    })

    it('应该渲染名称输入框', () => {
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      expect(screen.getByPlaceholderText('输入标签名称')).toBeInTheDocument()
    })

    it('应该渲染颜色选择按钮', () => {
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      // 应该有多个颜色按钮（预定义颜色 + 自定义颜色 + 随机颜色）
      const colorButtons = screen.getByTitle('生成随机颜色')
      expect(colorButtons).toBeInTheDocument()
    })

    it('应该使用初始名称', () => {
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
          initialName="Test Tag"
        />
      )

      expect(screen.getByDisplayValue('Test Tag')).toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该允许输入标签名称', async () => {
      const user = userEvent.setup()
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      const input = screen.getByPlaceholderText('输入标签名称')
      await user.type(input, 'New Tag')

      expect(input).toHaveValue('New Tag')
    })

    it('应该在点击取消按钮时关闭对话框', async () => {
      const user = userEvent.setup()
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      const cancelButton = screen.getByText('取消')
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('应该在提交成功后创建标签', async () => {
      const { apiRequest } = require('@/lib/api')
      const mockTag: Tag = { id: 1, name: 'New Tag', color: '#3b82f6' }
      apiRequest.mockResolvedValue(mockTag)

      const user = userEvent.setup()
      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      const input = screen.getByPlaceholderText('输入标签名称')
      await user.type(input, 'New Tag')

      const createButton = screen.getByText('创建标签')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnTagCreated).toHaveBeenCalledWith(mockTag)
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('应该在名称为空时显示错误', async () => {
      const { toast } = require('sonner')
      const user = userEvent.setup()

      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      const createButton = screen.getByText('创建标签')
      await user.click(createButton)

      expect(toast.error).toHaveBeenCalledWith('请输入标签名称')
    })

    it('应该在点击刷新按钮时生成新颜色', async () => {
      const { generateRandomColor } = require('@/lib/helpers/colorUtils')
      const user = userEvent.setup()

      render(
        <CreateTagDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTagCreated={mockOnTagCreated}
        />
      )

      const refreshButton = screen.getByTitle('生成随机颜色')
      await user.click(refreshButton)

      expect(generateRandomColor).toHaveBeenCalled()
    })
  })
})
