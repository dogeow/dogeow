import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAutoSave } from '../useAutoSave'

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers onSave after the delay when triggered', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useAutoSave<{ foo: string }>({ onSave, delay: 500 })
    )

    act(() => {
      result.current.setInitialData({ foo: 'bar' })
    })

    act(() => {
      result.current.triggerAutoSave()
    })

    expect(result.current.autoSaving).toBe(false)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // allow promise resolution and state update
    await act(async () => {})

    // onSave should have been called synchronously after timer advance
    expect(onSave).toHaveBeenCalledWith({ foo: 'bar' })
    // lastSaved must have been updated (autoSaving state is ephemeral)
    expect(result.current.lastSaved).not.toBeNull()
  })

  it('cancels previous timer when triggerAutoSave is called repeatedly', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useAutoSave<{ foo: string }>({ onSave, delay: 500 })
    )

    act(() => {
      result.current.setInitialData({ foo: 'baz' })
    })

    act(() => {
      result.current.triggerAutoSave()
      result.current.triggerAutoSave()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
