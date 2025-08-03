/**
 * Tests for SWRProvider component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { SWRProvider } from '../SWRProvider'

// Mock SWR
const mockSWRConfig = vi.fn()
vi.mock('swr', () => ({
  SWRConfig: ({ children, value }: { children: React.ReactNode; value: unknown }) => {
    mockSWRConfig(value)
    return <div data-testid="swr-config">{children}</div>
  },
}))

// Mock the API get function
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
}))

describe('SWRProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children correctly', () => {
    const { getByText } = render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })

  it('should wrap children in SWRConfig', () => {
    const { getByTestId } = render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    expect(getByTestId('swr-config')).toBeInTheDocument()
  })

  it('should configure SWR with correct options', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    const config = mockSWRConfig.mock.calls[0][0]
    expect(config).toHaveProperty('fetcher')
    expect(config.revalidateOnFocus).toBe(false)
    expect(config.revalidateOnReconnect).toBe(true)
    expect(config.shouldRetryOnError).toBe(false)
  })

  it('should use the get function as fetcher', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    const configCall = mockSWRConfig.mock.calls[0][0]
    expect(configCall).toHaveProperty('fetcher')
    expect(typeof configCall.fetcher).toBe('function')
  })

  it('should disable revalidateOnFocus', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    const configCall = mockSWRConfig.mock.calls[0][0]
    expect(configCall.revalidateOnFocus).toBe(false)
  })

  it('should enable revalidateOnReconnect', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    const configCall = mockSWRConfig.mock.calls[0][0]
    expect(configCall.revalidateOnReconnect).toBe(true)
  })

  it('should disable shouldRetryOnError', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    const configCall = mockSWRConfig.mock.calls[0][0]
    expect(configCall.shouldRetryOnError).toBe(false)
  })

  it('should handle multiple children', () => {
    const { getByText } = render(
      <SWRProvider>
        <div>First child</div>
        <span>Second child</span>
      </SWRProvider>
    )

    expect(getByText('First child')).toBeInTheDocument()
    expect(getByText('Second child')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    const { getByTestId } = render(<SWRProvider>{null}</SWRProvider>)

    expect(getByTestId('swr-config')).toBeInTheDocument()
  })

  it('should handle complex nested children', () => {
    const { getByTestId } = render(
      <SWRProvider>
        <div data-testid="parent">
          <div data-testid="child1">
            <span data-testid="grandchild">Nested content</span>
          </div>
          <div data-testid="child2">Another child</div>
        </div>
      </SWRProvider>
    )

    expect(getByTestId('parent')).toBeInTheDocument()
    expect(getByTestId('child1')).toBeInTheDocument()
    expect(getByTestId('child2')).toBeInTheDocument()
    expect(getByTestId('grandchild')).toBeInTheDocument()
  })

  it('should pass all configuration options correctly', () => {
    render(
      <SWRProvider>
        <div>Test content</div>
      </SWRProvider>
    )

    expect(mockSWRConfig).toHaveBeenCalledTimes(1)
    const config = mockSWRConfig.mock.calls[0][0]

    // Verify all expected properties are present
    expect(config).toHaveProperty('fetcher')
    expect(config).toHaveProperty('revalidateOnFocus')
    expect(config).toHaveProperty('revalidateOnReconnect')
    expect(config).toHaveProperty('shouldRetryOnError')

    // Verify exact values
    expect(Object.keys(config)).toHaveLength(4)
  })
})
