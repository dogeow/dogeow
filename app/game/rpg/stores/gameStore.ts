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
  MapDefinition,
  CharacterMap,
  CombatResult,
  CombatLog,
  EquipmentSlot,
  ShopItem,
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
  equipment: Record<string, GameItem | null>
  skills: CharacterSkill[]
  availableSkills: SkillDefinition[]
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
  activeTab: 'character' | 'inventory' | 'skills' | 'maps' | 'combat' | 'shop' | 'settings'

  // 商店状态
  shopItems: ShopItem[]

  // Actions
  setActiveTab: (
    tab: 'character' | 'inventory' | 'skills' | 'maps' | 'combat' | 'shop' | 'settings'
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
  buyItem: (itemId: number, quantity?: number) => Promise<void>
  sellItemToShop: (itemId: number, quantity?: number) => Promise<void>

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
}

const store: StateCreator<GameState> = (set, get) => ({
  ...initialState,

  setActiveTab: tab => set(state => ({ ...state, activeTab: tab })),

  fetchCharacters: async () => {
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      console.log('[GameStore] Fetching characters...')
      const response = (await apiGet('/rpg/characters')) as {
        characters: GameCharacter[]
        message?: string
      }
      console.log('[GameStore] Full response:', JSON.stringify(response, null, 2))
      console.log('[GameStore] Response keys:', Object.keys(response || {}))
      console.log('[GameStore] Characters response:', response)
      console.log('[GameStore] Characters array:', response?.characters)
      console.log('[GameStore] Characters count:', response?.characters?.length)
      console.log('[GameStore] Characters type:', typeof response?.characters)
      console.log('[GameStore] Is array?:', Array.isArray(response?.characters))
      set(state => ({
        ...state,
        characters: response?.characters || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch characters error:', error)
      set(state => ({
        ...state,
        error: (error as Error).message,
        isLoading: false,
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
                availableSkills: [],
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
      }
      const equipment: Record<string, GameItem | null> = {}
      Object.entries(response.equipment || {}).forEach(([slot, data]) => {
        equipment[slot] = data && 'item' in data ? data.item : null
      })
      set(state => ({
        ...state,
        inventory: response.inventory || [],
        storage: response.storage || [],
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
        available_skills: SkillDefinition[]
        learned_skills: CharacterSkill[]
        skill_points: number
      }
      set(state => ({
        ...state,
        availableSkills: response.available_skills || [],
        skills: response.learned_skills || [],
        character: state.character
          ? { ...state.character, skill_points: response.skill_points }
          : null,
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
      const newSkill = response.character_skill
      set(state => ({
        ...state,
        skills: newSkill ? [...state.skills, newSkill] : state.skills,
        character: state.character
          ? { ...state.character, skill_points: response.skill_points }
          : null,
        isLoading: false,
      }))
      if (!newSkill) {
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
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] startCombat - no character selected')
        set(state => ({ ...state, isLoading: false }))
        return
      }
      await (post as any)('/rpg/combat/start', { character_id: selectedId })
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
    set(state => ({ ...state, isLoading: true, error: null }))
    try {
      const selectedId = get().selectedCharacterId
      if (!selectedId) {
        console.warn('[GameStore] stopCombat - no character selected')
        set(state => ({ ...state, isLoading: false }))
        return
      }
      await (post as any)('/rpg/combat/stop', { character_id: selectedId })
      set(state => ({ ...state, enabledSkillIds: [] }))
      set(state => ({
        ...state,
        isFighting: false,
        shouldAutoCombat: false, // 停止战斗时同时关闭自动战斗
        character: state.character ? { ...state.character, is_fighting: false } : null,
        isLoading: false,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message, isLoading: false }))
    }
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
      set(state => {
        const newLogs =
          response.combat_log_id != null
            ? [response, ...state.combatLogs].slice(0, 100)
            : state.combatLogs
        console.log('[GameStore] Updated combatLogs:', newLogs)

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
    } catch (error) {
      console.error('[GameStore] Execute combat error:', error)

      // 检查是否是血量不足导致的自动停止
      if (error instanceof ApiRequestError) {
        const errorData = error.data as { auto_stopped?: boolean; current_hp?: number } | undefined
        if (errorData?.auto_stopped) {
          console.log('[GameStore] Combat auto-stopped due to low HP')
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
    } else if (data.defeat) {
      soundManager.play('combat_defeat')
    } else {
      soundManager.play('combat_hit')
    }
    set(state => {
      // 优先使用顶层字段，其次使用 character 对象中的字段
      // 只有当值存在时才更新（避免用 null 覆盖正确的值）
      const newCurrentHp = data.current_hp ?? data.character?.current_hp ?? state.currentHp
      const newCurrentMana = data.current_mana ?? data.character?.current_mana ?? state.currentMana
      console.log('[GameStore] handleCombatUpdate setting currentHp to:', newCurrentHp)
      console.log('[GameStore] handleCombatUpdate setting currentMana to:', newCurrentMana)
      return {
        combatResult: data,
        combatLogs:
          data.combat_log_id != null ? [data, ...state.combatLogs].slice(0, 100) : state.combatLogs,
        character: data.character,
        // 只有当新值存在且不为 undefined 时才更新
        ...(newCurrentHp !== undefined && { currentHp: newCurrentHp }),
        ...(newCurrentMana !== undefined && { currentMana: newCurrentMana }),
        inventory: data.loot?.item
          ? [...state.inventory, data.loot.item as GameItem]
          : state.inventory,
        // 战败时自动停止战斗
        ...(data.auto_stopped && {
          isFighting: false,
          shouldAutoCombat: false,
        }),
      }
    })
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
      }
      set(state => ({
        ...state,
        shopItems: response.items || [],
        character: state.character ? { ...state.character, copper: response.player_copper } : null,
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch shop items error:', error)
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
})

export const useGameStore = create<GameState>()(
  persist(store, {
    name: 'rpg-game-storage',
    // 只持久化必要的 UI 状态，不持久化频繁变化的游戏数据
    partialize: state => ({
      selectedCharacterId: state.selectedCharacterId,
      activeTab: state.activeTab,
    }),
    skipHydration: false,
  })
)
