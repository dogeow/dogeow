import { render, screen } from '@testing-library/react'
import { NotificationBadge, NotificationDot, NotificationIndicator } from '../NotificationBadge'

describe('NotificationBadge', () => {
  it('renders notification count correctly', () => {
    render(<NotificationBadge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not render when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows 99+ for counts over 99', () => {
    render(<NotificationBadge count={150} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows mention styling when hasMentions is true', () => {
    render(<NotificationBadge count={3} hasMentions={true} />)
    const badge = screen.getByText('3')
    expect(badge).toHaveClass('bg-destructive')
  })
})

describe('NotificationDot', () => {
  it('renders when visible is true', () => {
    const { container } = render(<NotificationDot visible={true} />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('does not render when visible is false', () => {
    const { container } = render(<NotificationDot visible={false} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('NotificationIndicator', () => {
  it('renders children and notification badge', () => {
    render(
      <NotificationIndicator count={2}>
        <button>Test Button</button>
      </NotificationIndicator>
    )

    expect(screen.getByText('Test Button')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('positions badge correctly', () => {
    render(
      <NotificationIndicator count={1} position="top-left">
        <button>Test</button>
      </NotificationIndicator>
    )

    const badge = screen.getByText('1').parentElement
    expect(badge).toHaveClass('-top-1')
    expect(badge).toHaveClass('-left-1')
  })
})
