import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFormModal } from '../useFormModal'

describe('useFormModal', () => {
  it('defaults closed with null id and initial mode', () => {
    const { result } = renderHook(() => useFormModal<number>('view'))
    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()
    expect(result.current.mode).toBe('view')
  })

  it('openModal sets id, mode and opens', () => {
    const { result } = renderHook(() => useFormModal<number>('view'))
    act(() => {
      result.current.openModal(42, 'edit')
    })
    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(42)
    expect(result.current.mode).toBe('edit')
  })

  it('closeModal resets to defaults', () => {
    const { result } = renderHook(() => useFormModal<number>('view'))
    act(() => {
      result.current.openModal(10, 'edit')
      result.current.closeModal()
    })
    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()
    expect(result.current.mode).toBe('view')
  })

  it('allows manual setters to work', () => {
    const { result } = renderHook(() => useFormModal<number>('view'))
    act(() => {
      result.current.setOpen(true)
      result.current.setSelectedId(99)
      result.current.setMode('custom' as any)
    })
    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(99)
    expect(result.current.mode).toBe('custom')
  })
})
