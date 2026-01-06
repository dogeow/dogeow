import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AutoSaveStatus from '../AutoSaveStatus'

describe('AutoSaveStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render nothing when not saving and no lastSaved', () => {
      const { container } = render(<AutoSaveStatus autoSaving={false} lastSaved={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render saving indicator when autoSaving is true', () => {
      render(<AutoSaveStatus autoSaving={true} lastSaved={null} />)

      expect(screen.getByText('正在保存...')).toBeInTheDocument()
      const spinner = screen.getByText('正在保存...').previousSibling
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should render saved indicator when lastSaved is provided and not saving', () => {
      const lastSaved = new Date('2024-01-01T12:00:00')
      render(<AutoSaveStatus autoSaving={false} lastSaved={lastSaved} />)

      expect(screen.getByText(/已保存/)).toBeInTheDocument()
      expect(screen.getByText(/已保存/).textContent).toContain(lastSaved.toLocaleTimeString())
    })

    it('should not show saved indicator when saving', () => {
      const lastSaved = new Date('2024-01-01T12:00:00')
      render(<AutoSaveStatus autoSaving={true} lastSaved={lastSaved} />)

      expect(screen.getByText('正在保存...')).toBeInTheDocument()
      expect(screen.queryByText(/已保存/)).not.toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should handle different lastSaved dates', () => {
      const date1 = new Date('2024-01-01T10:00:00')
      const { rerender } = render(<AutoSaveStatus autoSaving={false} lastSaved={date1} />)

      expect(screen.getByText(/已保存/)).toBeInTheDocument()

      const date2 = new Date('2024-01-01T15:30:00')
      rerender(<AutoSaveStatus autoSaving={false} lastSaved={date2} />)

      expect(screen.getByText(/已保存/).textContent).toContain(date2.toLocaleTimeString())
    })
  })
})
