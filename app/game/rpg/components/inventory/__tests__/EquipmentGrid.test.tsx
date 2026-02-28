import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameItem } from '../../../types'
import { EquipmentGrid } from '../EquipmentGrid'
import { createEquipment, createGemManagementState, createItem } from './testUtils'

const mockUseGameStore = vi.hoisted(() => vi.fn())
const mockUseGemManagement = vi.hoisted(() => vi.fn())

vi.mock('@/components/ui/popover', async () => {
  const { createPopoverMock } = await import('./testComponentMocks')

  return createPopoverMock()
})

vi.mock('@/components/game', async () => {
  const { createEquipmentGameMock } = await import('./testComponentMocks')

  return createEquipmentGameMock()
})

vi.mock('../../../stores/gameStore', () => ({
  useGameStore: mockUseGameStore,
}))

vi.mock('../GemSelectorDialog', () => ({
  GemSelectorDialog: ({ isOpen, socketItem }: { isOpen: boolean; socketItem: GameItem | null }) =>
    isOpen ? (
      <div data-testid="gem-selector">{socketItem?.definition?.name ?? 'no-item'}</div>
    ) : null,
}))

vi.mock('../InventoryItemDetailCard', async () => {
  const { createInventoryItemDetailCardMock } = await import('./testComponentMocks')

  return createInventoryItemDetailCardMock()
})

vi.mock('../ItemSocketIndicators', async () => {
  const { createItemSocketIndicatorsMock } = await import('./testComponentMocks')

  return createItemSocketIndicatorsMock()
})

vi.mock('../useGemManagement', () => ({
  canSocketItem: (item: GameItem) => {
    if (!item.sockets || item.sockets <= 0) return false
    return (item.gems?.length ?? 0) < item.sockets
  },
  useGemManagement: mockUseGemManagement,
}))

describe('EquipmentGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseGameStore.mockReturnValue({
      inventory: [],
      isLoading: false,
      socketGem: vi.fn(async () => undefined),
      unsocketGem: vi.fn(async () => undefined),
    })
    mockUseGemManagement.mockReturnValue(createGemManagementState())
  })

  it('unequips the selected slot and closes the detail card', async () => {
    const user = userEvent.setup()
    const onUnequip = vi.fn()
    const item = createItem({
      id: 11,
      definition: {
        id: 11,
        name: 'Equipped Item',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })

    const view = render(
      <EquipmentGrid equipment={createEquipment({ weapon: item })} onUnequip={onUnequip} />
    )

    await user.click(view.getByRole('button', { name: /icon-11/i }))
    expect(view.getByTestId('detail-card')).toBeInTheDocument()

    await user.click(view.getByRole('button', { name: '卸下' }))

    expect(onUnequip).toHaveBeenCalledWith('weapon')
    expect(view.queryByTestId('detail-card')).not.toBeInTheDocument()
  })

  it('opens the gem selector for socketable equipment', async () => {
    const user = userEvent.setup()
    const gem = createItem({
      id: 21,
      definition: { id: 21, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })
    const item = createItem({
      id: 12,
      sockets: 1,
      definition: {
        id: 12,
        name: 'Equipped Item',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })
    const gemManagement = createGemManagementState({
      gemsInInventory: [gem],
      selectedSocketItem: item,
      showGemSelector: true,
    })
    mockUseGemManagement.mockReturnValue(gemManagement)

    const view = render(
      <EquipmentGrid equipment={createEquipment({ weapon: item })} onUnequip={vi.fn()} />
    )

    expect(view.getByTestId('gem-selector')).toHaveTextContent('Equipped Item')

    await user.click(view.getByRole('button', { name: /icon-12/i }))
    await user.click(view.getByRole('button', { name: '镶嵌' }))

    expect(gemManagement.openGemSelector).toHaveBeenCalledWith(item)
  })

  it('unsockets the chosen gem from the selected item', async () => {
    const user = userEvent.setup()
    const item = createItem({
      id: 13,
      sockets: 2,
      definition: {
        id: 13,
        name: 'Equipped Item',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
      gems: [
        {
          id: 31,
          socket_index: 0,
          gemDefinition: { id: 31, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
        },
      ],
    })
    const gemManagement = createGemManagementState()
    mockUseGemManagement.mockReturnValue(gemManagement)

    const view = render(
      <EquipmentGrid equipment={createEquipment({ weapon: item })} onUnequip={vi.fn()} />
    )

    await user.click(view.getByRole('button', { name: /icon-13/i }))
    await user.click(view.getByRole('button', { name: /Ruby/i }))

    expect(gemManagement.handleUnsocketGem).toHaveBeenCalledWith(item, 0)
  })

  it('renders slot labels for empty equipment slots', () => {
    const view = render(<EquipmentGrid equipment={createEquipment()} onUnequip={vi.fn()} />)

    expect(view.getByRole('button', { name: '头盔' })).toBeDisabled()
    expect(view.getByRole('button', { name: '戒指' })).toBeDisabled()
    expect(view.getByRole('button', { name: '护符' })).toBeDisabled()
  })
})
