/**
 * Tests for BackgroundWrapper component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { BackgroundWrapper } from '../BackgroundWrapper'

// Mock the background store
const mockUseBackgroundStore = vi.fn()
vi.mock('@/stores/backgroundStore', () => ({
  useBackgroundStore: () => mockUseBackgroundStore(),
}))

// Mock the cn utility
vi.mock('@/lib/helpers', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' '),
}))

describe('BackgroundWrapper', () => {
  beforeEach(() => {
    mockUseBackgroundStore.mockReturnValue({
      backgroundImage: null,
      setBackgroundImage: vi.fn(),
      clearBackground: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render children correctly', () => {
    const { getByText } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })

  it('should apply default classes when no background image', () => {
    const { container } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('min-h-[calc(100vh-var(--navbar-height,64px))]')
    expect(wrapper).toHaveClass('flex-col')
    expect(wrapper).not.toHaveClass('bg-cover')
    expect(wrapper).not.toHaveClass('bg-fixed')
    expect(wrapper).not.toHaveClass('bg-center')
  })

  it('should apply background image classes when background image is set', () => {
    const backgroundImageUrl = 'https://example.com/background.jpg'
    mockUseBackgroundStore.mockReturnValue({
      backgroundImage: backgroundImageUrl,
      setBackgroundImage: vi.fn(),
      clearBackground: vi.fn(),
    })

    const { container } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('min-h-[calc(100vh-var(--navbar-height,64px))]')
    expect(wrapper).toHaveClass('flex-col')
    expect(wrapper).toHaveClass('bg-cover')
    expect(wrapper).toHaveClass('bg-fixed')
    expect(wrapper).toHaveClass('bg-center')
  })

  it('should set background image style when background image is provided', () => {
    const backgroundImageUrl = 'https://example.com/background.jpg'
    mockUseBackgroundStore.mockReturnValue({
      backgroundImage: backgroundImageUrl,
      setBackgroundImage: vi.fn(),
      clearBackground: vi.fn(),
    })

    const { container } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({
      backgroundImage: `url(${backgroundImageUrl})`,
    })
  })

  it('should not set background image style when no background image', () => {
    const { container } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.backgroundImage).toBe('')
  })

  it('should handle multiple children', () => {
    const { getByText } = render(
      <BackgroundWrapper>
        <div>First child</div>
        <span>Second child</span>
      </BackgroundWrapper>
    )

    expect(getByText('First child')).toBeInTheDocument()
    expect(getByText('Second child')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    const { container } = render(<BackgroundWrapper>{null}</BackgroundWrapper>)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children).toHaveLength(0)
  })

  it('should handle different background image URLs', () => {
    const testUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png',
      '/local/image.gif',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
    ]

    testUrls.forEach(url => {
      mockUseBackgroundStore.mockReturnValue({
        backgroundImage: url,
        setBackgroundImage: vi.fn(),
        clearBackground: vi.fn(),
      })

      const { container } = render(
        <BackgroundWrapper>
          <div>Test content</div>
        </BackgroundWrapper>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({
        backgroundImage: `url(${url})`,
      })
    })
  })

  it('should handle empty string background image', () => {
    mockUseBackgroundStore.mockReturnValue({
      backgroundImage: '',
      setBackgroundImage: vi.fn(),
      clearBackground: vi.fn(),
    })

    const { container } = render(
      <BackgroundWrapper>
        <div>Test content</div>
      </BackgroundWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).not.toHaveClass('bg-cover')
    expect(wrapper).not.toHaveClass('bg-fixed')
    expect(wrapper).not.toHaveClass('bg-center')
    expect(wrapper.style.backgroundImage).toBe('')
  })

  it('should handle complex nested children', () => {
    const { getByTestId } = render(
      <BackgroundWrapper>
        <div data-testid="parent">
          <div data-testid="child1">
            <span data-testid="grandchild">Nested content</span>
          </div>
          <div data-testid="child2">Another child</div>
        </div>
      </BackgroundWrapper>
    )

    expect(getByTestId('parent')).toBeInTheDocument()
    expect(getByTestId('child1')).toBeInTheDocument()
    expect(getByTestId('child2')).toBeInTheDocument()
    expect(getByTestId('grandchild')).toBeInTheDocument()
  })
})
