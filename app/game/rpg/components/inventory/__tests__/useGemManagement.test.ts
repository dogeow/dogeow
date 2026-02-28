import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canSocketItem, getGemsInInventory, useGemManagement } from '../useGemManagement'
import { createItem } from './testUtils'

describe('useGemManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters gem items from inventory', () => {
    const items = [
      createItem({
        id: 1,
        definition: { id: 1, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
      }),
      createItem({
        id: 2,
        definition: { id: 2, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
      }),
      createItem({
        id: 3,
        definition: { id: 3, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
      }),
      createItem({
        id: 4,
        definition: { id: 4, name: 'Sapphire', type: 'gem', base_stats: {}, required_level: 1 },
      }),
    ]

    expect(getGemsInInventory(items).map(item => item.id)).toEqual([2, 4])
  })

  it('allows socketing only when the item has free sockets', () => {
    expect(canSocketItem(createItem({ sockets: 0 }))).toBe(false)
    expect(
      canSocketItem(
        createItem({
          sockets: 2,
          gems: [
            {
              id: 1,
              socket_index: 0,
              gemDefinition: {
                id: 9,
                name: 'Ruby',
                type: 'gem',
                base_stats: {},
                required_level: 1,
              },
            },
          ],
        })
      )
    ).toBe(true)
    expect(
      canSocketItem(
        createItem({
          sockets: 1,
          gems: [
            {
              id: 2,
              socket_index: 0,
              gemDefinition: {
                id: 10,
                name: 'Topaz',
                type: 'gem',
                base_stats: {},
                required_level: 1,
              },
            },
          ],
        })
      )
    ).toBe(false)
  })

  it('opens and closes the gem selector around a selected item', () => {
    const item = createItem({ id: 11 })
    const { result } = renderHook(() =>
      useGemManagement({
        inventory: [],
        socketGem: vi.fn(async () => undefined),
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    expect(result.current.showGemSelector).toBe(false)
    expect(result.current.selectedSocketItem).toBeNull()

    act(() => {
      result.current.openGemSelector(item)
    })

    expect(result.current.showGemSelector).toBe(true)
    expect(result.current.selectedSocketItem).toBe(item)

    act(() => {
      result.current.closeGemSelector()
    })

    expect(result.current.showGemSelector).toBe(false)
    expect(result.current.selectedSocketItem).toBeNull()
  })

  it('does not socket when no item is selected', async () => {
    const socketGem = vi.fn(async () => undefined)
    const gem = createItem({
      id: 21,
      definition: { id: 21, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })

    const { result } = renderHook(() =>
      useGemManagement({
        inventory: [gem],
        socketGem,
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    await act(async () => {
      await result.current.handleSocketGem(gem, 0)
    })

    expect(socketGem).not.toHaveBeenCalled()
    expect(result.current.showGemSelector).toBe(false)
  })

  it('sockets a selected gem and clears selector state after completion', async () => {
    const socketGem = vi.fn(async () => undefined)
    const onSocketComplete = vi.fn()
    const item = createItem({ id: 31, sockets: 2 })
    const gem = createItem({
      id: 32,
      definition: { id: 32, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })

    const { result } = renderHook(() =>
      useGemManagement({
        inventory: [gem],
        onSocketComplete,
        socketGem,
        unsocketGem: vi.fn(async () => undefined),
      })
    )

    act(() => {
      result.current.openGemSelector(item)
    })

    await act(async () => {
      await result.current.handleSocketGem(gem, 1)
    })

    expect(socketGem).toHaveBeenCalledWith(item.id, gem.id, 1)
    expect(onSocketComplete).toHaveBeenCalledTimes(1)
    expect(result.current.showGemSelector).toBe(false)
    expect(result.current.selectedSocketItem).toBeNull()
  })

  it('unsockets a gem and triggers completion callback', async () => {
    const unsocketGem = vi.fn(async () => undefined)
    const onUnsocketComplete = vi.fn()
    const item = createItem({ id: 41 })

    const { result } = renderHook(() =>
      useGemManagement({
        inventory: [],
        onUnsocketComplete,
        socketGem: vi.fn(async () => undefined),
        unsocketGem,
      })
    )

    await act(async () => {
      await result.current.handleUnsocketGem(item, 2)
    })

    expect(unsocketGem).toHaveBeenCalledWith(item.id, 2)
    expect(onUnsocketComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores unsocket requests without an item', async () => {
    const unsocketGem = vi.fn(async () => undefined)

    const { result } = renderHook(() =>
      useGemManagement({
        inventory: [],
        socketGem: vi.fn(async () => undefined),
        unsocketGem,
      })
    )

    await act(async () => {
      await result.current.handleUnsocketGem(null, 0)
    })

    expect(unsocketGem).not.toHaveBeenCalled()
  })
})
