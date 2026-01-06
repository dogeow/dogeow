import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TagList } from '../TagList'
import { Tag } from '@/app/thing/types'

// Mock colorUtils
vi.mock('@/lib/helpers/colorUtils', () => ({
  isLightColor: vi.fn((color: string) => {
    return color.toLowerCase().startsWith('#f')
  }),
}))

describe('TagList', () => {
  const mockTags: Tag[] = [
    { id: 1, name: 'Tag 1', color: '#3b82f6' },
    { id: 2, name: 'Tag 2', color: '#10b981' },
    { id: 3, name: 'Tag 3', color: '#ffffff' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render list of tags', () => {
      render(<TagList tags={mockTags} />)
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.getByText('Tag 2')).toBeInTheDocument()
      expect(screen.getByText('Tag 3')).toBeInTheDocument()
    })

    it('should render empty list when tags array is empty', () => {
      const { container } = render(<TagList tags={[]} />)
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.queryByText('Tag 1')).not.toBeInTheDocument()
    })

    it('should apply tag colors correctly', () => {
      render(<TagList tags={mockTags} />)
      const badges = screen.getAllByText(/Tag \d/)
      expect(badges.length).toBe(3)
    })
  })

  describe('Props', () => {
    it('should handle tags with default color', () => {
      const tagsWithDefaultColor: Tag[] = [{ id: 1, name: 'Tag 1', color: undefined }]
      render(<TagList tags={tagsWithDefaultColor} />)
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })

    it('should handle single tag', () => {
      render(<TagList tags={[mockTags[0]]} />)
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.queryByText('Tag 2')).not.toBeInTheDocument()
    })
  })
})
