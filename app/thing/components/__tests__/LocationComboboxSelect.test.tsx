import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LocationComboboxSelect from '../LocationComboboxSelect'

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
  Combobox: ({ options, value, placeholder }: any) => (
    <div data-testid="combobox">
      <div>{placeholder}</div>
      <select value={value}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}))

describe('LocationComboboxSelect', () => {
  const mockOnSelect = vi.fn()
  const { apiRequest } = require('@/lib/api')

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock API responses
    apiRequest.mockImplementation((url: string) => {
      if (url === '/areas') {
        return Promise.resolve([
          { id: 1, name: '客厅', is_default: true },
          { id: 2, name: '卧室' },
        ])
      }
      if (url === '/areas/1/rooms') {
        return Promise.resolve([
          { id: 1, name: '主卧', area_id: 1 },
          { id: 2, name: '次卧', area_id: 1 },
        ])
      }
      if (url === '/rooms/1/spots') {
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
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('区域')).toBeInTheDocument()
      })
    })

    it('应该加载并显示区域选项', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/areas')
      })
    })

    it('应该在选择区域后显示房间选择器', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      // 等待区域加载完成
      await waitFor(() => {
        expect(screen.getByText('房间')).toBeInTheDocument()
      })
    })

    it('应该在选择房间后显示位置选择器', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      // 等待初始加载
      await waitFor(() => {
        expect(screen.getByText('具体位置（可选）')).toBeInTheDocument()
      })
    })
  })

  describe('加载状态', () => {
    it('应该在加载时显示加载提示', async () => {
      apiRequest.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeInTheDocument()
      })
    })

    it('应该在加载失败时显示错误提示', async () => {
      const { toast } = require('sonner')
      apiRequest.mockRejectedValue(new Error('加载失败'))

      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('加载区域失败')
      })
    })
  })

  describe('默认区域', () => {
    it('应该自动选择默认区域', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/areas')
      })

      // 应该自动选择默认区域并调用 onSelect
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('area', 1, '客厅')
      })
    })
  })

  describe('级联选择', () => {
    it('应该在选择区域后加载房间', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      // 等待区域加载并自动选择默认区域
      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/areas/1/rooms')
      })
    })
  })
})
