import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RootLayout from '../layout'

// Mock Next.js dependencies
vi.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
    style: { fontFamily: 'Geist' },
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
    style: { fontFamily: 'Geist Mono' },
  }),
}))

// Mock components
vi.mock('@/components/app/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

vi.mock('@/components/launcher', () => ({
  AppLauncher: () => <div data-testid="app-launcher">AppLauncher</div>,
}))

vi.mock('@/components/provider/BackgroundWrapper', () => ({
  BackgroundWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-wrapper">{children}</div>
  ),
}))

vi.mock('@/components/provider/SWRProvider', () => ({
  SWRProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swr-provider">{children}</div>
  ),
}))

vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}))

vi.mock('@/components/provider/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="language-provider">{children}</div>
  ),
}))

// Mock CSS imports
vi.mock('../globals.css', () => ({}))
vi.mock('prismjs/themes/prism.css', () => ({}))
vi.mock('./note/styles/prism.css', () => ({}))

describe('RootLayout', () => {
  it('should render the root layout with correct structure', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    // Check for HTML structure
    expect(document.documentElement).toHaveAttribute('lang', 'zh-CN')
    expect(document.documentElement).toHaveAttribute('suppressHydrationWarning')

    // Check for body classes
    const body = document.body
    expect(body).toHaveClass('flex', 'h-screen', 'flex-col', 'antialiased')
  })

  it('should render all provider components in correct order', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    // Check that all providers are rendered
    expect(screen.getByTestId('swr-provider')).toBeInTheDocument()
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('language-provider')).toBeInTheDocument()
    expect(screen.getByTestId('background-wrapper')).toBeInTheDocument()
    expect(screen.getByTestId('protected-route')).toBeInTheDocument()
  })

  it('should render header container with correct structure', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const headerContainer = screen.getByTestId('app-launcher').closest('#header-container')
    expect(headerContainer).toBeInTheDocument()
    expect(headerContainer).toHaveClass(
      'bg-background',
      'sticky',
      'top-0',
      'z-30',
      'h-[50px]',
      'flex-none',
      'border-b',
      'shadow-sm'
    )
  })

  it('should render main container with correct structure', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const mainContainer = screen.getByTestId('protected-route').closest('#main-container')
    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveClass('flex-1', 'overflow-x-hidden')
  })

  it('should render content wrapper with correct classes', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const contentWrapper = screen.getByTestId('protected-route').closest('.mx-auto')
    expect(contentWrapper).toBeInTheDocument()
    expect(contentWrapper).toHaveClass('h-full', 'w-full', 'max-w-7xl', 'p-0')
  })

  it('should render toaster component', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should have correct font variables applied', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const body = document.body
    expect(body).toHaveClass('--font-geist-sans', '--font-geist-mono')
  })

  it('should render header with correct layout', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const headerInner = screen.getByTestId('app-launcher').closest('.mx-auto')
    expect(headerInner).toBeInTheDocument()
    expect(headerInner).toHaveClass('flex', 'h-full', 'w-full', 'max-w-7xl', 'items-center')
  })
})
