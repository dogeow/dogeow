import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFormHandlers } from '../useFormHandlers'

interface TestForm {
  text: string
  option: string
  flag: boolean
  count: number
}

describe('useFormHandlers', () => {
  it('updates text value via handleInputChange', () => {
    let data: TestForm = { text: '', option: '', flag: false, count: 0 }
    const setData = (fn: any) => {
      data = typeof fn === 'function' ? fn(data) : fn
    }

    const { result } = renderHook(() => useFormHandlers<TestForm>(setData))

    act(() => {
      result.current.handleInputChange({
        target: { name: 'text', value: 'hello' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(data.text).toBe('hello')
  })

  it('handles select change and converts "none" to empty', () => {
    let data: TestForm = { text: '', option: '', flag: false, count: 0 }
    const setData = (fn: any) => {
      data = typeof fn === 'function' ? fn(data) : fn
    }
    const { result } = renderHook(() => useFormHandlers<TestForm>(setData))

    act(() => {
      result.current.handleSelectChange('option', 'none')
    })
    expect(data.option).toBe('')

    act(() => {
      result.current.handleSelectChange('option', 'foo')
    })
    expect(data.option).toBe('foo')
  })

  it('handles switch change', () => {
    let data: TestForm = { text: '', option: '', flag: false, count: 0 }
    const setData = (fn: any) => {
      data = typeof fn === 'function' ? fn(data) : fn
    }
    const { result } = renderHook(() => useFormHandlers<TestForm>(setData))

    act(() => {
      result.current.handleSwitchChange('flag', true)
    })
    expect(data.flag).toBe(true)
  })

  it('handles number change', () => {
    let data: TestForm = { text: '', option: '', flag: false, count: 0 }
    const setData = (fn: any) => {
      data = typeof fn === 'function' ? fn(data) : fn
    }
    const { result } = renderHook(() => useFormHandlers<TestForm>(setData))

    act(() => {
      result.current.handleNumberChange('count', 5)
    })
    expect(data.count).toBe(5)
  })
})
