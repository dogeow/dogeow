import { render, screen } from '@testing-library/react'
import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('should render skeleton with default classes', () => {
    render(<Skeleton />)

    const skeleton = document.querySelector('.bg-muted.animate-pulse.rounded-md')
    expect(skeleton).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Skeleton className="custom-skeleton" />)

    const skeleton = document.querySelector('.custom-skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('bg-muted', 'animate-pulse', 'rounded-md', 'custom-skeleton')
  })

  it('should pass through additional props', () => {
    render(<Skeleton data-testid="skeleton-element" />)

    const skeleton = screen.getByTestId('skeleton-element')
    expect(skeleton).toBeInTheDocument()
  })

  it('should render as div element', () => {
    render(<Skeleton data-testid="skeleton-element" />)

    const skeleton = screen.getByTestId('skeleton-element')
    expect(skeleton.tagName).toBe('DIV')
  })

  it('should support custom dimensions', () => {
    render(<Skeleton className="h-4 w-full" />)

    const skeleton = document.querySelector('.h-4.w-full')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('bg-muted', 'animate-pulse', 'rounded-md', 'h-4', 'w-full')
  })

  it('should support different shapes', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" />)

    const skeleton = document.querySelector('.rounded-full.h-12.w-12')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('bg-muted', 'animate-pulse', 'rounded-full', 'h-12', 'w-12')
  })

  it('should render multiple skeletons', () => {
    render(
      <div>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )

    const skeletons = document.querySelectorAll('.bg-muted.animate-pulse.rounded-md')
    expect(skeletons).toHaveLength(3)
  })

  it('should handle children content', () => {
    render(<Skeleton>Loading content...</Skeleton>)

    expect(screen.getByText('Loading content...')).toBeInTheDocument()
  })
})
