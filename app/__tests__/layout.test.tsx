import { render } from '@testing-library/react'
import { vi } from 'vitest'
import RootLayout from '../layout'

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

vi.mock('@/components/app/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

vi.mock('@/components/themes/UIThemeProvider', () => ({
  UIThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ui-theme-provider">{children}</div>
  ),
}))

vi.mock('@/components/themes/LayoutRenderer', () => ({
  LayoutRenderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-renderer">{children}</div>
  ),
}))

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
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

vi.mock('@/components/app/PWAInstallPrompt', () => ({
  PWAInstallPrompt: () => <div data-testid="pwa-install-prompt" />,
}))

vi.mock('@/components/app/PWARegister', () => ({
  PWARegister: () => <div data-testid="pwa-register" />,
}))

vi.mock('@/components/app/PushSubscriptionRegister', () => ({
  PushSubscriptionRegister: () => <div data-testid="push-subscription-register" />,
}))

vi.mock('@/components/app/UnreadNotificationFetcher', () => ({
  UnreadNotificationFetcher: () => <div data-testid="unread-notification-fetcher" />,
}))

vi.mock('@/components/app/NotificationRealtimeSubscriber', () => ({
  NotificationRealtimeSubscriber: () => <div data-testid="notification-realtime-subscriber" />,
}))

vi.mock('../globals.css', () => ({}))

describe('RootLayout', () => {
  it('applies root html/body attributes and base classes', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(document.documentElement).toHaveAttribute('lang', 'zh-CN')
    expect(document.body).toHaveClass('--font-geist-sans', '--font-geist-mono')
    expect(document.body).toHaveClass(
      'flex',
      'h-screen',
      'flex-col',
      'overflow-hidden',
      'antialiased'
    )
  })

  it('renders provider chain and child content', () => {
    const view = render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )

    expect(view.getByTestId('swr-provider')).toBeInTheDocument()
    expect(view.getByTestId('theme-provider')).toBeInTheDocument()
    expect(view.getByTestId('ui-theme-provider')).toBeInTheDocument()
    expect(view.getByTestId('language-provider')).toBeInTheDocument()
    expect(view.getByTestId('layout-renderer')).toBeInTheDocument()
    expect(view.getByTestId('background-wrapper')).toBeInTheDocument()
    expect(view.getByTestId('protected-route')).toBeInTheDocument()
    expect(view.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders app runtime helpers', () => {
    const view = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(view.getByTestId('toaster')).toBeInTheDocument()
    expect(view.getByTestId('pwa-install-prompt')).toBeInTheDocument()
    expect(view.getByTestId('pwa-register')).toBeInTheDocument()
    expect(view.getByTestId('push-subscription-register')).toBeInTheDocument()
    expect(view.getByTestId('unread-notification-fetcher')).toBeInTheDocument()
    expect(view.getByTestId('notification-realtime-subscriber')).toBeInTheDocument()
  })
})
