import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationTreeSelect from '../LocationTreeSelect'

// Mock dependencies
vi.mock('../../services/api', () => ({
  useLocations: vi.fn(() => ({
    data: {
      areas: [
        { id: 1, name: '客厅' },
        { id: 2, name: '卧室' },
      ],
      rooms: [
        { id: 1, name: '主客厅', area_id: 1 },
        { id: 2, name: '主卧', area_id: 2 },
      ],
      spots: [
        { id: 1, name: '沙发', room_id: 1 },
        { id: 2, name: '书桌', room_id: 2 },
      ],
    },
  })),
}))

vi.mock('../FolderIcon', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="folder-icon">{isOpen ? 'open' : 'closed'}</div>
  ),
}))

describe('LocationTreeSelect', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染搜索框', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      expect(screen.getByPlaceholderText('搜索位置...')).toBeInTheDocument()
    })

    it('应该渲染区域列表', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      expect(screen.getByText('客厅')).toBeInTheDocument()
      expect(screen.getByText('卧室')).toBeInTheDocument()
    })

    it('应该渲染文件夹图标', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      const folderIcons = screen.getAllByTestId('folder-icon')
      expect(folderIcons.length).toBeGreaterThan(0)
    })

    it('应该在展开时显示房间', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      expect(screen.getByText('主客厅')).toBeInTheDocument()
      expect(screen.getByText('主卧')).toBeInTheDocument()
    })

    it('应该在展开时显示位置', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      expect(screen.getByText('沙发')).toBeInTheDocument()
      expect(screen.getByText('书桌')).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该支持搜索区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      const searchInput = screen.getByPlaceholderText('搜索位置...')
      await user.type(searchInput, '客厅')

      expect(screen.getByText('客厅')).toBeInTheDocument()
      expect(screen.queryByText('卧室')).not.toBeInTheDocument()
    })

    it('应该支持搜索房间', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      const searchInput = screen.getByPlaceholderText('搜索位置...')
      await user.type(searchInput, '主客厅')

      expect(screen.getByText('主客厅')).toBeInTheDocument()
    })

    it('应该支持搜索位置', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      const searchInput = screen.getByPlaceholderText('搜索位置...')
      await user.type(searchInput, '沙发')

      expect(screen.getByText('沙发')).toBeInTheDocument()
    })

    it('应该在没有匹配结果时显示提示', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      const searchInput = screen.getByPlaceholderText('搜索位置...')
      await user.type(searchInput, '不存在的位置')

      expect(screen.getByText('没有匹配的位置')).toBeInTheDocument()
    })
  })

  describe('展开/折叠', () => {
    it('应该支持展开区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={false} />)

      // 初始状态应该不显示房间
      expect(screen.queryByText('主客厅')).not.toBeInTheDocument()

      // 点击区域展开
      const livingRoom = screen.getByText('客厅')
      const folderIcon = livingRoom.parentElement?.querySelector('[data-testid="folder-icon"]')
      if (folderIcon) {
        await user.click(folderIcon)
      }

      // 等待房间显示
      await waitFor(() => {
        expect(screen.getByText('主客厅')).toBeInTheDocument()
      })
    })

    it('应该支持折叠区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      // 初始状态应该显示房间
      expect(screen.getByText('主客厅')).toBeInTheDocument()

      // 点击区域折叠
      const livingRoom = screen.getByText('客厅')
      const folderIcon = livingRoom.parentElement?.querySelector('[data-testid="folder-icon"]')
      if (folderIcon) {
        await user.click(folderIcon)
      }

      // 房间应该被隐藏
      await waitFor(() => {
        expect(screen.queryByText('主客厅')).not.toBeInTheDocument()
      })
    })
  })

  describe('选择功能', () => {
    it('应该支持选择区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      const livingRoom = screen.getByText('客厅')
      await user.click(livingRoom)

      expect(mockOnSelect).toHaveBeenCalledWith('area', 1, '客厅')
    })

    it('应该支持选择房间', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      const mainLivingRoom = screen.getByText('主客厅')
      await user.click(mainLivingRoom)

      expect(mockOnSelect).toHaveBeenCalledWith('room', 1, '客厅 / 主客厅')
    })

    it('应该支持选择位置', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      const sofa = screen.getByText('沙发')
      await user.click(sofa)

      expect(mockOnSelect).toHaveBeenCalledWith('spot', 1, '客厅 / 主客厅 / 沙发')
    })

    it('应该高亮选中的项', () => {
      render(
        <LocationTreeSelect onSelect={mockOnSelect} selectedLocation={{ type: 'area', id: 1 }} />
      )

      const livingRoom = screen.getByText('客厅')
      expect(livingRoom.closest('div')).toHaveClass('bg-muted')
    })
  })

  describe('过滤模式', () => {
    it('应该在 room 模式下只显示房间', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} filterType="room" isExpanded={true} />)

      // 应该显示房间
      expect(screen.getByText('主客厅')).toBeInTheDocument()
      expect(screen.getByText('主卧')).toBeInTheDocument()
    })

    it('应该在 area 模式下不显示位置', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} filterType="area" isExpanded={true} />)

      // 应该显示区域和房间
      expect(screen.getByText('客厅')).toBeInTheDocument()
      expect(screen.getByText('主客厅')).toBeInTheDocument()

      // 不应该显示位置
      expect(screen.queryByText('沙发')).not.toBeInTheDocument()
    })
  })

  describe('空状态', () => {
    it('应该在没有数据时显示提示', () => {
      const { useLocations } = require('../../services/api')
      useLocations.mockReturnValue({
        data: {
          areas: [],
          rooms: [],
          spots: [],
        },
      })

      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      expect(screen.getByText('没有可用的位置')).toBeInTheDocument()
    })
  })
})
