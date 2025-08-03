import { renderHook, act } from '@testing-library/react'
import { useProjectCoverStore } from '../projectCoverStore'

describe('projectCoverStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset store state
    useProjectCoverStore.setState({
      showProjectCovers: true,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    expect(result.current.showProjectCovers).toBe(true)
  })

  it('should set showProjectCovers to false', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    act(() => {
      result.current.setShowProjectCovers(false)
    })

    expect(result.current.showProjectCovers).toBe(false)
  })

  it('should set showProjectCovers to true', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    // First set to false
    act(() => {
      result.current.setShowProjectCovers(false)
    })
    expect(result.current.showProjectCovers).toBe(false)

    // Then set back to true
    act(() => {
      result.current.setShowProjectCovers(true)
    })
    expect(result.current.showProjectCovers).toBe(true)
  })

  it('should toggle showProjectCovers state', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    // Initial state is true
    expect(result.current.showProjectCovers).toBe(true)

    // Toggle to false
    act(() => {
      result.current.setShowProjectCovers(!result.current.showProjectCovers)
    })
    expect(result.current.showProjectCovers).toBe(false)

    // Toggle back to true
    act(() => {
      result.current.setShowProjectCovers(!result.current.showProjectCovers)
    })
    expect(result.current.showProjectCovers).toBe(true)
  })

  it('should persist showProjectCovers state', () => {
    // Set state to false
    useProjectCoverStore.setState({ showProjectCovers: false })

    // Create new hook instance to simulate rehydration
    const { result } = renderHook(() => useProjectCoverStore())

    expect(result.current.showProjectCovers).toBe(false)
  })

  it('should handle multiple state changes', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    const testSequence = [false, true, false, true, false]

    testSequence.forEach(value => {
      act(() => {
        result.current.setShowProjectCovers(value)
      })
      expect(result.current.showProjectCovers).toBe(value)
    })
  })

  it('should maintain state consistency', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    // Set to false multiple times
    act(() => {
      result.current.setShowProjectCovers(false)
      result.current.setShowProjectCovers(false)
      result.current.setShowProjectCovers(false)
    })
    expect(result.current.showProjectCovers).toBe(false)

    // Set to true multiple times
    act(() => {
      result.current.setShowProjectCovers(true)
      result.current.setShowProjectCovers(true)
      result.current.setShowProjectCovers(true)
    })
    expect(result.current.showProjectCovers).toBe(true)
  })

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    // Rapid toggle sequence
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.setShowProjectCovers(i % 2 === 0)
      }
    })

    // Should end with false (since 9 % 2 === 1, so the last call was with false)
    expect(result.current.showProjectCovers).toBe(false)
  })

  it('should work with conditional logic', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    // Simulate conditional setting based on some external state
    const userPreference = 'hide'

    act(() => {
      result.current.setShowProjectCovers(userPreference === 'show')
    })
    expect(result.current.showProjectCovers).toBe(false)

    const anotherUserPreference = 'show'

    act(() => {
      result.current.setShowProjectCovers(anotherUserPreference === 'show')
    })
    expect(result.current.showProjectCovers).toBe(true)
  })
})
