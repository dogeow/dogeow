import { describe, expect, it } from 'vitest'
import {
  buildSlotArray,
  canUnsocketItem,
  computeQualityStats,
  filterSlotsByCategory,
  getCategoryById,
  toSlotCells,
} from '../inventoryUtils'
import { createItem } from './testUtils'

describe('inventoryUtils', () => {
  it('returns empty category for blank or unknown ids', () => {
    expect(getCategoryById('').types).toBeNull()
    expect(getCategoryById('missing').types).toBeNull()
  })

  it('returns the expected category for known ids', () => {
    expect(getCategoryById('weapon').types).toEqual(['weapon'])
  })

  it('builds slot arrays using slot_index and ignores out-of-range slots', () => {
    const slotted = createItem({ id: 1, slot_index: 1 })
    const ignored = createItem({ id: 2, slot_index: 8 })

    expect(buildSlotArray([slotted, ignored], 3)).toEqual([null, slotted, null])
  })

  it('converts slots to slot cells and filters by category', () => {
    const weapon = createItem({
      id: 1,
      definition: { id: 1, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const potion = createItem({
      id: 2,
      definition: { id: 2, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
    })
    const slots = toSlotCells([weapon, null, potion], 'inventory')

    expect(filterSlotsByCategory(slots, ['weapon'])).toEqual([
      { item: weapon, source: 'inventory' },
    ])
    expect(filterSlotsByCategory(slots, null)).toEqual(slots)
  })

  it('computes quality stats and excludes potion and gem items', () => {
    const commonWeapon = createItem({
      id: 1,
      quality: 'common',
      quantity: 2,
      sell_price: 30,
      definition: { id: 1, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const rareArmor = createItem({
      id: 2,
      quality: 'rare',
      quantity: 1,
      sell_price: 120,
      definition: { id: 2, name: 'Armor', type: 'armor', base_stats: {}, required_level: 1 },
    })
    const potion = createItem({
      id: 3,
      definition: { id: 3, name: 'Potion', type: 'potion', base_stats: {}, required_level: 1 },
    })
    const gem = createItem({
      id: 4,
      definition: { id: 4, name: 'Gem', type: 'gem', base_stats: {}, required_level: 1 },
    })

    expect(computeQualityStats([commonWeapon, rareArmor, potion, gem])).toEqual({
      common: { count: 1, totalPrice: 60 },
      rare: { count: 1, totalPrice: 120 },
    })
  })

  it('allows unsocket only for common items with gems', () => {
    const commonWithGem = createItem({
      quality: 'common',
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
    const commonWithoutGem = createItem({ quality: 'common', gems: [] })
    const rareWithGem = createItem({ quality: 'rare', gems: commonWithGem.gems })

    expect(canUnsocketItem(commonWithGem)).toBe(true)
    expect(canUnsocketItem(commonWithoutGem)).toBe(false)
    expect(canUnsocketItem(rareWithGem)).toBe(false)
  })
})
