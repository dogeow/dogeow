import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryPanel } from '../InventoryPanel'
import { createEquipment, createInventoryPanelStoreState, createItem } from './testUtils'

const mockUseGameStore = vi.hoisted(() => vi.fn())

vi.mock('@/components/ui/popover', async () => {
  const { createPopoverMock } = await import('./testComponentMocks')

  return createPopoverMock({ respectOpen: true })
})

vi.mock('@/components/game', async () => {
  const { createInventoryGameMock } = await import('./testComponentMocks')

  return createInventoryGameMock()
})

vi.mock('../../../stores/gameStore', () => ({
  useGameStore: mockUseGameStore,
}))

vi.mock('../GameItemSlot', async () => {
  const { createGameItemSlotMock } = await import('./testComponentMocks')

  return createGameItemSlotMock()
})

vi.mock('../InventoryItemDetailCard', async () => {
  const { createInventoryItemDetailCardMock } = await import('./testComponentMocks')

  return createInventoryItemDetailCardMock()
})

describe('InventoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wires toolbar controls to sorting, recycling, filtering, and storage switching', async () => {
    const user = userEvent.setup()
    const sword = createItem({
      id: 1,
      slot_index: 0,
      quality: 'common',
      sell_price: 20,
      definition: { id: 1, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const potion = createItem({
      id: 2,
      slot_index: 1,
      quality: 'magic',
      definition: { id: 2, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
    })
    const storedRing = createItem({
      id: 3,
      slot_index: 0,
      is_in_storage: true,
      definition: { id: 3, name: 'Stored Ring', type: 'ring', base_stats: {}, required_level: 1 },
    })
    const store = createInventoryPanelStoreState({
      inventory: [sword, potion],
      inventorySize: 4,
      storage: [storedRing],
      storageSize: 2,
    })
    mockUseGameStore.mockReturnValue(store)

    const view = render(<InventoryPanel />)

    expect(view.getByRole('button', { name: 'Sword' })).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Potion' })).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'Stored Ring' })).not.toBeInTheDocument()

    await user.click(view.getByRole('button', { name: '排序' }))
    await user.click(view.getByRole('button', { name: '价格' }))
    expect(store.sortInventory).toHaveBeenCalledWith('price')

    await user.click(view.getByRole('button', { name: /普通/ }))
    await waitFor(() => {
      expect(store.sellItemsByQuality).toHaveBeenCalledWith('common')
    })

    await user.click(view.getByRole('button', { name: /武器/ }))
    expect(view.getByRole('button', { name: 'Sword' })).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'Potion' })).not.toBeInTheDocument()

    await user.click(view.getByRole('button', { name: '全部' }))
    await user.click(view.getByRole('button', { name: /仓库/ }))

    expect(view.getByRole('button', { name: 'Stored Ring' })).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'Sword' })).not.toBeInTheDocument()
  })

  it('runs sell confirmation and gem socket flows through the composed panel', async () => {
    const user = userEvent.setup()
    const sword = createItem({
      id: 11,
      slot_index: 0,
      sockets: 1,
      definition: { id: 11, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const ruby = createItem({
      id: 12,
      slot_index: 1,
      definition: { id: 12, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })
    const potion = createItem({
      id: 13,
      slot_index: 2,
      quantity: 5,
      definition: { id: 13, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
    })
    const store = createInventoryPanelStoreState({
      inventory: [sword, ruby, potion],
      inventorySize: 4,
    })
    mockUseGameStore.mockReturnValue(store)

    const view = render(<InventoryPanel />)

    await user.click(view.getByRole('button', { name: 'Potion' }))
    await user.click(view.getByRole('button', { name: '出售' }))
    await user.click(view.getByRole('button', { name: '+' }))
    await user.click(view.getByRole('button', { name: '+' }))
    await user.click(view.getByRole('button', { name: '确认出售' }))

    await waitFor(() => {
      expect(store.sellItem).toHaveBeenCalledWith(potion.id, 3)
    })

    await user.click(view.getByRole('button', { name: 'Sword' }))
    await user.click(view.getByRole('button', { name: '镶嵌' }))
    await user.click(view.getByTitle('Ruby'))

    await waitFor(() => {
      expect(store.socketGem).toHaveBeenCalledWith(sword.id, ruby.id, 0)
    })
  })

  it('routes compare panel sell and socket actions through inventory panel handlers', async () => {
    const user = userEvent.setup()
    const equippedSword = createItem({
      id: 20,
      definition: {
        id: 20,
        name: 'Equipped Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })
    const sword = createItem({
      id: 21,
      quantity: 2,
      slot_index: 0,
      sockets: 1,
      definition: { id: 21, name: 'New Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const ruby = createItem({
      id: 22,
      slot_index: 1,
      definition: { id: 22, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })
    const store = createInventoryPanelStoreState({
      equipment: createEquipment({ weapon: equippedSword }),
      inventory: [sword, ruby],
      inventorySize: 4,
    })
    mockUseGameStore.mockReturnValue(store)

    const view = render(<InventoryPanel />)

    await user.click(view.getByRole('button', { name: 'New Sword' }))
    await user.click(view.getByRole('button', { name: 'compare-sell' }))
    await user.click(view.getByRole('button', { name: '确认出售' }))

    await waitFor(() => {
      expect(store.sellItem).toHaveBeenCalledWith(sword.id, 1)
    })

    await user.click(view.getByRole('button', { name: 'New Sword' }))
    await user.click(view.getByRole('button', { name: 'compare-socket' }))
    await user.click(view.getByTitle('Ruby'))

    await waitFor(() => {
      expect(store.socketGem).toHaveBeenCalledWith(sword.id, ruby.id, 0)
    })
  })

  it('routes compare unsocket actions through inventory panel handlers', async () => {
    const user = userEvent.setup()
    const equippedSword = createItem({
      id: 30,
      definition: {
        id: 30,
        name: 'Equipped Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })
    const socketedSword = createItem({
      id: 31,
      quality: 'common',
      slot_index: 0,
      sockets: 1,
      definition: {
        id: 31,
        name: 'Socketed Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
      gems: [
        {
          id: 301,
          socket_index: 0,
          gemDefinition: {
            id: 401,
            name: 'Ruby',
            type: 'gem',
            base_stats: {},
            required_level: 1,
          },
        },
      ],
    })
    const store = createInventoryPanelStoreState({
      equipment: createEquipment({ weapon: equippedSword }),
      inventory: [socketedSword],
      inventorySize: 4,
    })
    mockUseGameStore.mockReturnValue(store)

    const view = render(<InventoryPanel />)

    await user.click(view.getByRole('button', { name: 'Socketed Sword' }))
    await user.click(view.getByRole('button', { name: 'compare-unsocket' }))

    await waitFor(() => {
      expect(store.unsocketGem).toHaveBeenCalledWith(socketedSword.id, 0)
    })
  })

  it('routes compare equip and store actions through inventory panel handlers', async () => {
    const user = userEvent.setup()
    const equippedSword = createItem({
      id: 40,
      definition: {
        id: 40,
        name: 'Equipped Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })
    const newSword = createItem({
      id: 41,
      slot_index: 0,
      definition: {
        id: 41,
        name: 'Upgrade Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
    })
    const store = createInventoryPanelStoreState({
      equipment: createEquipment({ weapon: equippedSword }),
      inventory: [newSword],
      inventorySize: 4,
    })
    mockUseGameStore.mockReturnValue(store)

    const view = render(<InventoryPanel />)

    await user.click(view.getByRole('button', { name: 'Upgrade Sword' }))
    await user.click(view.getByRole('button', { name: 'compare-equip' }))

    await waitFor(() => {
      expect(store.equipItem).toHaveBeenCalledWith(newSword.id)
    })

    await user.click(view.getByRole('button', { name: 'Upgrade Sword' }))
    await user.click(view.getByRole('button', { name: 'compare-store' }))

    await waitFor(() => {
      expect(store.moveItem).toHaveBeenCalledWith(newSword.id, true)
    })
  })
})
