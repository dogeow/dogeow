import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInventoryPanelView } from '../useInventoryPanelView'
import { createItem } from './testUtils'

const createDeferred = () => {
  let resolvePromise: () => void = () => {}
  const promise = new Promise<void>(resolve => {
    resolvePromise = resolve
  })

  return { promise, resolve: resolvePromise }
}

describe('useInventoryPanelView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns inventory slots by default and filters by category', () => {
    const inventory = [
      createItem({
        id: 1,
        slot_index: 0,
        definition: { id: 1, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
      }),
      createItem({
        id: 2,
        slot_index: 1,
        definition: { id: 2, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
      }),
    ]

    const { result } = renderHook(() =>
      useInventoryPanelView({
        inventory,
        inventorySize: 3,
        sellItemsByQuality: vi.fn(async () => undefined),
        storage: [],
        storageSize: 2,
      })
    )

    expect(result.current.displaySlots).toHaveLength(3)
    expect(result.current.displaySlots[0]?.item?.id).toBe(1)

    act(() => {
      result.current.setCategoryId('weapon')
    })

    expect(result.current.displaySlots).toHaveLength(1)
    expect(result.current.displaySlots[0]?.item?.id).toBe(1)
  })

  it('switches to storage slots when storage view is enabled', () => {
    const storage = [
      createItem({
        id: 11,
        slot_index: 0,
        definition: {
          id: 11,
          name: 'Stored Ring',
          type: 'ring',
          base_stats: {},
          required_level: 1,
        },
      }),
    ]

    const { result } = renderHook(() =>
      useInventoryPanelView({
        inventory: [],
        inventorySize: 2,
        sellItemsByQuality: vi.fn(async () => undefined),
        storage,
        storageSize: 2,
      })
    )

    act(() => {
      result.current.setShowStorage(true)
    })

    expect(result.current.showStorage).toBe(true)
    expect(result.current.displaySlots[0]?.source).toBe('storage')
    expect(result.current.displaySlots[0]?.item?.id).toBe(11)
  })

  it('computes quality stats while excluding potion and gem items', () => {
    const inventory = [
      createItem({ id: 21, quality: 'common', sell_price: 10, quantity: 2 }),
      createItem({
        id: 22,
        quality: 'rare',
        sell_price: 25,
        definition: { id: 22, name: 'Armor', type: 'armor', base_stats: {}, required_level: 1 },
      }),
      createItem({
        id: 23,
        quality: 'magic',
        sell_price: 99,
        definition: { id: 23, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
      }),
    ]

    const { result } = renderHook(() =>
      useInventoryPanelView({
        inventory,
        inventorySize: 3,
        sellItemsByQuality: vi.fn(async () => undefined),
        storage: [],
        storageSize: 1,
      })
    )

    expect(result.current.qualityStats).toEqual({
      common: { count: 1, totalPrice: 20 },
      rare: { count: 1, totalPrice: 25 },
    })
  })

  it('tracks recycling quality while recycle request is pending and clears it afterwards', async () => {
    const deferred = createDeferred()
    const sellItemsByQuality = vi.fn(() => deferred.promise)

    const { result } = renderHook(() =>
      useInventoryPanelView({
        inventory: [],
        inventorySize: 1,
        sellItemsByQuality,
        storage: [],
        storageSize: 1,
      })
    )

    let recyclePromise: Promise<unknown> | undefined
    await act(async () => {
      recyclePromise = result.current.handleRecycleQuality('rare')
    })

    expect(sellItemsByQuality).toHaveBeenCalledWith('rare')
    expect(result.current.recyclingQuality).toBe('rare')

    await act(async () => {
      deferred.resolve()
      await recyclePromise
    })

    expect(result.current.recyclingQuality).toBeNull()
  })
})
