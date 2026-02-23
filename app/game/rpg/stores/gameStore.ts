// 游戏状态管理

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import {
  GameCharacter,
  CombatStats,
  CombatStatsBreakdown,
  CombatMonster,
  CombatResult,
  CombatLog,
  CombatLogDetail,
  GameItem,
  CharacterSkill,
  SkillWithLearnedState,
  MapDefinition,
  CharacterMap,
  EquipmentSlot,
  ShopItem,
  CompendiumItem,
  CompendiumMonster,
  CompendiumMonsterDrops,
  GameMonstersAppearEvent,
  GameCombatUpdateEvent,
  GameLootDroppedEvent,
  GameLevelUpEvent,
} from '../types'
import { apiGet, post, put, del } from '@/lib/api'
import { soundManager } from '../utils/soundManager'

/** 进入地图接口响应 */
interface EnterMapResponse {
  character: GameCharacter
  map: MapDefinition
}

interface GameState {
  // 角色数据
  characters: GameCharacter[]
  character: GameCharacter | null
  selectedCharacterId: number | null
  experienceTable: Record<number, number> // 等级 -> 累计经验，由后端提供
  combatStats: CombatStats | null
  statsBreakdown: CombatStatsBreakdown | null // 攻击/防御等属性明细（基础+装备）
  currentHp: number | null // 当前HP
  currentMana: number | null // 当前Mana
  inventory: GameItem[]
  storage: GameItem[]
  /** 背包格位数（由后端 /rpg/inventory 返回） */
  inventorySize: number
  /** 仓库格位数（由后端 /rpg/inventory 返回） */
  storageSize: number
  equipment: Record<string, GameItem | null>
  skills: SkillWithLearnedState[]
  maps: MapDefinition[]
  currentMap: MapDefinition | null

  // 战斗状态
  isFighting: boolean
  shouldAutoCombat: boolean // 是否应该自动战斗（不管在哪个标签页）
  combatResult: CombatResult | null
  /** 刷新页面时由 combat/status 返回的当前怪物，用于在未收到 WebSocket 回合前显示怪物 */
  currentCombatMonsterFromStatus: {
    monster: { name: string; type: string; level: number; hp?: number; max_hp?: number }
    monsterId: number
    monsters?: CombatMonster[]
  } | null
  combatLogs: (CombatResult | CombatLog)[]
  combatLogDetail: CombatLogDetail | null // 选中的战斗日志详情

  // UI状态
  isLoading: boolean
  error: string | null
  activeTab:
    | 'character'
    | 'inventory'
    | 'skills'
    | 'maps'
    | 'combat'
    | 'shop'
    | 'settings'
    | 'compendium'

  // 商店状态
  shopItems: ShopItem[]
  /** 下次商店装备刷新的时间戳（秒），用于显示"下次刷新" */
  shopNextRefreshAt: number | null

  // 图鉴状态
  compendiumItems: CompendiumItem[]
  compendiumMonsters: CompendiumMonster[]
  compendiumMonsterDrops: CompendiumMonsterDrops | null

  // Actions
  setActiveTab: (
    tab:
      | 'character'
      | 'inventory'
      | 'skills'
      | 'maps'
      | 'combat'
      | 'shop'
      | 'settings'
      | 'compendium'
  ) => void
  fetchCharacters: () => Promise<void>
  selectCharacter: (characterId: number) => Promise<void>
  fetchCharacter: () => Promise<void>
  createCharacter: (
    name: string,
    characterClass: string,
    gender?: 'male' | 'female'
  ) => Promise<void>
  deleteCharacter: (characterId: number) => Promise<void>
  allocateStats: (stats: Record<string, number>) => Promise<void>
  setDifficulty: (difficultyTier: number) => Promise<void>
  setDifficultyForCharacter: (characterId: number, difficultyTier: number) => Promise<void>
  setCharacter: (updater: (prev: GameCharacter | null) => GameCharacter | null) => void

  // 背包操作
  fetchInventory: () => Promise<void>
  equipItem: (itemId: number) => Promise<void>
  unequipItem: (slot: EquipmentSlot) => Promise<void>
  sellItem: (itemId: number, quantity?: number) => Promise<void>
  sellItemsByQuality: (quality: string) => Promise<{ count: number; total_price: number }>
  moveItem: (itemId: number, toStorage: boolean, slotIndex?: number) => Promise<void>
  sortInventory: (sortBy: 'quality' | 'price' | 'default') => Promise<void>
  socketGem: (itemId: number, gemItemId: number, socketIndex: number) => Promise<void>
  unsocketGem: (itemId: number, socketIndex: number) => Promise<void>

  // 技能操作
  fetchSkills: () => Promise<void>
  learnSkill: (skillId: number) => Promise<void>

  // 地图操作
  fetchMaps: () => Promise<void>
  enterMap: (mapId: number) => Promise<void>
  teleportToMap: (mapId: number) => Promise<void>

  // 战斗操作
  fetchCombatStatus: () => Promise<void>
  fetchCombatLogs: () => Promise<void>
  fetchCombatLogDetail: (logId: number) => Promise<void>
  clearCombatLogDetail: () => void
  startCombat: () => Promise<void>
  revive: () => Promise<void>
  stopCombat: () => Promise<void>
  setShouldAutoCombat: (should: boolean) => void // 设置是否应该自动战斗
  /** 已启用的技能 id 列表，可多选；自动战斗时会按顺序尝试施放 */
  enabledSkillIds: number[]
  toggleEnabledSkill: (skillId: number) => void
  consumePotion: (itemId: number) => Promise<void> // 使用药品

  // WebSocket 事件处理
  handleMonstersAppear: (data: unknown) => void // 怪物出现
  handleCombatUpdate: (data: unknown) => void
  handleLootDropped: (data: unknown) => void
  handleLevelUp: (data: unknown) => void
  /** 从 WebSocket inventory.update 直接更新背包/仓库/装备，不再发 HTTP 请求 */
  handleInventoryUpdate: (data: {
    inventory?: GameItem[]
    storage?: GameItem[]
    equipment?: Record<string, GameItem | null>
    inventory_size?: number
    storage_size?: number
  }) => void

  // 商店操作
  fetchShopItems: () => Promise<void>
  refreshShopItems: () => Promise<void>
  buyItem: (itemId: number, quantity?: number) => Promise<void>
  sellItemToShop: (itemId: number, quantity?: number) => Promise<void>

  // 图鉴操作
  fetchCompendiumItems: () => Promise<void>
  fetchCompendiumMonsters: () => Promise<void>
  fetchCompendiumMonsterDrops: (monsterId: number) => Promise<void>
  clearCompendiumMonsterDrops: () => void

  // 工具
  clearError: () => void
  reset: () => void
}

const initialState = {
  characters: [],
  character: null,
  selectedCharacterId: null,
  experienceTable: {} as Record<number, number>,
  combatStats: null,
  statsBreakdown: null,
  currentHp: null,
  currentMana: null,
  inventory: [],
  storage: [],
  inventorySize: 100,
  storageSize: 100,
  equipment: {},
  skills: [],
  availableSkills: [],
  maps: [],
  currentMap: null,
  isFighting: false,
  shouldAutoCombat: false, // 是否应该自动战斗
  enabledSkillIds: [] as number[], // 已启用的技能，可多选
  combatResult: null,
  currentCombatMonsterFromStatus: null,
  combatLogs: [],
  combatLogDetail: null, // 选中的战斗日志详情
  isLoading: false,
  error: null,
  activeTab: 'character' as const,
  shopItems: [],
  shopNextRefreshAt: null,
  compendiumItems: [],
  compendiumMonsters: [],
  compendiumMonsterDrops: null,
}

type CombatLogEntry = CombatResult | CombatLog

type InventoryEquipmentResponse = Record<
  string,
  { slot?: string; item?: GameItem | null } | GameItem | null
>

const COMBAT_DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/ac3282d5-f86a-44d0-8cac-a78210bb3b66'
const COMBAT_DEBUG_HEADERS = {
  'Content-Type': 'application/json',
  'X-Debug-Session-Id': '7eb03a',
}
const COMBAT_DEBUG_BASE = {
  sessionId: '7eb03a',
  hypothesisId: 'H1',
}

const reportCombatDebug = (location: string, message: string, data: Record<string, unknown>) => {
  fetch(COMBAT_DEBUG_ENDPOINT, {
    method: 'POST',
    headers: COMBAT_DEBUG_HEADERS,
    body: JSON.stringify({
      ...COMBAT_DEBUG_BASE,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}

const normalizeEquipmentResponse = (
  equipmentResponse?: InventoryEquipmentResponse
): Record<string, GameItem | null> => {
  const equipment: Record<string, GameItem | null> = {}
  Object.entries(equipmentResponse || {}).forEach(([slot, data]) => {
    equipment[slot] =
      data && typeof data === 'object' && 'item' in data ? (data.item ?? null) : (data ?? null)
  })
  return equipment
}

const extractCombatLogId = (log: CombatLogEntry | GameCombatUpdateEvent): number | null => {
  if ('id' in log && typeof log.id === 'number') return log.id
  if ('combat_log_id' in log && typeof log.combat_log_id === 'number') return log.combat_log_id
  return null
}

const mergeCombatLogsWithUpdate = (
  logs: CombatLogEntry[],
  update: GameCombatUpdateEvent
): CombatLogEntry[] => {
  const updateLogId = extractCombatLogId(update)
  if (updateLogId == null) {
    return logs
  }

  const existingLogIds = new Set<number>(
    logs.map(log => extractCombatLogId(log)).filter((id): id is number => id != null)
  )
  if (existingLogIds.has(updateLogId)) {
    return logs
  }

  const normalizedLog = { ...update, id: updateLogId } as CombatLogEntry
  return [normalizedLog, ...logs].slice(0, 100)
}

const hasPotionUsage = (update: GameCombatUpdateEvent): boolean => {
  const potionUsed = update.potion_used
  return !!(
    potionUsed &&
    ((potionUsed.before && Object.keys(potionUsed.before).length > 0) ||
      (potionUsed.after && Object.keys(potionUsed.after).length > 0))
  )
}

type SetGameState = (updater: (state: GameState) => GameState | Partial<GameState>) => void

const getSelectedCharacterIdOrAbort = (
  getState: () => GameState,
  setState: SetGameState,
  options: { context: string; stopLoading?: boolean; warn?: boolean }
): number | null => {
  const { context, stopLoading = true, warn = true } = options
  const selectedId = getState().selectedCharacterId
  if (selectedId) return selectedId

  if (warn) {
    console.warn(`[GameStore] ${context} - no character selected, skipping`)
  }
  if (stopLoading) {
    setState(state => ({ ...state, isLoading: false }))
  }
  return null
}

const setRequestError = (setState: SetGameState, error: unknown) => {
  setState(state => ({ ...state, error: (error as Error).message, isLoading: false }))
}

const startRequest = (setState: SetGameState, extra: Partial<GameState> = {}) => {
  setState(state => ({ ...state, isLoading: true, error: null, ...extra }))
}

const patchCharacter = (
  character: GameCharacter | null,
  patch: Partial<GameCharacter>
): GameCharacter | null => (character ? { ...character, ...patch } : null)

const withUpdatedCopper = (character: GameCharacter | null, copper: number): GameCharacter | null =>
  patchCharacter(character, { copper })

const withCombatFlag = (state: GameState, isFighting: boolean): Partial<GameState> => ({
  isFighting,
  character: patchCharacter(state.character, { is_fighting: isFighting }),
})

const store: StateCreator<GameState> = (set, get) => ({
  ...initialState,

  setActiveTab: tab => set(state => ({ ...state, activeTab: tab })),

  fetchCharacters: async () => {
    set(state => ({ ...state, error: null }))
    try {
      const response = (await apiGet('/rpg/characters')) as {
        characters: GameCharacter[]
        experience_table?: Record<number, number>
        message?: string
      }
      set(state => ({
        ...state,
        characters: Array.isArray(response?.characters) ? response.characters : [],
        experienceTable: response?.experience_table ?? state.experienceTable,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch characters error:', error)
      set(state => ({
        ...state,
        error: (error as Error).message,
        characters: [],
      }))
    }
  },

  selectCharacter: async characterId => {
    startRequest(set)
    try {
      // 设置选中的角色ID
      set(state => ({ ...state, selectedCharacterId: characterId }))
      // 更新在线时间
      await post('/rpg/character/online', { character_id: characterId })
      // 获取该角色的详细信息
      await get().fetchCharacter()
    } catch (error) {
      console.error('[GameStore] Select character error:', error)
      setRequestError(set, error)
    }
  },

  fetchCharacter: async () => {
    startRequest(set)
    try {
      const selectedId = get().selectedCharacterId
      const params = selectedId ? `?character_id=${selectedId}` : ''
      const response = (await apiGet(`/rpg/character${params}`)) as {
        character: GameCharacter | null
        experience_table?: Record<number, number>
        combat_stats?: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        current_hp?: number
        current_mana?: number
      }
      set(state => ({
        ...state,
        character: response.character,
        experienceTable: response.experience_table ?? state.experienceTable,
        combatStats: response.combat_stats || null,
        statsBreakdown: response.stats_breakdown ?? null,
        currentHp: response.current_hp ?? null,
        currentMana: response.current_mana ?? null,
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch character error:', error)
      setRequestError(set, error)
    }
  },

  createCharacter: async (name, characterClass, gender = 'male') => {
    startRequest(set)
    try {
      const response = (await post('/rpg/character', {
        name,
        class: characterClass,
        gender,
      })) as {
        character: GameCharacter
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      set(state => ({
        ...state,
        characters: [...(state.characters || []), response.character],
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? null,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  deleteCharacter: async characterId => {
    startRequest(set)
    try {
      await del(`/rpg/character?character_id=${characterId}`)
      set(state => {
        const nextCharacters = (state.characters || []).filter(c => c.id !== characterId)
        const wasSelected = state.selectedCharacterId === characterId
        return {
          ...state,
          characters: nextCharacters,
          ...(wasSelected
            ? {
                selectedCharacterId: null,
                character: null,
                combatStats: null,
                statsBreakdown: null,
                currentHp: null,
                currentMana: null,
                inventory: [],
                equipment: {},
                skills: [],
                currentMap: null,
                combatResult: null,
                combatLogs: [],
                isFighting: false,
                shouldAutoCombat: false,
              }
            : {}),
          isLoading: false,
        }
      })
      // 删除角色后清除 localStorage 中的游戏状态
      useGameStore.persist.clearStorage()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  allocateStats: async stats => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'allocateStats',
        warn: false,
      })
      if (!selectedId) return
      const response = (await put('/rpg/character/stats', {
        ...stats,
        character_id: selectedId,
      })) as {
        character: GameCharacter
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        current_hp: number
        current_mana: number
      }
      set(state => ({
        ...state,
        character: response.character,
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? null,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  setDifficulty: async difficultyTier => {
    const selectedId = get().selectedCharacterId
    if (selectedId == null) return
    startRequest(set)
    try {
      const response = (await put('/rpg/character/difficulty', {
        character_id: selectedId,
        difficulty_tier: difficultyTier,
      })) as { character: GameCharacter }
      set(state => ({
        ...state,
        character: state.character
          ? { ...state.character, ...response.character }
          : response.character,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  setDifficultyForCharacter: async (characterId, difficultyTier) => {
    set(state => ({ ...state, error: null }))
    try {
      const response = (await put('/rpg/character/difficulty', {
        character_id: characterId,
        difficulty_tier: difficultyTier,
      })) as { character: GameCharacter }
      set(state => ({
        ...state,
        characters: (state.characters ?? []).map(c =>
          c.id === characterId ? { ...c, difficulty_tier: response.character.difficulty_tier } : c
        ),
        character:
          state.character?.id === characterId
            ? { ...state.character, difficulty_tier: response.character.difficulty_tier }
            : state.character,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message }))
    }
  },

  setCharacter: updater => {
    set(state => ({
      ...state,
      character: updater(state.character),
    }))
  },

  fetchInventory: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchInventory' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/inventory${params}`)) as {
        inventory: GameItem[]
        storage: GameItem[]
        equipment: Record<string, { slot: string; item: GameItem | null }>
        inventory_size?: number
        storage_size?: number
      }
      const equipment = normalizeEquipmentResponse(response.equipment)
      set(state => ({
        ...state,
        inventory: response.inventory || [],
        storage: response.storage || [],
        inventorySize:
          typeof response.inventory_size === 'number'
            ? response.inventory_size
            : state.inventorySize,
        storageSize:
          typeof response.storage_size === 'number' ? response.storage_size : state.storageSize,
        equipment,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  equipItem: async itemId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'equipItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/equip', {
        item_id: itemId,
        character_id: selectedId,
      })) as {
        equipped_item: GameItem
        equipped_slot: string
        unequipped_item: GameItem | null
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      soundManager.play('equip')

      const currentInventory = get().inventory
      const updatedInventory = [...currentInventory]
      if (response.unequipped_item) {
        updatedInventory.push(response.unequipped_item)
      }
      const filteredInventory = updatedInventory.filter(i => i.id !== itemId)

      set(state => ({
        ...state,
        inventory: filteredInventory,
        equipment: {
          ...state.equipment,
          [response.equipped_slot]: response.equipped_item,
        },
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  unequipItem: async slot => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'unequipItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/unequip', {
        slot,
        character_id: selectedId,
      })) as {
        item: GameItem
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      set(state => ({
        ...state,
        inventory: [...state.inventory, response.item],
        equipment: {
          ...state.equipment,
          [slot]: null,
        },
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  socketGem: async (itemId, gemItemId, socketIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'socketGem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/gems/socket', {
        item_id: itemId,
        gem_item_id: gemItemId,
        socket_index: socketIndex,
        character_id: selectedId,
      })) as {
        equipment: GameItem
        message: string
      }

      // 更新背包中的装备
      set(state => {
        const newInventory = state.inventory.map(item =>
          item.id === itemId ? response.equipment : item
        )
        // 移除已使用的宝石
        const newInv = newInventory.filter(item => item.id !== gemItemId)
        return {
          ...state,
          inventory: newInv,
          isLoading: false,
        }
      })
    } catch (error) {
      setRequestError(set, error)
    }
  },

  unsocketGem: async (itemId, socketIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'unsocketGem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/gems/unsocket', {
        item_id: itemId,
        socket_index: socketIndex,
        character_id: selectedId,
      })) as {
        equipment: GameItem
        message: string
      }

      // 更新背包中的装备
      set(state => {
        const newInventory = state.inventory.map(item =>
          item.id === itemId ? response.equipment : item
        )
        return {
          ...state,
          inventory: newInventory,
          isLoading: false,
        }
      })
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sellItem: async (itemId, quantity = 1) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sellItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/sell', {
        item_id: itemId,
        quantity,
        character_id: selectedId,
      })) as { copper: number; sell_price: number }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        inventory: state.inventory.filter(i => i.id !== itemId),
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sellItemsByQuality: async (quality: string) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sellItemsByQuality',
        warn: false,
      })
      if (!selectedId) return { count: 0, total_price: 0 }
      const response = (await post('/rpg/inventory/sell-by-quality', {
        quality,
        character_id: selectedId,
      })) as { count: number; total_price: number; copper: number }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        inventory: state.inventory.filter(
          i =>
            i.quality !== quality || i.definition?.type === 'potion' || i.definition?.type === 'gem'
        ),
        isLoading: false,
      }))
      return { count: response.count, total_price: response.total_price }
    } catch (error) {
      setRequestError(set, error)
      return { count: 0, total_price: 0 }
    }
  },

  moveItem: async (itemId, toStorage, slotIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'moveItem',
        warn: false,
      })
      if (!selectedId) return
      await post('/rpg/inventory/move', {
        item_id: itemId,
        to_storage: toStorage,
        slot_index: slotIndex,
        character_id: selectedId,
      })
      // 重新获取背包
      get().fetchInventory()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sortInventory: async sortBy => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sortInventory',
        warn: false,
      })
      if (!selectedId) return
      await post('/rpg/inventory/sort', {
        sort_by: sortBy,
        character_id: selectedId,
      })
      // 重新获取背包
      get().fetchInventory()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchSkills: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchSkills' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/skills${params}`)) as {
        skills: SkillWithLearnedState[]
        skill_points: number
      }
      const skills = response.skills ?? []

      // 获取所有已学习的主动技能 ID，用于默认启用
      const learnedActiveSkillIds = skills
        .filter(s => s.is_learned && s.type === 'active')
        .map(s => s.id)

      // 获取当前已启用的技能 ID，如果是首次加载则默认启用所有主动技能
      const currentEnabledIds = get().enabledSkillIds
      const enabledSkillIds =
        currentEnabledIds.length > 0 ? currentEnabledIds : learnedActiveSkillIds

      set(state => ({
        ...state,
        skills,
        character: patchCharacter(state.character, { skill_points: response.skill_points }),
        enabledSkillIds,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  learnSkill: async skillId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'learnSkill',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/skills/learn', {
        skill_id: skillId,
        character_id: selectedId,
      })) as { character_skill?: CharacterSkill; skill_points: number }
      const cs = response.character_skill
      set(state => {
        if (!cs) {
          return {
            ...state,
            character: patchCharacter(state.character, { skill_points: response.skill_points }),
            isLoading: false,
          }
        }
        const nextSkills = state.skills.map(s =>
          s.id === cs.skill_id
            ? {
                ...s,
                is_learned: true,
                character_skill_id: cs.id,
                level: cs.level ?? 1,
                slot_index: cs.slot_index ?? null,
              }
            : s
        )
        // 查找刚学习的技能，如果是主动技能则自动启用
        const learnedSkill = state.skills.find(s => s.id === cs.skill_id)
        const isNewActiveSkill = learnedSkill && learnedSkill.type === 'active'
        const newEnabledSkillIds = isNewActiveSkill
          ? [...state.enabledSkillIds, cs.skill_id]
          : state.enabledSkillIds
        return {
          ...state,
          skills: nextSkills,
          character: patchCharacter(state.character, { skill_points: response.skill_points }),
          enabledSkillIds: newEnabledSkillIds,
          isLoading: false,
        }
      })
      if (!cs) {
        get().fetchSkills()
      }
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchMaps: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchMaps' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/maps${params}`)) as {
        maps: MapDefinition[]
        progress: Record<number, CharacterMap>
        current_map_id: number | null
      }
      const currentMap = response.current_map_id
        ? response.maps.find(m => m.id === response.current_map_id) || null
        : null
      set(state => ({
        ...state,
        maps: response.maps || [],
        currentMap,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  enterMap: async mapId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'enterMap',
        warn: false,
      })
      if (!selectedId) return
      const response = await post<EnterMapResponse>('/rpg/maps/' + mapId + '/enter', {
        character_id: selectedId,
      })
      soundManager.play('teleport') // 使用传送音效
      const maps = get().maps
      const currentMap = maps.find(m => m.id === mapId) || null
      set(state => ({
        ...state,
        currentMap,
        character: response.character,
        isFighting: true, // 后端已自动开始战斗
        shouldAutoCombat: true,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  teleportToMap: async mapId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'teleportToMap',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/maps/' + mapId + '/teleport', {
        character_id: selectedId,
      })) as {
        character: GameCharacter
      }
      soundManager.play('skill_use')
      const maps = get().maps
      const currentMap = maps.find(m => m.id === mapId) || null
      const char = response.character
      set(state => ({
        ...state,
        currentMap,
        character: char,
        isFighting: true, // 后端已自动开始战斗
        shouldAutoCombat: true,
        isLoading: false,
        // 复活时后端只恢复基础生命/法力，用返回的 character 更新当前 HP/MP 显示
        currentHp: char?.current_hp ?? state.currentHp,
        currentMana: char?.current_mana ?? state.currentMana,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchCombatStatus: async () => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatStatus',
        stopLoading: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/status${params}`)) as {
        is_fighting: boolean
        current_map: MapDefinition | null
        combat_stats: CombatStats
        current_hp: number
        current_mana: number
        last_combat_at: string | null
        current_combat_monster?: {
          id: number
          name: string
          type: string
          level: number
          hp: number
          max_hp: number
        }
        current_combat_monsters?: (CombatMonster | null)[]
      }
      const fromStatus =
        response.is_fighting && response.current_combat_monster
          ? {
              monster: {
                name: response.current_combat_monster.name,
                type: response.current_combat_monster.type,
                level: response.current_combat_monster.level,
                hp: response.current_combat_monster.hp,
                max_hp: response.current_combat_monster.max_hp,
              },
              monsterId: response.current_combat_monster.id,
              monsters: response.current_combat_monsters
                ? response.current_combat_monsters.filter((m): m is CombatMonster => m !== null)
                : undefined,
            }
          : null
      set(state => ({
        ...state,
        isFighting: response.is_fighting,
        currentMap: response.current_map,
        combatStats: response.combat_stats,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
        currentCombatMonsterFromStatus: fromStatus,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat status error:', error)
    }
  },

  fetchCombatLogs: async () => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatLogs',
        stopLoading: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/logs${params}`)) as {
        logs: CombatLog[]
      }
      set(state => ({
        ...state,
        combatLogs: response.logs || [],
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat logs error:', error)
    }
  },

  // 获取单条战斗日志详情
  fetchCombatLogDetail: async (logId: number) => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatLogDetail',
        stopLoading: false,
        warn: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/logs/${logId}${params}`)) as {
        log: CombatLogDetail
      }
      set(state => ({
        ...state,
        combatLogDetail: response.log || null,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat log detail error:', error)
    }
  },

  // 清除战斗日志详情
  clearCombatLogDetail: () => {
    set(state => ({
      ...state,
      combatLogDetail: null,
    }))
  },

  startCombat: async () => {
    startRequest(set, { combatResult: null })
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'startCombat',
        warn: true,
      })
      const enabledIds = get().enabledSkillIds
      if (!selectedId) return
      const body: { character_id: number; skill_ids?: number[] } = { character_id: selectedId }
      if (enabledIds.length > 0) body.skill_ids = enabledIds
      reportCombatDebug('gameStore.ts:startCombat:before', 'calling combat/start', {
        characterId: selectedId,
        skillIds: body.skill_ids,
      })
      const response = await post<{ message?: string }>('/rpg/combat/start', body)
      reportCombatDebug('gameStore.ts:startCombat:after', 'combat/start success', {
        characterId: selectedId,
      })
      // 如果是复活（角色已死亡），刷新角色数据
      if (response.message?.includes('复活')) {
        await get().fetchCharacter()
      } else {
        soundManager.play('combat_start')
      }
      set(state => ({
        ...state,
        ...withCombatFlag(state, true),
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  /** 复活角色，不自动开始战斗 */
  revive: async () => {
    // 立即清空战斗结果和战斗状态，避免界面继续显示死亡前的怪物
    startRequest(set, {
      combatResult: null,
      currentCombatMonsterFromStatus: null,
      isFighting: false,
      shouldAutoCombat: false,
    })
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'revive',
        warn: false,
      })
      if (!selectedId) return
      await post('/rpg/combat/start', { character_id: selectedId })
      // 刷新角色数据
      await get().fetchCharacter()
      // 复活后不自动开始战斗，并清空上次战斗结果，避免继续显示怪物头像/HP
      set(state => ({
        ...state,
        ...withCombatFlag(state, false),
        shouldAutoCombat: false,
        combatResult: null,
        currentCombatMonsterFromStatus: null,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  stopCombat: async () => {
    try {
      const selectedId = get().selectedCharacterId
      if (selectedId) {
        await post('/rpg/combat/stop', { character_id: selectedId })
      }
    } finally {
      set(state => ({
        ...state,
        enabledSkillIds: [],
        ...withCombatFlag(state, false),
        shouldAutoCombat: false,
        combatResult: null,
        currentCombatMonsterFromStatus: null,
      }))
    }
  },

  setShouldAutoCombat: (should: boolean) => {
    set(state => ({ ...state, shouldAutoCombat: should }))
  },

  toggleEnabledSkill: async (skillId: number) => {
    const wasFighting = get().isFighting
    set(state => {
      const ids = state.enabledSkillIds
      const has = ids.includes(skillId)
      return {
        ...state,
        enabledSkillIds: has ? ids.filter(id => id !== skillId) : [...ids, skillId],
      }
    })
    // 战斗进行中时，同步更新后端技能配置
    if (wasFighting) {
      const selectedId = get().selectedCharacterId
      const enabledIds = get().enabledSkillIds
      if (selectedId) {
        try {
          // 传 skill_id 参数让后端识别是单个技能操作
          await post('/rpg/combat/skills', {
            character_id: selectedId,
            skill_id: skillId,
            skill_ids: enabledIds,
          })
        } catch (error) {
          console.error('[GameStore] Failed to update combat skills:', error)
        }
      }
    }
  },

  consumePotion: async (itemId: number) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'consumePotion',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/use-potion', {
        item_id: itemId,
        character_id: selectedId,
      })) as {
        character: GameCharacter
        combat_stats: CombatStats
        current_hp: number
        current_mana: number
        message: string
      }
      soundManager.play('potion')
      set(state => ({
        ...state,
        character: response.character,
        combatStats: response.combat_stats,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
        isLoading: false,
      }))
      // 背包由 WebSocket inventory.update 推送更新
    } catch (error) {
      setRequestError(set, error)
    }
  },

  // WebSocket 事件处理
  // 处理怪物出现事件
  handleMonstersAppear: data => {
    const typedData = data as GameMonstersAppearEvent
    if (!get().isFighting) return

    const currentHp = typedData.character?.current_hp ?? get().currentHp
    const currentMana = typedData.character?.current_mana ?? get().currentMana

    set(state => ({
      ...state,
      currentCombatMonsterFromStatus: {
        monster: { name: '', type: 'normal', level: 1 },
        monsterId: 0,
        monsters: typedData.monsters || [],
      },
      currentHp,
      currentMana,
    }))
  },

  handleCombatUpdate: data => {
    const typedData = data as GameCombatUpdateEvent
    // 复活或停止战斗后可能仍会收到延迟的战斗推送，不再更新 combatResult，避免继续显示怪物
    if (!get().isFighting) return

    if (typedData.defeat || typedData.auto_stopped) {
      soundManager.play('combat_defeat')
    } else {
      soundManager.play('combat_hit')
    }

    const usedPotion = hasPotionUsage(typedData)

    set(state => {
      // 优先使用顶层字段，其次使用 character 对象中的字段
      // 只有当值存在时才更新（避免用 null 覆盖正确的值）
      const newCurrentHp =
        typedData.current_hp ?? typedData.character?.current_hp ?? state.currentHp
      const newCurrentMana =
        typedData.current_mana ?? typedData.character?.current_mana ?? state.currentMana

      const dataLogId = extractCombatLogId(typedData)
      const newLogs = mergeCombatLogsWithUpdate(state.combatLogs, typedData)

      return {
        combatResult: typedData,
        combatLogs: newLogs,
        character: typedData.character,
        // 只有当新值存在且不为 undefined 时才更新
        ...(newCurrentHp !== undefined && { currentHp: newCurrentHp }),
        ...(newCurrentMana !== undefined && { currentMana: newCurrentMana }),
        // 使用药水时背包会在后面刷新
        inventory: usedPotion
          ? state.inventory
          : typedData.loot?.item
            ? [...state.inventory, typedData.loot.item as GameItem]
            : state.inventory,
        // 战败时自动停止战斗
        ...(typedData.auto_stopped && {
          isFighting: false,
          shouldAutoCombat: false,
          enabledSkillIds: [],
        }),
      }
    })

    // 背包由 WebSocket inventory.update 推送，不再在此处请求 fetchInventory
  },

  handleInventoryUpdate: data => {
    set(state => ({
      ...state,
      inventory: data.inventory ?? state.inventory,
      storage: data.storage ?? state.storage,
      equipment: data.equipment ?? state.equipment,
      inventorySize:
        typeof data.inventory_size === 'number' ? data.inventory_size : state.inventorySize,
      storageSize: typeof data.storage_size === 'number' ? data.storage_size : state.storageSize,
    }))
  },

  handleLootDropped: data => {
    const typedData = data as GameLootDroppedEvent
    soundManager.play('item_drop')
    set(state => ({
      inventory: typedData.item
        ? [...state.inventory, typedData.item as GameItem]
        : state.inventory,
      character: state.character
        ? {
            ...state.character,
            copper: (state.character.copper || 0) + (typedData.copper || 0),
            current_hp: typedData.character?.current_hp ?? state.character.current_hp,
            current_mana: typedData.character?.current_mana ?? state.character.current_mana,
          }
        : null,
    }))
  },

  handleLevelUp: data => {
    const typedData = data as GameLevelUpEvent
    soundManager.play('level_up')
    set(state => ({
      ...state,
      character: typedData.character,
      currentHp: typedData.character?.current_hp ?? state.currentHp,
      currentMana: typedData.character?.current_mana ?? state.currentMana,
    }))
  },

  clearError: () => set(state => ({ ...state, error: null })),

  reset: () => set(initialState),

  // 商店操作
  fetchShopItems: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchShopItems' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/shop${params}`)) as {
        items: ShopItem[]
        player_copper: number
        next_refresh_at?: number
      }
      set(state => ({
        ...state,
        shopItems: response.items || [],
        shopNextRefreshAt: response.next_refresh_at ?? null,
        character: withUpdatedCopper(state.character, response.player_copper),
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch shop items error:', error)
      setRequestError(set, error)
    }
  },

  refreshShopItems: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return
    startRequest(set)
    try {
      const response = (await post('/rpg/shop/refresh', {
        character_id: selectedId,
      })) as {
        items: ShopItem[]
        player_copper: number
        next_refresh_at?: number
      }
      set(state => ({
        ...state,
        shopItems: response.items ?? [],
        shopNextRefreshAt: response.next_refresh_at ?? null,
        character: withUpdatedCopper(state.character, response.player_copper),
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Refresh shop error:', error)
      setRequestError(set, error)
    }
  },

  buyItem: async (itemId: number, quantity = 1) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'buyItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/shop/buy', {
        item_id: itemId,
        quantity,
        character_id: selectedId,
      })) as {
        copper: number
        total_price: number
        quantity: number
        item_name: string
      }
      soundManager.play('gold')
      // 更新金币和重新获取背包
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        isLoading: false,
      }))
      // 背包由 WebSocket inventory.update 推送
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sellItemToShop: async (itemId: number, quantity = 1) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sellItemToShop',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/shop/sell', {
        item_id: itemId,
        quantity,
        character_id: selectedId,
      })) as {
        copper: number
        sell_price: number
        quantity: number
        item_name: string
      }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        inventory: state.inventory.filter(i => i.id !== itemId),
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  // 图鉴操作
  fetchCompendiumItems: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return

    startRequest(set)
    try {
      const response = (await apiGet(`/rpg/compendium/items?character_id=${selectedId}`)) as {
        items: CompendiumItem[]
        total: number
        discovered_count: number
      }
      set(state => ({
        ...state,
        compendiumItems: response.items || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium items error:', error)
      setRequestError(set, error)
    }
  },

  fetchCompendiumMonsters: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return

    startRequest(set)
    try {
      const response = (await apiGet(`/rpg/compendium/monsters?character_id=${selectedId}`)) as {
        monsters: CompendiumMonster[]
        total: number
        discovered_count: number
      }
      set(state => ({
        ...state,
        compendiumMonsters: response.monsters || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium monsters error:', error)
      setRequestError(set, error)
    }
  },

  fetchCompendiumMonsterDrops: async (monsterId: number) => {
    try {
      const response = (await apiGet(
        `/rpg/compendium/monsters/${monsterId}/drops`
      )) as CompendiumMonsterDrops
      set(state => ({
        ...state,
        compendiumMonsterDrops: response,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium monster drops error:', error)
      set(state => ({ ...state, error: (error as Error).message }))
    }
  },

  clearCompendiumMonsterDrops: () => {
    set(state => ({ ...state, compendiumMonsterDrops: null }))
  },
})

export const useGameStore = create<GameState>()(
  persist(store, {
    name: 'rpg-game-storage',
    // 只持久化必要的 UI 状态，不持久化频繁变化的游戏数据
    partialize: state => ({
      selectedCharacterId: state.selectedCharacterId,
      activeTab: state.activeTab,
    }),
    skipHydration: true, // 跳过自动 hydration，手动控制
  })
)

// 手动触发 hydration
if (typeof window !== 'undefined') {
  useGameStore.persist.rehydrate()
}
