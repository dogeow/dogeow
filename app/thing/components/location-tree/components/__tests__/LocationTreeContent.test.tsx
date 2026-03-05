import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationTreeContent } from '../LocationTreeContent'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'location.no_results': '没有匹配的位置',
          'location.no_available': '没有可用的位置',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}))

vi.mock('../AreaNode', () => ({
  AreaNode: ({
    area,
    isSelected,
    isExpanded,
    onSelect,
    onToggle,
    children,
  }: {
    area: { id: number }
    isSelected: boolean
    isExpanded: boolean
    onSelect: () => void
    onToggle: (e: React.MouseEvent) => void
    children: React.ReactNode
  }) => (
    <div
      data-testid={`area-${area.id}`}
      data-selected={String(isSelected)}
      data-expanded={String(isExpanded)}
    >
      <button onClick={onSelect}>{`area-select-${area.id}`}</button>
      <button onClick={onToggle}>{`area-toggle-${area.id}`}</button>
      {children}
    </div>
  ),
}))

vi.mock('../RoomNode', () => ({
  RoomNode: ({
    room,
    isSelected,
    onSelect,
    onToggle,
    showAreaName,
    areaName,
    children,
  }: {
    room: { id: number }
    isSelected: boolean
    onSelect: () => void
    onToggle?: (e: React.MouseEvent) => void
    showAreaName?: boolean
    areaName?: string
    children: React.ReactNode
  }) => (
    <div data-testid={`room-${room.id}`} data-selected={String(isSelected)}>
      <button onClick={onSelect}>{`room-select-${room.id}`}</button>
      {onToggle ? <button onClick={onToggle}>{`room-toggle-${room.id}`}</button> : null}
      {showAreaName && areaName ? <span>{areaName}</span> : null}
      {children}
    </div>
  ),
}))

vi.mock('../SpotNode', () => ({
  SpotNode: ({
    spot,
    isSelected,
    onSelect,
  }: {
    spot: { id: number }
    isSelected: boolean
    onSelect: () => void
  }) => (
    <div data-testid={`spot-${spot.id}`} data-selected={String(isSelected)}>
      <button onClick={onSelect}>{`spot-select-${spot.id}`}</button>
    </div>
  ),
}))

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 202, name: 'Desk', room_id: 22 },
]

const createProps = (overrides: Partial<React.ComponentProps<typeof LocationTreeContent>> = {}) => {
  return {
    filteredAreas: areas,
    filteredRooms: rooms,
    filteredSpots: spots,
    visibleAreaIds: [1],
    visibleRoomIds: [11],
    rooms,
    spots,
    filterType: null,
    searchTerm: '',
    selectedLocation: undefined,
    expandedAreas: new Set<number>(),
    expandedRooms: new Set<number>(),
    onSelect: vi.fn(),
    onToggleArea: vi.fn(),
    onToggleRoom: vi.fn(),
    getRoomAreaName: (room: { area_id: number }) => `区域-${room.area_id}`,
    isSelected: () => false,
    ...overrides,
  }
}

describe('LocationTreeContent', () => {
  it('shows no-results message when all filtered lists are empty and search term exists', () => {
    const props = createProps({
      filteredAreas: [],
      filteredRooms: [],
      filteredSpots: [],
      searchTerm: 'abc',
    })

    render(<LocationTreeContent {...props} />)
    expect(screen.getByText('没有匹配的位置')).toBeInTheDocument()
  })

  it('shows no-available message when all filtered lists are empty and search term is empty', () => {
    const props = createProps({
      filteredAreas: [],
      filteredRooms: [],
      filteredSpots: [],
      searchTerm: '',
    })

    render(<LocationTreeContent {...props} />)
    expect(screen.getByText('没有可用的位置')).toBeInTheDocument()
  })

  it('renders area->room->spot tree and triggers select/toggle callbacks', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggleArea = vi.fn()
    const onToggleRoom = vi.fn()
    const isSelected = (type: 'area' | 'room' | 'spot', id: number) => type === 'spot' && id === 101

    const props = createProps({ onSelect, onToggleArea, onToggleRoom, isSelected })
    render(<LocationTreeContent {...props} />)

    expect(screen.getByTestId('area-1')).toBeInTheDocument()
    expect(screen.getByTestId('area-2')).toBeInTheDocument()
    expect(screen.getByTestId('room-11')).toBeInTheDocument()
    expect(screen.queryByTestId('room-22')).not.toBeInTheDocument()
    expect(screen.getByTestId('spot-101')).toHaveAttribute('data-selected', 'true')

    await user.click(screen.getByRole('button', { name: 'area-select-1' }))
    await user.click(screen.getByRole('button', { name: 'room-select-11' }))
    await user.click(screen.getByRole('button', { name: 'spot-select-101' }))
    await user.click(screen.getByRole('button', { name: 'area-toggle-1' }))
    await user.click(screen.getByRole('button', { name: 'room-toggle-11' }))

    expect(onSelect).toHaveBeenCalledWith('area', 1)
    expect(onSelect).toHaveBeenCalledWith('room', 11)
    expect(onSelect).toHaveBeenCalledWith('spot', 101)
    expect(onToggleArea).toHaveBeenCalledTimes(1)
    expect(onToggleRoom).toHaveBeenCalledTimes(1)
  })

  it('hides nested spots when filterType is area', () => {
    const props = createProps({ filterType: 'area' as const })
    render(<LocationTreeContent {...props} />)

    expect(screen.getByTestId('room-11')).toBeInTheDocument()
    expect(screen.queryByTestId('spot-101')).not.toBeInTheDocument()
  })

  it('filters nested spots by non-empty search term (match case)', () => {
    const props = createProps({
      filterType: null,
      searchTerm: '沙发',
      visibleAreaIds: [1],
      visibleRoomIds: [11],
    })

    render(<LocationTreeContent {...props} />)
    expect(screen.getByTestId('spot-101')).toBeInTheDocument()
  })

  it('filters nested spots by non-empty search term (non-match case)', () => {
    const props = createProps({
      filterType: null,
      searchTerm: 'not-match',
      visibleAreaIds: [1],
      visibleRoomIds: [11],
    })

    render(<LocationTreeContent {...props} />)
    expect(screen.queryByTestId('spot-101')).not.toBeInTheDocument()
  })

  it('renders direct room list when filterType is room and filters spots by search term', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const props = createProps({
      filterType: 'room' as const,
      filteredAreas: [],
      filteredRooms: [rooms[1]],
      visibleRoomIds: [22],
      searchTerm: 'desk',
      onSelect,
    })

    render(<LocationTreeContent {...props} />)

    expect(screen.getByTestId('room-22')).toBeInTheDocument()
    expect(screen.getByText('区域-2')).toBeInTheDocument()
    expect(screen.getByTestId('spot-202')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'room-select-22' }))
    await user.click(screen.getByRole('button', { name: 'spot-select-202' }))
    expect(onSelect).toHaveBeenCalledWith('room', 22)
    expect(onSelect).toHaveBeenCalledWith('spot', 202)
  })

  it('hides direct room spots when search term does not match', () => {
    const props = createProps({
      filterType: 'room' as const,
      filteredAreas: [],
      filteredRooms: [rooms[1]],
      visibleRoomIds: [22],
      searchTerm: 'not-match',
    })

    render(<LocationTreeContent {...props} />)
    expect(screen.getByTestId('room-22')).toBeInTheDocument()
    expect(screen.queryByTestId('spot-202')).not.toBeInTheDocument()
  })
})
