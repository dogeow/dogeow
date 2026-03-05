import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationComboboxSelectSimple from '../LocationComboboxSelectSimple'

const mockHooks = vi.hoisted(() => ({
  loadRooms: vi.fn(),
  loadSpots: vi.fn(),
  setAreas: vi.fn(),
  setRooms: vi.fn(),
  setSpots: vi.fn(),
}))

vi.mock('../location/hooks/useLocationData', () => ({
  useLocationData: () => ({
    areas: [{ id: 1, name: '客厅' }],
    rooms: [{ id: 1, name: '主卧', area_id: 1 }],
    spots: [{ id: 1, name: '书桌', room_id: 1 }],
    loading: false,
    setAreas: mockHooks.setAreas,
    setRooms: mockHooks.setRooms,
    setSpots: mockHooks.setSpots,
    loadRooms: mockHooks.loadRooms,
    loadSpots: mockHooks.loadSpots,
  }),
}))

vi.mock('../location/hooks/useAutoScroll', () => ({
  useAutoScroll: vi.fn(),
}))

vi.mock('../location/hooks/useLocationCreation', () => ({
  useLocationCreation: () => ({
    handleCreateArea: vi.fn(),
    handleCreateRoom: vi.fn(),
    handleCreateSpot: vi.fn(),
  }),
}))

vi.mock('../location/utils/pathUtils', () => ({
  buildPathFromSelection: (areaId: string, roomId: string, spotId: string) =>
    [areaId, roomId, spotId].filter(Boolean).join('>'),
}))

vi.mock('../location/components/LocationSelectField', () => ({
  LocationSelectField: ({ label, onChange, disabled }: any) => (
    <div>
      <div>{label}</div>
      <div>{disabled ? 'disabled' : 'enabled'}</div>
      <button type="button" onClick={() => onChange('')}>
        {label}-clear
      </button>
      <button type="button" onClick={() => onChange('1')}>
        {label}-one
      </button>
      <button type="button" onClick={() => onChange('999')}>
        {label}-unknown
      </button>
    </div>
  ),
}))

describe('LocationComboboxSelectSimple callbacks', () => {
  const onSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('covers room/spot clear fallback paths when upper levels are missing', async () => {
    const user = userEvent.setup()
    render(<LocationComboboxSelectSimple onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '房间-clear' }))
    await user.click(screen.getByRole('button', { name: '具体位置（可选）-clear' }))

    expect(onSelect).toHaveBeenCalledWith('area', 0, '')

    await user.click(screen.getByRole('button', { name: '区域-one' }))
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('area', 1, '客厅')
    })

    await user.click(screen.getByRole('button', { name: '具体位置（可选）-clear' }))
    expect(onSelect).toHaveBeenCalledWith('area', 1, '客厅')
  })

  it('ignores unknown room/spot ids while keeping callbacks stable', async () => {
    const user = userEvent.setup()
    render(<LocationComboboxSelectSimple onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '区域-one' }))
    await user.click(screen.getByRole('button', { name: '房间-unknown' }))
    await user.click(screen.getByRole('button', { name: '具体位置（可选）-unknown' }))

    expect(onSelect).not.toHaveBeenCalledWith('room', 999, expect.any(String))
    expect(onSelect).not.toHaveBeenCalledWith('spot', 999, expect.any(String))
  })
})
