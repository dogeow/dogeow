export type MoonDiceRank =
  | 'cjh'
  | 'lbh'
  | 'bdj'
  | 'ww'
  | 'wzdyx'
  | 'wzdk'
  | 'zy'
  | 'by'
  | 'sh'
  | 'sj'
  | 'eq'
  | 'yx'
  | 'none'

export type MoonDiceRankMeta = {
  rank: MoonDiceRank
  name: string
  money: number
}

type DiceFace = 1 | 2 | 3 | 4 | 5 | 6

type DiceCounts = Record<DiceFace, number>

type RankRule = Partial<Record<DiceFace, number>>

// 规则顺序非常关键：越靠前优先级越高（例如 插金花 必须压过普通 状元）
export const MOON_DICE_RANK_ORDER: readonly MoonDiceRank[] = [
  'cjh',
  'lbh',
  'bdj',
  'ww',
  'wzdyx',
  'wzdk',
  'zy',
  'by',
  'sh',
  'sj',
  'eq',
  'yx',
  'none',
] as const

const RULES: Record<Exclude<MoonDiceRank, 'none'>, readonly RankRule[]> = {
  cjh: [{ 2: 2, 4: 4 }],
  lbh: [{ 4: 6 }],
  bdj: [{ 1: 6 }, { 2: 6 }, { 3: 6 }, { 5: 6 }, { 6: 6 }],
  ww: [{ 4: 5 }],
  wzdyx: [
    { 1: 5, 4: 1 },
    { 2: 5, 4: 1 },
    { 3: 5, 4: 1 },
    { 5: 5, 4: 1 },
    { 6: 5, 4: 1 },
  ],
  wzdk: [{ 1: 5 }, { 2: 5 }, { 3: 5 }, { 5: 5 }, { 6: 5 }],
  zy: [{ 4: 4 }],
  by: [{ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }],
  sh: [{ 4: 3 }],
  sj: [{ 1: 4 }, { 2: 4 }, { 3: 4 }, { 5: 4 }, { 6: 4 }],
  eq: [{ 4: 2 }],
  yx: [{ 4: 1 }],
} as const

export const MOON_DICE_RANK_META: Record<MoonDiceRank, MoonDiceRankMeta> = {
  cjh: { rank: 'cjh', name: '状元插金花', money: 2.33 },
  lbh: { rank: 'lbh', name: '六杯红', money: 2.33 },
  bdj: { rank: 'bdj', name: '遍地锦', money: 2.33 },
  ww: { rank: 'ww', name: '五王', money: 1.68 },
  wzdyx: { rank: 'wzdyx', name: '五子带一秀', money: 1.88 },
  wzdk: { rank: 'wzdk', name: '五子登科', money: 1.68 },
  zy: { rank: 'zy', name: '状元', money: 1.11 },
  by: { rank: 'by', name: '榜眼', money: 1.23 },
  sh: { rank: 'sh', name: '三红', money: 0.33 },
  sj: { rank: 'sj', name: '四进', money: 0.4 },
  eq: { rank: 'eq', name: '二举', money: 0.2 },
  yx: { rank: 'yx', name: '一秀', money: 0.1 },
  none: { rank: 'none', name: '没有', money: 0.01 },
} as const

export function getMoonDiceCounts(dice: readonly number[]): DiceCounts {
  const counts: DiceCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

  for (const raw of dice) {
    if (!Number.isInteger(raw)) continue
    if (raw < 1 || raw > 6) continue
    const face = raw as DiceFace
    counts[face] += 1
  }

  return counts
}

function matchesRule(counts: DiceCounts, rule: RankRule): boolean {
  for (const [rawFace, rawNeed] of Object.entries(rule)) {
    const face = Number(rawFace) as DiceFace
    const need = rawNeed ?? 0
    if (counts[face] !== need) return false
  }
  return true
}

export function getMoonDiceRank(diceOrCounts: readonly number[] | DiceCounts): MoonDiceRank {
  const counts = (
    Array.isArray(diceOrCounts) ? getMoonDiceCounts(diceOrCounts) : diceOrCounts
  ) as DiceCounts

  for (const rank of MOON_DICE_RANK_ORDER) {
    if (rank === 'none') continue
    const rules = RULES[rank]
    for (const rule of rules) {
      if (matchesRule(counts, rule)) {
        return rank
      }
    }
  }

  return 'none'
}

export function getMoonDiceRankMeta(
  diceOrRank: readonly number[] | MoonDiceRank
): MoonDiceRankMeta {
  const rank = (
    Array.isArray(diceOrRank) ? getMoonDiceRank(diceOrRank) : diceOrRank
  ) as MoonDiceRank
  return MOON_DICE_RANK_META[rank]
}

export function compareMoonDiceRank(a: MoonDiceRank, b: MoonDiceRank): number {
  const score = (rank: MoonDiceRank) => {
    const idx = MOON_DICE_RANK_ORDER.indexOf(rank)
    return idx === -1 ? 999 : idx
  }

  // 顺序越靠前，等级越高
  return score(a) - score(b)
}
