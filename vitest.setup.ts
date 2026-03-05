import '@testing-library/jest-dom'
import { vi } from 'vitest'
import * as DomLibrary from '@testing-library/dom'
import Module from 'node:module'
import path from 'node:path'

// Make screen, fireEvent, waitFor available globally
// @testing-library/react 16.x removed these from the main export
const { screen, fireEvent, waitFor, within } = DomLibrary

// Expose to global for tests
Object.defineProperty(globalThis, 'screen', { value: screen })
Object.defineProperty(globalThis, 'fireEvent', { value: fireEvent })
Object.defineProperty(globalThis, 'waitFor', { value: waitFor })
Object.defineProperty(globalThis, 'within', { value: within })

// Jest compatibility shim for legacy tests
Object.defineProperty(globalThis, 'jest', {
  value: vi,
  configurable: true,
})

// Support legacy CommonJS require with "@/..." alias in old tests.
const ModuleAny = Module as unknown as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options: unknown) => string
}
const originalResolveFilename = ModuleAny._resolveFilename
ModuleAny._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const mappedPath = path.resolve(process.cwd(), request.slice(2))
    return originalResolveFilename.call(this, mappedPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// Mock Next.js router
const mockUseRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}))
const mockUseSearchParams = vi.fn(() => new URLSearchParams())
const mockUsePathname = vi.fn(() => '/')

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  useSearchParams: mockUseSearchParams,
  usePathname: mockUsePathname,
}))

// Mock Pusher/Echo
vi.mock('laravel-echo', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      channel: vi.fn().mockReturnThis(),
      private: vi.fn().mockReturnThis(),
      presence: vi.fn().mockReturnThis(),
      listen: vi.fn().mockReturnThis(),
      whisper: vi.fn().mockReturnThis(),
      leave: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
    })),
  }
})

vi.mock('pusher-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      disconnect: vi.fn(),
    })),
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  })),
})

// Mock Audio API
Object.defineProperty(window, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: 0,
    duration: 100,
    volume: 1,
    muted: false,
  })),
})

const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length
    },
  }
}

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
})
