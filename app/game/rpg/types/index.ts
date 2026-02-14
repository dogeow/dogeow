// 游戏类型定义

export type CharacterClass = 'warrior' | 'mage' | 'ranger'
export type ItemQuality = 'common' | 'magic' | 'rare' | 'legendary' | 'mythic'
export type ItemType =
  | 'weapon'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'belt'
  | 'ring'
  | 'amulet'
  | 'potion'
  | 'gem'
export type EquipmentSlot =
  | 'weapon'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'belt'
  | 'ring1'
  | 'ring2'
  | 'amulet'
export type SkillType = 'active' | 'passive'
export type MonsterType = 'normal' | 'elite' | 'boss'

export interface GameCharacter {
  id: number
  user_id: number
  name: string
  class: CharacterClass
  level: number
  experience: number
  copper: number
  strength: number
  dexterity: number
  vitality: number
  energy: number
  skill_points: number
  stat_points: number
  current_map_id: number | null
  is_fighting: boolean
  last_combat_at: string | null
  difficulty_tier?: number
  current_hp?: number
  current_mana?: number
  auto_use_hp_potion?: boolean
  hp_potion_threshold?: number
  auto_use_mp_potion?: boolean
  mp_potion_threshold?: number
  created_at: string
  updated_at: string
}

export interface CombatStats {
  max_hp: number
  max_mana: number
  attack: number
  defense: number
  crit_rate: number
  crit_damage: number
}

/** 单条战斗属性的明细（基础 + 装备） */
export interface StatBreakdownItem {
  base: number
  equipment: number
  total: number
}

export interface CombatStatsBreakdown {
  attack: StatBreakdownItem
  defense: StatBreakdownItem
  crit_rate: StatBreakdownItem
  crit_damage: StatBreakdownItem
}

export interface ItemDefinition {
  id: number
  name: string
  type: ItemType
  sub_type?: string
  base_stats: Record<string, number>
  required_level: number
  required_strength: number
  required_dexterity: number
  required_energy: number
  icon?: string
  description?: string
}

export interface GameItem {
  id: number
  character_id: number
  definition_id: number
  definition: ItemDefinition
  quality: ItemQuality
  stats: Record<string, number>
  affixes: Record<string, number>[]
  is_in_storage: boolean
  quantity: number
  slot_index: number | null
}

export interface Equipment {
  slot: EquipmentSlot
  item: GameItem | null
}

export interface SkillDefinition {
  id: number
  name: string
  description?: string
  type: SkillType
  class_restriction: CharacterClass | 'all'
  max_level: number
  base_damage: number
  damage_per_level: number
  mana_cost: number
  mana_cost_per_level: number
  cooldown: number
  icon?: string
  effects?: Record<string, unknown>
}

export interface CharacterSkill {
  id: number
  character_id: number
  skill_id: number
  skill: SkillDefinition
  level: number
  slot_index: number | null
}

export interface MapDefinition {
  id: number
  name: string
  act: number
  min_level: number
  max_level: number
  monster_ids: number[]
  monsters?: MonsterDefinition[]
  background?: string
  description?: string
}

export interface CharacterMap {
  id: number
  character_id: number
  map_id: number
  map: MapDefinition
  unlocked: boolean
  teleport_unlocked: boolean
}

export interface MonsterDefinition {
  id: number
  name: string
  type: MonsterType
  level: number
  hp_base: number
  hp_per_level: number
  attack_base: number
  attack_per_level: number
  defense_base: number
  defense_per_level: number
  experience_base: number
  experience_per_level: number
  drop_table: Record<string, unknown>
  icon?: string
}

/** 单场战斗中释放的技能（含次数） */
export interface SkillUsedEntry {
  skill_id: number
  name: string
  icon?: string | null
  use_count: number
}

export interface CombatResult {
  victory: boolean
  defeat?: boolean
  auto_stopped?: boolean
  monster: {
    name: string
    type: MonsterType
    level: number
    hp?: number
    max_hp?: number
  }
  /** 本回合开始时的怪物血量，用于先渲染再播扣血动画 */
  monster_hp_before_round?: number
  damage_dealt: number
  damage_taken: number
  rounds: number
  experience_gained: number
  copper_gained: number
  loot: {
    copper?: number
    item?: GameItem
    potion?: GameItem
    item_lost?: boolean
    item_lost_reason?: string
  }
  skills_used?: SkillUsedEntry[]
  character: GameCharacter
  /** 仅当本场战斗结束（胜利/失败）时存在 */
  combat_log_id?: number
}

export interface CombatLog {
  id: number
  character_id: number
  map_id: number
  monster_id: number
  monster: MonsterDefinition
  map: MapDefinition
  damage_dealt: number
  damage_taken: number
  victory: boolean
  loot_dropped: Record<string, unknown> | null
  loot?: {
    copper?: number
    item?: GameItem
    potion?: GameItem
    item_lost?: boolean
    item_lost_reason?: string
  }
  experience_gained: number
  copper_gained: number
  duration_seconds: number
  skills_used?: SkillUsedEntry[]
  created_at: string
}

// API响应类型
export interface CharacterResponse {
  character: GameCharacter | null
  combat_stats?: CombatStats
  equipped_items?: Record<string, GameItem>
}

export interface CharacterDetailResponse {
  character: GameCharacter
  inventory: GameItem[]
  storage: GameItem[]
  skills: CharacterSkill[]
  available_skills: SkillDefinition[]
  combat_stats: CombatStats
}

export interface InventoryResponse {
  inventory: GameItem[]
  storage: GameItem[]
  equipment: Record<string, Equipment>
  inventory_size: number
  storage_size: number
}

export interface MapsResponse {
  maps: MapDefinition[]
  progress: Record<number, CharacterMap>
  current_map_id: number | null
}

export interface CombatStatusResponse {
  is_fighting: boolean
  current_map: MapDefinition | null
  combat_stats: CombatStats
  last_combat_at: string | null
}

// 常量
export const QUALITY_COLORS: Record<ItemQuality, string> = {
  common: '#ffffff',
  magic: '#6888ff',
  rare: '#ffcc00',
  legendary: '#ff8000',
  mythic: '#00ff00',
}

export const QUALITY_NAMES: Record<ItemQuality, string> = {
  common: '普通',
  magic: '魔法',
  rare: '稀有',
  legendary: '传奇',
  mythic: '神话',
}

export const CLASS_NAMES: Record<CharacterClass, string> = {
  warrior: '战士',
  mage: '法师',
  ranger: '游侠',
}

export const SLOT_NAMES: Record<EquipmentSlot, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  belt: '腰带',
  ring1: '戒指1',
  ring2: '戒指2',
  amulet: '护身符',
}

export const STAT_NAMES: Record<string, string> = {
  attack: '攻击力',
  defense: '防御力',
  max_hp: '生命值',
  max_mana: '魔法值',
  crit_rate: '暴击率',
  crit_damage: '暴击伤害',
  strength: '力量',
  dexterity: '敏捷',
  vitality: '体力',
  energy: '能量',
  all_stats: '全属性',
}

/** 基础属性对战斗属性的影响说明（与后端 GameCharacter 计算公式一致） */
export const STAT_DESCRIPTIONS: Record<'strength' | 'dexterity' | 'vitality' | 'energy', string> = {
  strength: '战士主属性。攻击力 = 力量×2；部分装备有力量需求。',
  dexterity:
    '游侠主属性。攻击力 = 敏捷×2；参与防御；暴击率每点+1%（上限10%）；部分装备有敏捷需求。',
  vitality: '最大生命每点+5；参与防御计算。',
  energy: '法师主属性。攻击力 = 能量×2；最大法力每点+3；部分装备有能量需求。',
}

// 商店物品
export interface ShopItem {
  id: number
  name: string
  type: ItemType
  sub_type?: string
  base_stats: Record<string, number>
  required_level: number
  required_strength: number
  required_dexterity: number
  required_energy: number
  icon?: string
  description?: string
  buy_price: number
  sell_price: number
}

export interface ShopResponse {
  items: ShopItem[]
  player_copper: number
}

export interface BuyResponse {
  copper: number
  total_price: number
  quantity: number
  item_name: string
}

export interface SellResponse {
  copper: number
  sell_price: number
  quantity: number
  item_name: string
}

/** 货币：1金=100银=10000铜，格式化为 "X金 Y银 Z铜"（纯文字，界面可用 🪙 等前缀表示货币） */
export function formatCopper(copper: number): string {
  const g = Math.floor(copper / 10000)
  const s = Math.floor((copper % 10000) / 100)
  const c = copper % 100
  const parts: string[] = []
  if (g > 0) parts.push(`${g}金`)
  if (s > 0) parts.push(`${s}银`)
  if (c > 0 || parts.length === 0) parts.push(`${c}铜`)
  return parts.join(' ')
}
