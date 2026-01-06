import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemFormLayout from '../ItemFormLayout'

// Mock AutoSaveStatus component
vi.mock('../AutoSaveStatus', () => ({
  default: ({ autoSaving, lastSaved }: any) => (
    <div data-testid="auto-save-status">
      {autoSaving ? 'Saving...' : lastSaved ? 'Saved' : 'Not saved'}
    </div>
  ),
}))

describe('ItemFormLayout', () => {
  const mockOnBack = vi.fn()
  const mockChildren = {
    basicInfo: <div data-testid="basic-info">Basic Info Content</div>,
    detailInfo: <div data-testid="detail-info">Detail Info Content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染基本信息和详细信息标签', () => {
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack}>
          {mockChildren}
        </ItemFormLayout>
      )

      expect(screen.getByText('基本信息')).toBeInTheDocument()
      expect(screen.getByText('详细信息')).toBeInTheDocument()
    })

    it('应该默认显示基本信息内容', () => {
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack}>
          {mockChildren}
        </ItemFormLayout>
      )

      expect(screen.getByTestId('basic-info')).toBeInTheDocument()
    })

    it('应该渲染自动保存状态组件', () => {
      render(
        <ItemFormLayout
          title="Test Form"
          onBack={mockOnBack}
          autoSaving={false}
          lastSaved={new Date()}
        >
          {mockChildren}
        </ItemFormLayout>
      )

      expect(screen.getByTestId('auto-save-status')).toBeInTheDocument()
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })

    it('应该渲染操作按钮', () => {
      const actionButton = <button>Save</button>
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack} actionButton={actionButton}>
          {mockChildren}
        </ItemFormLayout>
      )

      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('应该渲染页脚内容', () => {
      const footer = <div data-testid="footer">Footer Content</div>
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack} footer={footer}>
          {mockChildren}
        </ItemFormLayout>
      )

      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该在点击详细信息标签时切换到详细信息', async () => {
      const user = userEvent.setup()
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack}>
          {mockChildren}
        </ItemFormLayout>
      )

      const detailTab = screen.getByText('详细信息')
      await user.click(detailTab)

      expect(screen.getByTestId('detail-info')).toBeInTheDocument()
    })

    it('应该在点击基本信息标签时切换回基本信息', async () => {
      const user = userEvent.setup()
      render(
        <ItemFormLayout title="Test Form" onBack={mockOnBack}>
          {mockChildren}
        </ItemFormLayout>
      )

      // 切换到详细信息
      const detailTab = screen.getByText('详细信息')
      await user.click(detailTab)

      // 切换回基本信息
      const basicTab = screen.getByText('基本信息')
      await user.click(basicTab)

      expect(screen.getByTestId('basic-info')).toBeInTheDocument()
    })
  })
})
