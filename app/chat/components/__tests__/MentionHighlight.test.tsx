import { fireEvent, render } from '@testing-library/react'
import { vi } from 'vitest'
import { MentionHighlight, extractMentions, containsMention } from '../MentionHighlight'

vi.mock('@/stores/authStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    user: { name: 'testuser' },
  })),
}))

describe('MentionHighlight', () => {
  it('renders plain text without mentions', () => {
    const view = render(<MentionHighlight text="Hello world" />)

    expect(view.getByText('Hello world')).toBeInTheDocument()
  })

  it('highlights @username mentions', () => {
    const view = render(<MentionHighlight text="Hello @john how are you?" />)

    const mentionButton = view.getByRole('button', { name: '@john' })
    expect(mentionButton).toBeInTheDocument()
    expect(mentionButton).toHaveClass('bg-blue-500/15')
    expect(view.container.textContent).toContain('Hello @john how are you?')
  })

  it('highlights quoted mentions', () => {
    const view = render(<MentionHighlight text='Hello @"John Doe" how are you?' />)

    const mentionButton = view.getByRole('button', { name: '@"John Doe"' })
    expect(mentionButton).toBeInTheDocument()
  })

  it('highlights current user mentions differently', () => {
    const view = render(<MentionHighlight text="Hello @testuser" />)

    const mentionButton = view.getByRole('button', { name: '@testuser' })
    expect(mentionButton).toHaveClass('bg-primary/15')
    expect(mentionButton).toHaveClass('text-primary')
  })

  it('calls onMentionClick when mention is clicked', () => {
    const mockOnClick = vi.fn()
    const view = render(<MentionHighlight text="Hello @john" onMentionClick={mockOnClick} />)

    const mentionButton = view.getByRole('button', { name: '@john' })
    fireEvent.click(mentionButton)

    expect(mockOnClick).toHaveBeenCalledWith('john')
  })
})

describe('extractMentions', () => {
  it('extracts simple mentions', () => {
    const mentions = extractMentions('Hello @john and @jane')
    expect(mentions).toEqual(['john', 'jane'])
  })

  it('extracts quoted mentions', () => {
    const mentions = extractMentions('Hello @"John Doe" and @jane')
    expect(mentions).toEqual(['John Doe', 'jane'])
  })

  it('returns empty array for text without mentions', () => {
    const mentions = extractMentions('Hello world')
    expect(mentions).toEqual([])
  })
})

describe('containsMention', () => {
  it('returns true when text contains mention', () => {
    expect(containsMention('Hello @john', 'john')).toBe(true)
    expect(containsMention('Hello @"John Doe"', 'John Doe')).toBe(true)
  })

  it('returns false when text does not contain mention', () => {
    expect(containsMention('Hello world', 'john')).toBe(false)
    expect(containsMention('Hello @jane', 'john')).toBe(false)
  })

  it('is case insensitive', () => {
    expect(containsMention('Hello @John', 'john')).toBe(true)
    expect(containsMention('Hello @john', 'John')).toBe(true)
  })
})
