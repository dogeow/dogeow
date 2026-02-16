// 游戏状态管理

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import {
  GameCharacter,
  CombatStats,
  CombatStatsBreakdown,
  GameItem,
  CharacterSkill,
  SkillDefinition,
  SkillWithLearnedState,
  MapDefinition,
  CharacterMap,
  CombatResult,
  CombatLog,
  EquipmentSlot,
  ShopItem,
  CompendiumItem,
  CompendiumMonster,
  CompendiumMonsterDrops,
} from '../types'
import { apiGet, post, put, del, ApiRequestError } from '@/lib/api'
import { soundManager } from '../utils/soundManager'

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
  mapProgress: Record<number, CharacterMap>
  currentMap: MapDefinition | null

  // 战斗状态
  isFighting: boolean
  shouldAutoCombat: boolean // 是否应该自动战斗（不管在哪个标签页）
  combatResult: CombatResult | null
  combatLogs: (CombatResult | CombatLog)[]

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
  createCharacter: (name: string, characterClass: string) => Promise<void>
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
  moveItem: (itemId: number, toStorage: boolean, slotIndex?: number) => Promise<void>

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
  startCombat: () => Promise<void>
  stopCombat: () => Promise<void>
  executeCombat: () => Promise<void>
  setShouldAutoCombat: (should: boolean) => void // 设置是否应该自动战斗
  /** 已启用的技能 id 列表，可多选；自动战斗时会按顺序尝试施放 */
  enabledSkillIds: number[]
  toggleEnabledSkill: (skillId: number) => void
  consumePotion: (itemId: number) => Promise<void> // 使用药品

  // WebSocket 事件处理
  handleCombatUpdate: (data: any) => void
  handleLootDropped: (data: any) => void
  handleLevelUp: (data: any) => void

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
  mapProgress: {},
  currentMap: null,
  isFighting: false,
  shouldAutoCombat: false, // 是否应该自动战斗
  enabledSkillIds: [] as number[], // 已启用的技能，可多选
  combatResult: null,
  combatLogs: [],
  isLoading: false,
  error: null,
  activeTab: 'character' as const,
  shopItems: [],
  shopNextRefreshAt: null,
  compendiumItems: [],
  compendiumMonsters: [],
  compendiumMonsterDrops: null,
}

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
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      console.log('[GameStore] Selecting character:', characterId)
      // 设置选中的角色ID
      set(state => ({ ...state, selectedCharacterId: characterId }))
      // 获取该角色的详细信息
      await get().fetchCharacter()
    } catch (error) {
      console.error('[GameStore] Select character error:', error)
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  fetchCharacter: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      console.log('[GameStore] Fetching character...')
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
      console.log('[GameStore] Character response:', response)
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  createCharacter: async (name, characterClass) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const response = (await post('/rpg/character', {
        name,
        class: characterClass,
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  deleteCharacter: async characterId => {
    set(state => ({ ...state, isLoading: true, error: null }))
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
                mapProgress: {},
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
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  allocateStats: async stats => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  setDifficulty: async difficultyTier => {
    const selectedId = get().selectedCharacterId
    if (selectedId == null) return
    set(state => ({ ...state, isLoading: true, error: null }))
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
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
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] fetchInventory - no character selected, skipping')
        set(state => ({ ...state, isLoading: false }))
        return
      }
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/inventory${params}`)) as {
        inventory: GameItem[]
        storage: GameItem[]
        equipment: Record<string, { slot: string; item: GameItem | null }>
        inventory_size?: number
        storage_size?: number
      }
      const equipment: Record<string, GameItem | null> = {}
      Object.entries(response.equipment || {}).forEach(([slot, data]) => {
        equipment[slot] = data && 'item' in data ? data.item : null
      })
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  equipItem: async itemId => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  unequipItem: async slot => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  sellItem: async (itemId, quantity = 1) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
      const response = (await post('/rpg/inventory/sell', {
        item_id: itemId,
        quantity,
        character_id: selectedId,
      })) as { copper: number; sell_price: number }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: state.character ? { ...state.character, copper: response.copper } : null,
        inventory: state.inventory.filter(i => i.id !== itemId),
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  moveItem: async (itemId, toStorage, slotIndex) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
      await post('/rpg/inventory/move', {
        item_id: itemId,
        to_storage: toStorage,
        slot_index: slotIndex,
        character_id: selectedId,
      })
      // 重新获取背包
      get().fetchInventory()
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  fetchSkills: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] fetchSkills - no character selected, skipping')
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
        character: state.character
          ? { ...state.character, skill_points: response.skill_points }
          : null,
        enabledSkillIds,
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  learnSkill: async skillId => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
      const response = (await post('/rpg/skills/learn', {
        skill_id: skillId,
        character_id: selectedId,
      })) as { character_skill?: CharacterSkill; skill_points: number }
      const cs = response.character_skill
      set(state => {
        if (!cs) {
          return {
            ...state,
            character: state.character
              ? { ...state.character, skill_points: response.skill_points }
              : null,
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
          character: state.character
            ? { ...state.character, skill_points: response.skill_points }
            : null,
          enabledSkillIds: newEnabledSkillIds,
          isLoading: false,
        }
      })
      if (!cs) {
        get().fetchSkills()
      }
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  fetchMaps: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] fetchMaps - no character selected, skipping')
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
        mapProgress: response.progress || {},
        currentMap,
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  enterMap: async mapId => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
      const response = (await (post as any)('/rpg/maps/' + mapId + '/enter', {
        character_id: selectedId,
      })) as {
        character: GameCharacter
        map: MapDefinition
      }
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  teleportToMap: async mapId => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  fetchCombatStatus: async () => {
    try {
      const selectedId = get().selectedCharacterId
      console.log('[GameStore] fetchCombatStatus - selectedCharacterId:', selectedId)
      if (!selectedId) {
        console.warn('[GameStore] fetchCombatStatus - no character selected, skipping')
        return
      }
      const params = `?character_id=${selectedId}`
      console.log('[GameStore] fetchCombatStatus - params:', params)
      const response = (await apiGet(`/rpg/combat/status${params}`)) as {
        is_fighting: boolean
        current_map: MapDefinition | null
        combat_stats: CombatStats
        current_hp: number
        current_mana: number
        last_combat_at: string | null
      }
      console.log('[GameStore] fetchCombatStatus - response:', response)
      set(state => ({
        ...state,
        isFighting: response.is_fighting,
        currentMap: response.current_map,
        combatStats: response.combat_stats,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat status error:', error)
    }
  },

  fetchCombatLogs: async () => {
    try {
      console.log('[GameStore] Fetching combat logs...')
      console.log('[GameStore] Current character:', get().character?.id)
      console.log('[GameStore] Selected character ID:', get().selectedCharacterId)
      const selectedId = get().selectedCharacterId
      console.log('[GameStore] fetchCombatLogs - selectedId:', selectedId)
      if (!selectedId) {
        console.warn('[GameStore] fetchCombatLogs - no character selected, skipping')
        return
      }
      const params = `?character_id=${selectedId}`
      console.log('[GameStore] fetchCombatLogs - params:', params)
      const response = (await apiGet(`/rpg/combat/logs${params}`)) as {
        logs: CombatLog[]
      }
      console.log('[GameStore] Combat logs response:', response)
      console.log('[GameStore] Logs array:', response?.logs)
      console.log('[GameStore] Logs count:', response?.logs?.length)
      console.log('[GameStore] First log:', response?.logs?.[0])
      set(state => ({
        ...state,
        combatLogs: response.logs || [],
      }))
      console.log('[GameStore] Combat logs state updated')
    } catch (error) {
      console.error('[GameStore] Fetch combat logs error:', error)
    }
  },

  startCombat: async () => {
    set(state => ({ ...state, isLoading: true, error: null, combatResult: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] startCombat - no character selected')
        set(state => ({ ...state, isLoading: false }))
        return
      }
      // 后端 execute 会自动开始战斗，无需调用 start API
      soundManager.play('combat_start')
      set(state => ({
        ...state,
        isFighting: true,
        character: state.character ? { ...state.character, is_fighting: true } : null,
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  stopCombat: async () => {
    set(state => ({
      ...state,
      enabledSkillIds: [],
      isFighting: false,
      shouldAutoCombat: false,
      character: state.character ? { ...state.character, is_fighting: false } : null,
    }))
  },

  executeCombat: async () => {
    try {
      const enabledIds = get().enabledSkillIds
      console.log(
        '[GameStore] Executing combat...',
        enabledIds.length ? { skill_ids: enabledIds } : ''
      )
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] executeCombat - no character selected, skipping')
        return
      }
      const body: { character_id: number; skill_ids?: number[] } = { character_id: selectedId }
      if (enabledIds.length > 0) body.skill_ids = enabledIds
      const response = (await post('/rpg/combat/execute', body)) as CombatResult
      console.log('[GameStore] Combat execute response:', response)
      console.log('[GameStore] response.character?.current_hp:', response.character?.current_hp)
      console.log('[GameStore] response.character?.current_mana:', response.character?.current_mana)

      // 药水被使用后需要刷新背包
      const usedPotion =
        response.potion_used &&
        ((response.potion_used.before && Object.keys(response.potion_used.before).length > 0) ||
          (response.potion_used.after && Object.keys(response.potion_used.after).length > 0))

      set(state => {
        // 使用 combat_log_id 或 id 去重，避免同一日志被多次添加
        const existingLogIds = new Set<number>(
          state.combatLogs
            .map(l => {
              if ('combat_log_id' in l && typeof l.combat_log_id === 'number')
                return l.combat_log_id
              if ('id' in l && typeof l.id === 'number') return l.id
              return null
            })
            .filter((id): id is number => id != null)
        )
        const responseLogId =
          'combat_log_id' in response && typeof response.combat_log_id === 'number'
            ? response.combat_log_id
            : 'id' in response && typeof response.id === 'number'
              ? response.id
              : null

        const newLogs =
          responseLogId != null && !existingLogIds.has(responseLogId)
            ? [response, ...state.combatLogs].slice(0, 100)
            : state.combatLogs

        console.log(
          '[GameStore] executeCombat - combat_log_id:',
          responseLogId,
          'new logs count:',
          newLogs.length
        )

        // 总是更新 currentHp 和 currentMana（使用新值或保持旧值）
        const newCurrentHp = response.character?.current_hp ?? state.currentHp
        const newCurrentMana = response.character?.current_mana ?? state.currentMana
        console.log('[GameStore] Setting currentHp to:', newCurrentHp)
        console.log('[GameStore] Setting currentMana to:', newCurrentMana)

        // 合并角色数据，并保留药水设置（execute 返回的 character 可能未包含或错误覆盖）
        const potionKeys = [
          'auto_use_hp_potion',
          'hp_potion_threshold',
          'auto_use_mp_potion',
          'mp_potion_threshold',
        ] as const
        const preservedPotion = state.character
          ? Object.fromEntries(
              potionKeys
                .filter(k => state.character![k] !== undefined)
                .map(k => [k, state.character![k]])
            )
          : {}
        const mergedCharacter =
          response.character != null
            ? state.character != null
              ? { ...state.character, ...response.character, ...preservedPotion }
              : { ...response.character, ...preservedPotion }
            : state.character

        return {
          ...state,
          combatResult: response,
          combatLogs: newLogs,
          character: mergedCharacter,
          currentHp: newCurrentHp,
          currentMana: newCurrentMana,
          inventory: response.loot?.item
            ? [...state.inventory, response.loot.item as GameItem]
            : state.inventory,
          // 战败时自动停止战斗
          ...(response.auto_stopped && {
            isFighting: false,
            shouldAutoCombat: false,
          }),
        }
      })

      // 检测到使用药水时刷新背包（药水被消耗了）
      if (usedPotion) {
        await get().fetchInventory()
      }

      // 战败时播放音效（弹窗由 CombatPanel 组件处理）
      if (response.auto_stopped) {
        soundManager.play('combat_defeat')
      }
    } catch (error) {
      console.error('[GameStore] Execute combat error:', error)

      // 检查是否是血量不足导致的自动停止
      if (error instanceof ApiRequestError) {
        const errorData = error.data as { auto_stopped?: boolean; current_hp?: number } | undefined
        if (errorData?.auto_stopped) {
          console.log('[GameStore] Combat auto-stopped due to low HP')
          soundManager.play('combat_defeat')
          set(state => ({
            ...state,
            isFighting: false,
            shouldAutoCombat: false,
            currentHp: errorData.current_hp ?? 0,
            error: error.message || '角色血量不足，已自动停止战斗',
          }))
          return
        }
      }
      set(state => ({ ...state, error: (error as Error).message }))
    }
  },

  setShouldAutoCombat: (should: boolean) => {
    set(state => ({ ...state, shouldAutoCombat: should }))
  },

  toggleEnabledSkill: (skillId: number) => {
    set(state => {
      const ids = state.enabledSkillIds
      const has = ids.includes(skillId)
      return {
        ...state,
        enabledSkillIds: has ? ids.filter(id => id !== skillId) : [...ids, skillId],
      }
    })
  },

  consumePotion: async (itemId: number) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
      // 重新拉取背包，使堆叠数量减一或已删除与服务器一致（避免刷新后“药品又出现”）
      await get().fetchInventory()
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  // WebSocket 事件处理
  handleCombatUpdate: data => {
    console.log('[GameStore] handleCombatUpdate received:', data)
    console.log('[GameStore] data.current_hp (top level):', data.current_hp)
    console.log('[GameStore] data.current_mana (top level):', data.current_mana)
    console.log('[GameStore] data.character?.current_hp:', data.character?.current_hp)
    console.log('[GameStore] data.character?.current_mana:', data.character?.current_mana)
    if (data.victory) {
      soundManager.play('combat_victory')
      if (data.loot?.item) {
        soundManager.play('item_drop')
      }
      if (data.copper_gained > 0) {
        soundManager.play('gold')
      }
    } else if (data.defeat || data.auto_stopped) {
      soundManager.play('combat_defeat')
    } else {
      soundManager.play('combat_hit')
    }

    // 药水被使用后需要刷新背包
    const usedPotion =
      data.potion_used &&
      ((data.potion_used.before && Object.keys(data.potion_used.before).length > 0) ||
        (data.potion_used.after && Object.keys(data.potion_used.after).length > 0))

    set(state => {
      // 优先使用顶层字段，其次使用 character 对象中的字段
      // 只有当值存在时才更新（避免用 null 覆盖正确的值）
      const newCurrentHp = data.current_hp ?? data.character?.current_hp ?? state.currentHp
      const newCurrentMana = data.current_mana ?? data.character?.current_mana ?? state.currentMana
      console.log('[GameStore] handleCombatUpdate setting currentHp to:', newCurrentHp)
      console.log('[GameStore] handleCombatUpdate setting currentMana to:', newCurrentMana)

      // 使用 combat_log_id 或 id 去重，避免同一日志被多次添加
      const existingLogIds = new Set<number>(
        state.combatLogs
          .map(l => {
            if ('combat_log_id' in l && typeof l.combat_log_id === 'number') return l.combat_log_id
            if ('id' in l && typeof l.id === 'number') return l.id
            return null
          })
          .filter((id): id is number => id != null)
      )
      const dataLogId =
        'combat_log_id' in data && typeof data.combat_log_id === 'number'
          ? data.combat_log_id
          : 'id' in data && typeof data.id === 'number'
            ? data.id
            : null

      const newLogs =
        dataLogId != null && !existingLogIds.has(dataLogId)
          ? [data, ...state.combatLogs].slice(0, 100)
          : state.combatLogs

      console.log(
        '[GameStore] handleCombatUpdate - combat_log_id:',
        dataLogId,
        'new logs count:',
        newLogs.length
      )

      return {
        combatResult: data,
        combatLogs: newLogs,
        character: data.character,
        // 只有当新值存在且不为 undefined 时才更新
        ...(newCurrentHp !== undefined && { currentHp: newCurrentHp }),
        ...(newCurrentMana !== undefined && { currentMana: newCurrentMana }),
        // 使用药水时背包会在后面刷新
        inventory: usedPotion
          ? state.inventory
          : data.loot?.item
            ? [...state.inventory, data.loot.item as GameItem]
            : state.inventory,
        // 战败时自动停止战斗
        ...(data.auto_stopped && {
          isFighting: false,
          shouldAutoCombat: false,
          enabledSkillIds: [],
        }),
      }
    })

    // 检测到使用药水时刷新背包（药水被消耗了），使用 Promise.resolve().then 异步执行
    if (usedPotion) {
      Promise.resolve().then(() => get().fetchInventory())
    }
  },

  handleLootDropped: data => {
    soundManager.play('item_drop')
    set(state => ({
      inventory: data.item ? [...state.inventory, data.item as GameItem] : state.inventory,
      character: state.character
        ? {
            ...state.character,
            copper: (state.character.copper || 0) + (data.copper || 0),
            current_hp: data.character?.current_hp ?? state.character.current_hp,
            current_mana: data.character?.current_mana ?? state.character.current_mana,
          }
        : null,
    }))
  },

  handleLevelUp: data => {
    soundManager.play('level_up')
    set(state => ({
      ...state,
      character: data.character,
      currentHp: data.character?.current_hp ?? state.currentHp,
      currentMana: data.character?.current_mana ?? state.currentMana,
    }))
  },

  clearError: () => set(state => ({ ...state, error: null })),

  reset: () => set(initialState),

  // 商店操作
  fetchShopItems: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] fetchShopItems - no character selected, skipping')
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
        character: state.character ? { ...state.character, copper: response.player_copper } : null,
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch shop items error:', error)
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  refreshShopItems: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return
    set(state => ({ ...state, isLoading: true, error: null }))
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
        character: state.character ? { ...state.character, copper: response.player_copper } : null,
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Refresh shop error:', error)
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  buyItem: async (itemId: number, quantity = 1) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
        character: state.character ? { ...state.character, copper: response.copper } : null,
        isLoading: false,
      }))
      // 刷新背包
      get().fetchInventory()
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  sellItemToShop: async (itemId: number, quantity = 1) => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        set(state => ({ ...state, isLoading: false }))
        return
      }
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
        character: state.character ? { ...state.character, copper: response.copper } : null,
        inventory: state.inventory.filter(i => i.id !== itemId),
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  // 图鉴操作
  fetchCompendiumItems: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const response = (await apiGet('/rpg/compendium/items')) as { items: CompendiumItem[] }
      set(state => ({
        ...state,
        compendiumItems: response.items || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium items error:', error)
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
  },

  fetchCompendiumMonsters: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const response = (await apiGet('/rpg/compendium/monsters')) as {
        monsters: CompendiumMonster[]
      }
      set(state => ({
        ...state,
        compendiumMonsters: response.monsters || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium monsters error:', error)
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
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
