import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationTreeSelect from '../LocationTreeSelect'
import { useLocations } from '../../services/api'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'common.search': '搜索',
          'location.search_placeholder': '搜索位置...',
          'location.no_results': '没有匹配的位置',
          'location.no_available': '没有可用的位置',
          'location.unknown_area': '未知区域',
          'location.unknown_room': '未知房间',
          'location.unknown_spot': '未知位置',
          'location.expand_all': '展开全部',
          'location.collapse_all': '折叠全部',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}))

vi.mock('../../services/api', () => ({
  useLocations: vi.fn(),
}))

vi.mock('../FolderIcon', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="folder-icon">{isOpen ? 'open' : 'closed'}</div>
  ),
}))

const mockLocationData = {
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
}

describe('LocationTreeSelect', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useLocations).mockReturnValue({ data: mockLocationData } as never)
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
      expect(screen.getAllByTestId('folder-icon').length).toBeGreaterThan(0)
    })

    it('应该在展开时显示房间和位置', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)
      expect(screen.getByText('主客厅')).toBeInTheDocument()
      expect(screen.getByText('主卧')).toBeInTheDocument()
      expect(screen.getByText('沙发')).toBeInTheDocument()
      expect(screen.getByText('书桌')).toBeInTheDocument()
    })

    it('应该在提供 onToggleExpand 时渲染展开/折叠按钮并触发回调', async () => {
      const user = userEvent.setup()
      const onToggleExpand = vi.fn()
      render(
        <LocationTreeSelect
          onSelect={mockOnSelect}
          isExpanded={true}
          onToggleExpand={onToggleExpand}
        />
      )

      const toggleButton = screen.getByRole('button', { name: '折叠全部' })
      await user.click(toggleButton)

      expect(onToggleExpand).toHaveBeenCalledTimes(1)
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

      expect(screen.queryByText('主客厅')).not.toBeInTheDocument()

      const areaToggle = screen.getAllByTestId('folder-icon')[0]
      await user.click(areaToggle)

      await waitFor(() => {
        expect(screen.getByText('主客厅')).toBeInTheDocument()
      })
    })

    it('应该支持折叠区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={false} />)

      const areaToggle = screen.getAllByTestId('folder-icon')[0]

      await user.click(areaToggle)
      await waitFor(() => {
        expect(screen.getByText('主客厅')).toBeInTheDocument()
      })

      await user.click(areaToggle)
      await waitFor(() => {
        expect(screen.queryByText('主客厅')).not.toBeInTheDocument()
      })
    })
  })

  describe('选择功能', () => {
    it('应该支持选择区域', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} />)

      await user.click(screen.getByText('客厅'))
      expect(mockOnSelect).toHaveBeenCalledWith('area', 1, '客厅')
    })

    it('应该支持选择房间', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      await user.click(screen.getByText('主客厅'))
      expect(mockOnSelect).toHaveBeenCalledWith('room', 1, '客厅 / 主客厅')
    })

    it('应该支持选择位置', async () => {
      const user = userEvent.setup()
      render(<LocationTreeSelect onSelect={mockOnSelect} isExpanded={true} />)

      await user.click(screen.getByText('沙发'))
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
      expect(screen.getByText('主客厅')).toBeInTheDocument()
      expect(screen.getByText('主卧')).toBeInTheDocument()
    })

    it('应该在 area 模式下不显示位置', () => {
      render(<LocationTreeSelect onSelect={mockOnSelect} filterType="area" isExpanded={true} />)

      expect(screen.getByText('客厅')).toBeInTheDocument()
      expect(screen.getByText('主客厅')).toBeInTheDocument()
      expect(screen.queryByText('沙发')).not.toBeInTheDocument()
    })

    it('应该在 room 模式下显示未知区域名称', () => {
      vi.mocked(useLocations).mockReturnValue({
        data: {
          areas: [{ id: 1, name: '客厅' }],
          rooms: [{ id: 9, name: '杂物间', area_id: 999 }],
          spots: [],
        },
      } as never)

      render(<LocationTreeSelect onSelect={mockOnSelect} filterType="room" isExpanded={true} />)

      expect(screen.getByText('杂物间')).toBeInTheDocument()
      expect(screen.getByText('未知区域')).toBeInTheDocument()
    })
  })

  describe('空状态', () => {
    it('应该在没有数据时显示提示', () => {
      vi.mocked(useLocations).mockReturnValue({
        data: { areas: [], rooms: [], spots: [] },
      } as never)

      render(<LocationTreeSelect onSelect={mockOnSelect} />)
      expect(screen.getByText('没有可用的位置')).toBeInTheDocument()
    })

    it('应该在接口数据为 undefined 时显示空提示', () => {
      vi.mocked(useLocations).mockReturnValue({ data: undefined } as never)

      render(<LocationTreeSelect onSelect={mockOnSelect} />)
      expect(screen.getByText('没有可用的位置')).toBeInTheDocument()
    })
  })
})
