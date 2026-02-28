import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInventoryPanelActions } from '../useInventoryPanelActions'
import { createItem } from './testUtils'

describe('useInventoryPanelActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sells a single item immediately without opening confirmation', async () => {
    const sellItem = vi.fn(async () => undefined)
    const item = createItem({ id: 11, quantity: 1 })

    const { result } = renderHook(() =>
      useInventoryPanelActions({
        consumePotion: vi.fn(async () => undefined),
        equipItem: vi.fn(async () => undefined),
        inventory: [],
        moveItem: vi.fn(async () => undefined),
        sellItem,
        socketGem: vi.fn(async () => undefined),
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    await act(async () => {
      await result.current.handleSell(item)
    })

    expect(sellItem).toHaveBeenCalledWith(item.id, 1)
    expect(result.current.showSellConfirm).toBe(false)
    expect(result.current.selectedItem).toBeNull()
  })

  it('opens sell confirmation for stacked items and confirms with the chosen quantity', async () => {
    const sellItem = vi.fn(async () => undefined)
    const item = createItem({ id: 12, quantity: 5 })

    const { result } = renderHook(() =>
      useInventoryPanelActions({
        consumePotion: vi.fn(async () => undefined),
        equipItem: vi.fn(async () => undefined),
        inventory: [],
        moveItem: vi.fn(async () => undefined),
        sellItem,
        socketGem: vi.fn(async () => undefined),
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    await act(async () => {
      await result.current.handleSell(item)
    })

    expect(result.current.showSellConfirm).toBe(true)
    expect(result.current.selectedItem).toBe(item)
    expect(result.current.sellQuantity).toBe(1)

    act(() => {
      result.current.setSellQuantity(3)
    })

    await act(async () => {
      await result.current.handleSellConfirm()
    })

    expect(sellItem).toHaveBeenCalledWith(item.id, 3)
    expect(result.current.showSellConfirm).toBe(false)
    expect(result.current.selectedItem).toBeNull()
  })

  it('routes compare sell through the provided item instead of current selection', async () => {
    const item = createItem({ id: 13, quantity: 2 })

    const { result } = renderHook(() =>
      useInventoryPanelActions({
        consumePotion: vi.fn(async () => undefined),
        equipItem: vi.fn(async () => undefined),
        inventory: [],
        moveItem: vi.fn(async () => undefined),
        sellItem: vi.fn(async () => undefined),
        socketGem: vi.fn(async () => undefined),
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    await act(async () => {
      result.current.handleCompareAction('sell', item)
    })

    expect(result.current.selectedItem).toBe(item)
    expect(result.current.showSellConfirm).toBe(true)
  })

  it('routes compare socket and unsocket actions through gem management', async () => {
    const unsocketGem = vi.fn(async () => undefined)
    const socketableItem = createItem({ id: 14, sockets: 1 })
    const socketedItem = createItem({
      id: 15,
      sockets: 1,
      gems: [
        {
          id: 41,
          socket_index: 0,
          gemDefinition: { id: 41, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
        },
      ],
    })

    const { result } = renderHook(() =>
      useInventoryPanelActions({
        consumePotion: vi.fn(async () => undefined),
        equipItem: vi.fn(async () => undefined),
        inventory: [],
        moveItem: vi.fn(async () => undefined),
        sellItem: vi.fn(async () => undefined),
        socketGem: vi.fn(async () => undefined),
        unsocketGem,
      })
    )

    act(() => {
      result.current.handleCompareAction('socket', socketableItem)
    })

    expect(result.current.showGemSelector).toBe(true)
    expect(result.current.selectedSocketItem).toBe(socketableItem)

    await act(async () => {
      result.current.handleCompareAction('unsocket', socketedItem)
    })

    expect(unsocketGem).toHaveBeenCalledWith(socketedItem.id, 0)
  })
})
