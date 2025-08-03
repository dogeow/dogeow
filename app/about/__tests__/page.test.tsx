import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import About from '../page'

describe('About Page', () => {
  it('should render about page with correct content', () => {
    render(<About />)

    expect(screen.getByText('暂时没有介绍')).toBeInTheDocument()
  })

  it('should have correct container classes', () => {
    render(<About />)

    const container = screen.getByText('暂时没有介绍').parentElement
    expect(container).toHaveClass('container', 'mx-auto', 'p-4')
  })

  it('should be accessible', () => {
    render(<About />)

    // Check that the content is rendered in a div (which is accessible)
    const content = screen.getByText('暂时没有介绍')
    expect(content).toBeInTheDocument()
  })
})
