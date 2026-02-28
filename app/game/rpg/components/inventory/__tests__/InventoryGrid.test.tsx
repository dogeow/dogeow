import type { ComponentProps } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InventoryGrid } from '../InventoryGrid'
import { createItem } from './testUtils'

vi.mock('@/components/ui/popover', async () => {
  const { createPopoverMock } = await import('./testComponentMocks')

  return createPopoverMock({ rootTestId: 'popover-root' })
})

vi.mock('@/components/game', async () => {
  const { createInventoryGameMock } = await import('./testComponentMocks')

  return createInventoryGameMock()
})

vi.mock('../InventoryItemDetailCard', async () => {
  const { createInventoryItemDetailCardMock } = await import('./testComponentMocks')

  return createInventoryItemDetailCardMock()
})

vi.mock('../ItemSocketIndicators', async () => {
  const { createItemSocketIndicatorsMock } = await import('./testComponentMocks')

  return createItemSocketIndicatorsMock()
})

type InventoryGridProps = ComponentProps<typeof InventoryGrid>

const createBaseProps = (overrides: Partial<InventoryGridProps> = {}): InventoryGridProps => ({
  canSocket: vi.fn<InventoryGridProps['canSocket']>(() => false),
  canUnsocket: vi.fn<InventoryGridProps['canUnsocket']>(() => false),
  displaySlots: [],
  gemsInInventoryCount: 0,
  getCompareActions: vi.fn<InventoryGridProps['getCompareActions']>(() => ['equip', 'sell']),
  getEquippedItem: vi.fn<InventoryGridProps['getEquippedItem']>(() => null),
  getEquippedRings: vi.fn<InventoryGridProps['getEquippedRings']>(() => []),
  handleCompareAction: vi.fn<InventoryGridProps['handleCompareAction']>(),
  hasEquippedItem: vi.fn<InventoryGridProps['hasEquippedItem']>(() => false),
  isLoading: false,
  onEquip: vi.fn<InventoryGridProps['onEquip']>(),
  onMove: vi.fn<InventoryGridProps['onMove']>(),
  onOpenGemSelector: vi.fn<InventoryGridProps['onOpenGemSelector']>(),
  onSelectedItemChange: vi.fn<InventoryGridProps['onSelectedItemChange']>(),
  onSell: vi.fn<InventoryGridProps['onSell']>(),
  onUnsocketGem: vi.fn<InventoryGridProps['onUnsocketGem']>(),
  onUsePotion: vi.fn<InventoryGridProps['onUsePotion']>(),
  selectedItemId: null,
  ...overrides,
})

describe('InventoryGrid', () => {
  it('renders inventory equipment actions and dispatches callbacks', async () => {
    const user = userEvent.setup()
    const item = createItem({
      id: 11,
      quantity: 2,
      sockets: 1,
      gems: [
        {
          id: 91,
          socket_index: 0,
          gemDefinition: {
            id: 101,
            name: 'Ruby',
            type: 'gem',
            base_stats: {},
            required_level: 1,
          },
        },
      ],
    })
    const canSocket = vi.fn<InventoryGridProps['canSocket']>(() => true)
    const canUnsocket = vi.fn<InventoryGridProps['canUnsocket']>(() => true)
    const props = createBaseProps({
      canSocket,
      canUnsocket,
      displaySlots: [{ item, source: 'inventory' }],
      gemsInInventoryCount: 2,
      selectedItemId: item.id,
    })

    const view = render(<InventoryGrid {...props} />)

    await user.click(view.getByRole('button', { name: '装备' }))
    await user.click(view.getByRole('button', { name: '镶嵌' }))
    await user.click(view.getByRole('button', { name: '取下' }))
    await user.click(view.getByRole('button', { name: '存入' }))
    await user.click(view.getByRole('button', { name: '出售' }))
    await user.click(view.getByRole('button', { name: /icon-11/i }))

    expect(props.onEquip).toHaveBeenCalledTimes(1)
    expect(props.onOpenGemSelector).toHaveBeenCalledWith(item)
    expect(props.onUnsocketGem).toHaveBeenCalledWith(0)
    expect(props.onMove).toHaveBeenCalledWith(true)
    expect(props.onSell).toHaveBeenCalledTimes(1)
    expect(props.onSelectedItemChange).toHaveBeenCalledWith(null)
  })

  it('renders potion-specific actions without equip', async () => {
    const user = userEvent.setup()
    const item = createItem({
      id: 12,
      definition: {
        id: 12,
        name: 'Potion',
        type: 'potion',
        base_stats: {},
        required_level: 1,
      },
    })
    const props = createBaseProps({
      displaySlots: [{ item, source: 'inventory' }],
      selectedItemId: item.id,
    })

    const view = render(<InventoryGrid {...props} />)

    expect(view.getByRole('button', { name: '使用' })).toBeInTheDocument()
    expect(view.queryByRole('button', { name: '装备' })).not.toBeInTheDocument()

    await user.click(view.getByRole('button', { name: '使用' }))

    expect(props.onUsePotion).toHaveBeenCalledTimes(1)
  })

  it('renders storage actions without inventory-only buttons', async () => {
    const user = userEvent.setup()
    const item = createItem({ id: 13 })
    const props = createBaseProps({
      displaySlots: [{ item, source: 'storage' }],
      selectedItemId: item.id,
    })

    const view = render(<InventoryGrid {...props} />)

    expect(view.getByRole('button', { name: '取回' })).toBeInTheDocument()
    expect(view.queryByRole('button', { name: '出售' })).not.toBeInTheDocument()
    expect(view.queryByRole('button', { name: '装备' })).not.toBeInTheDocument()
    expect(view.queryByRole('button', { name: '使用' })).not.toBeInTheDocument()

    await user.click(view.getByRole('button', { name: '取回' }))

    expect(props.onMove).toHaveBeenCalledWith(false)
  })

  it('renders compare panel and forwards compare actions', async () => {
    const user = userEvent.setup()
    const item = createItem({ id: 14 })
    const equipped = createItem({ id: 15 })
    const hasEquippedItem = vi.fn<InventoryGridProps['hasEquippedItem']>(() => true)
    const getEquippedItem = vi.fn<InventoryGridProps['getEquippedItem']>(() => equipped)
    const getCompareActions = vi.fn<InventoryGridProps['getCompareActions']>(() => [
      'equip',
      'sell',
    ])
    const props = createBaseProps({
      displaySlots: [{ item, source: 'inventory' }],
      selectedItemId: item.id,
      hasEquippedItem,
      getEquippedItem,
      getCompareActions,
    })

    const view = render(<InventoryGrid {...props} />)

    expect(view.getByTestId('compare-panel')).toBeInTheDocument()
    expect(view.queryByRole('button', { name: '出售' })).not.toBeInTheDocument()

    await user.click(view.getByRole('button', { name: 'compare-sell' }))

    expect(props.handleCompareAction).toHaveBeenCalledWith('sell', item)
  })
})
