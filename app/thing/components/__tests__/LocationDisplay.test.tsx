import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationDisplay } from '../LocationDisplay'
import { Spot } from '@/app/thing/types'

describe('LocationDisplay', () => {
  describe('Rendering', () => {
    it('should return null when spot is not provided', () => {
      const { container } = render(<LocationDisplay spot={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should return null when spot is undefined', () => {
      const { container } = render(<LocationDisplay spot={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render full location path', () => {
      const spot: Spot = {
        id: 1,
        name: 'Desk',
        room: {
          id: 1,
          name: 'Office',
          area: {
            id: 1,
            name: 'Building A',
          },
        },
      } as Spot

      render(<LocationDisplay spot={spot} />)
      expect(screen.getByText(/Building A > Office > Desk/)).toBeInTheDocument()
    })

    it('should render location with only spot name', () => {
      const spot: Spot = {
        id: 1,
        name: 'Desk',
      } as Spot

      render(<LocationDisplay spot={spot} />)
      expect(screen.getByText('Desk')).toBeInTheDocument()
    })

    it('should render location with room and spot', () => {
      const spot: Spot = {
        id: 1,
        name: 'Desk',
        room: {
          id: 1,
          name: 'Office',
        },
      } as Spot

      render(<LocationDisplay spot={spot} />)
      expect(screen.getByText(/Office > Desk/)).toBeInTheDocument()
    })

    it('should return null when spot has no name', () => {
      const spot: Spot = {
        id: 1,
      } as Spot

      const { container } = render(<LocationDisplay spot={spot} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Props', () => {
    it('should handle spot with only area', () => {
      const spot: Spot = {
        id: 1,
        name: 'Desk',
        room: {
          id: 1,
          area: {
            id: 1,
            name: 'Building A',
          },
        },
      } as Spot

      render(<LocationDisplay spot={spot} />)
      expect(screen.getByText(/Building A > Desk/)).toBeInTheDocument()
    })
  })
})
