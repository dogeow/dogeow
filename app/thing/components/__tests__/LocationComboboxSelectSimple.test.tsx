import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LocationComboboxSelectSimple from '../LocationComboboxSelectSimple'

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

// Mock Combobox component
vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({ options, placeholder }: any) => (
    <div data-testid="combobox">
      <div>{placeholder}</div>
      <div>{options.length} options</div>
    </div>
  ),
}))

describe('LocationComboboxSelectSimple', () => {
  const mockOnSelect = vi.fn()
  const { apiRequest } = require('@/lib/api')

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock API responses
    apiRequest.mockImplementation((url: string) => {
      if (url === '/areas') {
        return Promise.resolve([
          { id: 1, name: '客厅' },
          { id: 2, name: '卧室' },
        ])
      }
      if (url.startsWith('/areas/')) {
        return Promise.resolve([
          { id: 1, name: '主卧', area_id: 1 },
          { id: 2, name: '次卧', area_id: 1 },
        ])
      }
      if (url.startsWith('/rooms/')) {
        return Promise.resolve([
          { id: 1, name: '书桌', room_id: 1 },
          { id: 2, name: '衣柜', room_id: 1 },
        ])
      }
      return Promise.resolve([])
    })
  })

  describe('渲染', () => {
    it('应该渲染区域选择器', async () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('区域')).toBeInTheDocument()
      })
    })

    it('应该渲染房间选择器（始终显示）', async () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('房间')).toBeInTheDocument()
      })
    })

    it('应该渲染位置选择器（始终显示）', async () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('具体位置（可选）')).toBeInTheDocument()
      })
    })

    it('应该在未选择区域时显示占位提示', async () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('请先选择区域')).toBeInTheDocument()
      })
    })
  })

  describe('加载', () => {
    it('应该加载区域列表', async () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/areas')
      })
    })

    it('应该在加载时显示加载提示', async () => {
      apiRequest.mockImplementation(() => new Promise(() => {}))

      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeInTheDocument()
      })
    })

    it('应该在加载失败时显示错误', async () => {
      const { toast } = require('sonner')
      apiRequest.mockRejectedValue(new Error('加载失败'))

      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('加载区域失败')
      })
    })
  })

  describe('预留空间布局', () => {
    it('应该始终为房间选择器预留空间', () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      // 房间选择器应该始终存在（即使禁用）
      expect(screen.getByText('房间')).toBeInTheDocument()
      expect(screen.getByText('请先选择区域')).toBeInTheDocument()
    })

    it('应该始终为位置选择器预留空间', () => {
      render(<LocationComboboxSelectSimple onSelect={mockOnSelect} />)

      // 位置选择器应该始终存在（即使禁用）
      expect(screen.getByText('具体位置（可选）')).toBeInTheDocument()
    })
  })
})
