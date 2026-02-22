import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFileEdit } from '../useFileEdit'

// mock swr mutate and api put
vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/lib/api', () => ({ put: vi.fn() }))

describe('useFileEdit', () => {
  it('opens and closes via modal helpers', () => {
    const { result } = renderHook(() => useFileEdit())

    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()

    act(() => {
      result.current.openModal(5)
    })

    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(5)

    act(() => {
      result.current.closeEditDialog()
    })

    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()
  })

  it('setEditingFile populates name/description and opens', () => {
    const { result } = renderHook(() => useFileEdit())

    const fakeFile = { id: 7, name: 'foo', description: 'bar' }
    act(() => {
      result.current.setEditingFile(fakeFile as any)
    })

    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(7)
    expect(result.current.fileName).toBe('foo')
    expect(result.current.fileDescription).toBe('bar')
  })
})
