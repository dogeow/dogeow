/**
 * Tests for theme-provider component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '../theme-provider'

// Mock next-themes
const mockNextThemesProvider = vi.fn()
vi.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => {
    mockNextThemesProvider(props)
    return <div data-testid="next-themes-provider">{children}</div>
  },
}))

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })

  it('should wrap children in NextThemesProvider', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  it('should pass props to NextThemesProvider', () => {
    const testProps = {
      attribute: 'class' as const,
      defaultTheme: 'dark',
      enableSystem: true,
      disableTransitionOnChange: false,
    }

    render(
      <ThemeProvider {...testProps}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(testProps)
  })

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>First child</div>
        <span>Second child</span>
      </ThemeProvider>
    )

    expect(getByText('First child')).toBeInTheDocument()
    expect(getByText('Second child')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    const { getByTestId } = render(<ThemeProvider>{null}</ThemeProvider>)

    expect(getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  it('should handle complex nested children', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div data-testid="parent">
          <div data-testid="child1">
            <span data-testid="grandchild">Nested content</span>
          </div>
          <div data-testid="child2">Another child</div>
        </div>
      </ThemeProvider>
    )

    expect(getByTestId('parent')).toBeInTheDocument()
    expect(getByTestId('child1')).toBeInTheDocument()
    expect(getByTestId('child2')).toBeInTheDocument()
    expect(getByTestId('grandchild')).toBeInTheDocument()
  })

  it('should pass all props correctly', () => {
    const complexProps = {
      attribute: 'data-theme' as const,
      defaultTheme: 'system',
      enableSystem: false,
      disableTransitionOnChange: true,
      storageKey: 'custom-theme',
      themes: ['light', 'dark', 'custom'],
      value: { light: 'light-theme', dark: 'dark-theme' },
    }

    render(
      <ThemeProvider {...complexProps}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(complexProps)
  })

  it('should handle no props', () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith({})
  })

  it('should handle undefined props', () => {
    const propsWithUndefined = {
      attribute: 'class' as const,
      defaultTheme: undefined,
      enableSystem: true,
    }

    render(
      <ThemeProvider {...propsWithUndefined}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(propsWithUndefined)
  })

  it('should handle boolean props correctly', () => {
    const booleanProps = {
      enableSystem: true,
      disableTransitionOnChange: false,
      enableColorScheme: true,
    }

    render(
      <ThemeProvider {...booleanProps}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(booleanProps)
  })

  it('should handle array props correctly', () => {
    const arrayProps = {
      themes: ['light', 'dark', 'blue', 'red'],
    }

    render(
      <ThemeProvider {...arrayProps}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(arrayProps)
  })

  it('should handle object props correctly', () => {
    const objectProps = {
      value: {
        light: 'light-mode',
        dark: 'dark-mode',
        blue: 'blue-theme',
      },
    }

    render(
      <ThemeProvider {...objectProps}>
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(mockNextThemesProvider).toHaveBeenCalledWith(objectProps)
  })
})
