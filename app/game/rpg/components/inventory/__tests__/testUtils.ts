import { vi } from 'vitest'
import type { EquipmentSlot, GameItem } from '../../../types'

export const createItem = (overrides: Partial<GameItem> = {}): GameItem => {
  const definitionId = overrides.definition?.id ?? overrides.definition_id ?? 1

  return {
    id: overrides.id ?? 1,
    character_id: overrides.character_id ?? 1,
    definition_id: overrides.definition_id ?? definitionId,
    definition: {
      id: definitionId,
      name: overrides.definition?.name ?? 'Test Item',
      type: overrides.definition?.type ?? 'weapon',
      sub_type: overrides.definition?.sub_type,
      base_stats: overrides.definition?.base_stats ?? {},
      required_level: overrides.definition?.required_level ?? 1,
      icon: overrides.definition?.icon,
      description: overrides.definition?.description,
      buy_price: overrides.definition?.buy_price ?? 100,
    },
    quality: overrides.quality ?? 'common',
    stats: overrides.stats ?? {},
    affixes: overrides.affixes ?? [],
    is_in_storage: overrides.is_in_storage ?? false,
    quantity: overrides.quantity ?? 1,
    slot_index: overrides.slot_index ?? null,
    sell_price: overrides.sell_price ?? 50,
    sockets: overrides.sockets,
    gems: overrides.gems,
  }
}

export const createEquipment = (
  overrides: Partial<Record<EquipmentSlot, GameItem | null>> = {}
): Record<EquipmentSlot, GameItem | null> => ({
  weapon: null,
  helmet: null,
  armor: null,
  gloves: null,
  boots: null,
  belt: null,
  ring: null,
  amulet: null,
  ...overrides,
})

export const createGemManagementState = (overrides: Record<string, unknown> = {}) => ({
  closeGemSelector: vi.fn(),
  gemsInInventory: [],
  handleSocketGem: vi.fn(),
  handleUnsocketGem: vi.fn(),
  openGemSelector: vi.fn(),
  selectedSocketItem: null,
  showGemSelector: false,
  ...overrides,
})

export interface InventoryPanelStoreState {
  consumePotion: ReturnType<typeof vi.fn>
  equipItem: ReturnType<typeof vi.fn>
  equipment: Record<string, GameItem | null>
  inventory: GameItem[]
  inventorySize: number
  isLoading: boolean
  moveItem: ReturnType<typeof vi.fn>
  sellItem: ReturnType<typeof vi.fn>
  sellItemsByQuality: ReturnType<typeof vi.fn>
  socketGem: ReturnType<typeof vi.fn>
  sortInventory: ReturnType<typeof vi.fn>
  storage: GameItem[]
  storageSize: number
  unsocketGem: ReturnType<typeof vi.fn>
}

export const createInventoryPanelStoreState = (
  overrides: Partial<InventoryPanelStoreState> = {}
): InventoryPanelStoreState => ({
  consumePotion: vi.fn(async () => undefined),
  equipItem: vi.fn(async () => undefined),
  equipment: {},
  inventory: [],
  inventorySize: 6,
  isLoading: false,
  moveItem: vi.fn(async () => undefined),
  sellItem: vi.fn(async () => undefined),
  sellItemsByQuality: vi.fn(async () => undefined),
  socketGem: vi.fn(async () => undefined),
  sortInventory: vi.fn(),
  storage: [],
  storageSize: 4,
  unsocketGem: vi.fn(async () => undefined),
  ...overrides,
})
