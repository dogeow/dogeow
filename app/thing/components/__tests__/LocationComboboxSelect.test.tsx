import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import LocationComboboxSelect from '../LocationComboboxSelect'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

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
  Combobox: ({ options, value, placeholder, onChange }: any) => (
    <div data-testid="combobox">
      <div>{placeholder}</div>
      <select value={value ?? ''} onChange={e => onChange?.(e.target.value)}>
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

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock API responses
    vi.mocked(apiRequest).mockImplementation((url: string) => {
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '主卧' })).toBeInTheDocument()
      })

      const roomSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(roomSelect, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByText('具体位置（可选）')).toBeInTheDocument()
      })
    })
  })

  describe('加载状态', () => {
    it('应该在加载时显示加载提示', async () => {
      let resolveAreas!: (value: unknown) => void
      const areasPromise = new Promise(resolve => {
        resolveAreas = resolve
      })
      vi.mocked(apiRequest).mockImplementation((url: string) => {
        if (url === '/areas') {
          return areasPromise
        }
        return Promise.resolve([])
      })

      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeInTheDocument()
      })

      resolveAreas([])
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
      })
    })

    it('应该在加载失败时显示错误提示', async () => {
      vi.mocked(apiRequest).mockRejectedValue(new Error('加载失败'))

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

    it('应该在没有默认区域时不自动触发 onSelect', async () => {
      vi.mocked(apiRequest).mockImplementation((url: string) => {
        if (url === '/areas') {
          return Promise.resolve([
            { id: 1, name: '客厅' },
            { id: 2, name: '卧室' },
          ])
        }
        if (url === '/areas/1/rooms') {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })

      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/areas')
      })
      expect(mockOnSelect).not.toHaveBeenCalled()
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

    it('应该在选择具体位置后以完整路径触发 onSelect', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '主卧' })).toBeInTheDocument()
      })

      const roomSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(roomSelect, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '书桌' })).toBeInTheDocument()
      })

      const spotSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(spotSelect, { target: { value: '1' } })

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('spot', 1, '客厅 > 主卧 > 书桌')
      })
    })

    it('应该能处理空值和不存在的 id 选择而不触发错误路径提交', async () => {
      render(<LocationComboboxSelect onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '主卧' })).toBeInTheDocument()
      })

      const areaSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(areaSelect, { target: { value: '' } })
      fireEvent.change(areaSelect, { target: { value: '999' } })
      fireEvent.change(areaSelect, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '主卧' })).toBeInTheDocument()
      })

      const roomSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(roomSelect, { target: { value: '' } })
      fireEvent.change(roomSelect, { target: { value: '999' } })
      fireEvent.change(roomSelect, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '书桌' })).toBeInTheDocument()
      })

      const spotSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(spotSelect, { target: { value: '' } })
      fireEvent.change(spotSelect, { target: { value: '999' } })

      expect(mockOnSelect).not.toHaveBeenCalledWith('spot', 999, expect.any(String))
    })
  })
})
