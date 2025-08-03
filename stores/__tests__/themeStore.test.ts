import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useThemeStore, getCurrentThemeColor } from '../themeStore'
import type { CustomTheme } from '../../app/types'

// Mock the configs
vi.mock('@/app/configs', () => ({
  configs: {
    themeColors: [
      {
        id: 'default',
        nameKey: 'theme.default',
        primary: '#3b82f6',
        color: '#1e40af',
      },
      {
        id: 'green',
        nameKey: 'theme.green',
        primary: '#10b981',
        color: '#059669',
      },
      {
        id: 'purple',
        nameKey: 'theme.purple',
        primary: '#8b5cf6',
        color: '#7c3aed',
      },
    ],
  },
}))

describe('themeStore', () => {
  const mockCustomTheme: CustomTheme = {
    id: 'custom-1',
    name: 'Custom Theme',
    primary: '#ff6b6b',
    color: '#e55656',
  }

  const mockCustomTheme2: CustomTheme = {
    id: 'custom-2',
    name: 'Another Custom Theme',
    primary: '#4ecdc4',
    color: '#26a69a',
  }

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset store state
    useThemeStore.setState({
      currentTheme: 'default',
      customThemes: [],
      followSystem: false,
      previousThemeMode: 'light',
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useThemeStore())

    expect(result.current.currentTheme).toBe('default')
    expect(result.current.customThemes).toEqual([])
    expect(result.current.followSystem).toBe(false)
    expect(result.current.previousThemeMode).toBe('light')
  })

  it('should set current theme', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setCurrentTheme('green')
    })

    expect(result.current.currentTheme).toBe('green')

    act(() => {
      result.current.setCurrentTheme('purple')
    })

    expect(result.current.currentTheme).toBe('purple')
  })

  it('should add custom theme', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.addCustomTheme(mockCustomTheme)
    })

    expect(result.current.customThemes).toHaveLength(1)
    expect(result.current.customThemes[0]).toEqual(mockCustomTheme)
  })

  it('should add multiple custom themes', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.addCustomTheme(mockCustomTheme)
      result.current.addCustomTheme(mockCustomTheme2)
    })

    expect(result.current.customThemes).toHaveLength(2)
    expect(result.current.customThemes).toContain(mockCustomTheme)
    expect(result.current.customThemes).toContain(mockCustomTheme2)
  })

  it('should remove custom theme', () => {
    const { result } = renderHook(() => useThemeStore())

    // Add themes first
    act(() => {
      result.current.addCustomTheme(mockCustomTheme)
      result.current.addCustomTheme(mockCustomTheme2)
    })

    expect(result.current.customThemes).toHaveLength(2)

    // Remove one theme
    act(() => {
      result.current.removeCustomTheme('custom-1')
    })

    expect(result.current.customThemes).toHaveLength(1)
    expect(result.current.customThemes[0]).toEqual(mockCustomTheme2)
  })

  it('should switch to default theme when removing current custom theme', () => {
    const { result } = renderHook(() => useThemeStore())

    // Add custom theme and set it as current
    act(() => {
      result.current.addCustomTheme(mockCustomTheme)
      result.current.setCurrentTheme('custom-1')
    })

    expect(result.current.currentTheme).toBe('custom-1')

    // Remove the current custom theme
    act(() => {
      result.current.removeCustomTheme('custom-1')
    })

    expect(result.current.currentTheme).toBe('default')
    expect(result.current.customThemes).toHaveLength(0)
  })

  it('should not change current theme when removing non-current custom theme', () => {
    const { result } = renderHook(() => useThemeStore())

    // Add custom themes and set one as current
    act(() => {
      result.current.addCustomTheme(mockCustomTheme)
      result.current.addCustomTheme(mockCustomTheme2)
      result.current.setCurrentTheme('custom-1')
    })

    expect(result.current.currentTheme).toBe('custom-1')

    // Remove the non-current custom theme
    act(() => {
      result.current.removeCustomTheme('custom-2')
    })

    expect(result.current.currentTheme).toBe('custom-1') // Should remain unchanged
    expect(result.current.customThemes).toHaveLength(1)
    expect(result.current.customThemes[0]).toEqual(mockCustomTheme)
  })

  it('should set follow system to true and save current mode', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setFollowSystem(true, 'dark')
    })

    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('dark')
  })

  it('should set follow system to true with default mode when not provided', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setFollowSystem(true)
    })

    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('light') // Should default to 'light'
  })

  it('should set follow system to false and preserve previous mode', () => {
    const { result } = renderHook(() => useThemeStore())

    // First enable follow system with dark mode
    act(() => {
      result.current.setFollowSystem(true, 'dark')
    })

    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('dark')

    // Then disable follow system
    act(() => {
      result.current.setFollowSystem(false)
    })

    expect(result.current.followSystem).toBe(false)
    expect(result.current.previousThemeMode).toBe('dark') // Should preserve the previous mode
  })

  it('should handle follow system toggle sequence', () => {
    const { result } = renderHook(() => useThemeStore())

    // Enable with light mode
    act(() => {
      result.current.setFollowSystem(true, 'light')
    })
    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('light')

    // Disable
    act(() => {
      result.current.setFollowSystem(false)
    })
    expect(result.current.followSystem).toBe(false)
    expect(result.current.previousThemeMode).toBe('light')

    // Enable again with dark mode
    act(() => {
      result.current.setFollowSystem(true, 'dark')
    })
    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('dark')
  })

  it('should persist theme state', () => {
    const persistedState = {
      currentTheme: 'green',
      customThemes: [mockCustomTheme],
      followSystem: true,
      previousThemeMode: 'dark',
    }

    // Set state to simulate persistence
    useThemeStore.setState(persistedState)

    // Create new hook instance to simulate rehydration
    const { result } = renderHook(() => useThemeStore())

    expect(result.current.currentTheme).toBe('green')
    expect(result.current.customThemes).toEqual([mockCustomTheme])
    expect(result.current.followSystem).toBe(true)
    expect(result.current.previousThemeMode).toBe('dark')
  })
})

describe('getCurrentThemeColor', () => {
  const mockCustomThemes: CustomTheme[] = [
    {
      id: 'custom-red',
      name: 'Red Theme',
      primary: '#ff0000',
      color: '#cc0000',
    },
    {
      id: 'custom-blue',
      name: 'Blue Theme',
      primary: '#0000ff',
      color: '#0000cc',
    },
  ]

  it('should return preset theme color', () => {
    const themeColor = getCurrentThemeColor('green', [])

    expect(themeColor).toEqual({
      id: 'green',
      name: 'theme.green',
      primary: '#10b981',
      color: '#059669',
    })
  })

  it('should return custom theme color', () => {
    const themeColor = getCurrentThemeColor('custom-red', mockCustomThemes)

    expect(themeColor).toEqual({
      id: 'custom-red',
      name: 'Red Theme',
      primary: '#ff0000',
      color: '#cc0000',
    })
  })

  it('should return default theme when theme not found', () => {
    const themeColor = getCurrentThemeColor('non-existent', mockCustomThemes)

    expect(themeColor).toEqual({
      id: 'default',
      name: 'theme.default',
      primary: '#3b82f6',
      color: '#1e40af',
    })
  })

  it('should prioritize preset themes over custom themes with same id', () => {
    const customThemesWithConflict: CustomTheme[] = [
      {
        id: 'default', // Same id as preset theme
        name: 'Custom Default',
        primary: '#ff00ff',
        color: '#cc00cc',
      },
    ]

    const themeColor = getCurrentThemeColor('default', customThemesWithConflict)

    // Should return the preset theme, not the custom one
    expect(themeColor).toEqual({
      id: 'default',
      name: 'theme.default',
      primary: '#3b82f6',
      color: '#1e40af',
    })
  })

  it('should handle empty custom themes array', () => {
    const themeColor = getCurrentThemeColor('purple', [])

    expect(themeColor).toEqual({
      id: 'purple',
      name: 'theme.purple',
      primary: '#8b5cf6',
      color: '#7c3aed',
    })
  })

  it('should handle null/undefined theme id', () => {
    const themeColor = getCurrentThemeColor('', mockCustomThemes)

    // Should return default theme
    expect(themeColor).toEqual({
      id: 'default',
      name: 'theme.default',
      primary: '#3b82f6',
      color: '#1e40af',
    })
  })
})
