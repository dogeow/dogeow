import { describe, expect, it } from 'vitest'
import { getMoonDiceRank } from '../moonDiceRules'

describe('moonDiceRules', () => {
  it('优先匹配：插金花 > 状元', () => {
    // 4 个 4 + 2 个 2
    expect(getMoonDiceRank([4, 4, 4, 4, 2, 2])).toBe('cjh')
  })

  it('六杯红：六个 4', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 4, 4])).toBe('lbh')
  })

  it('五子带一秀：五个 1 + 一个 4', () => {
    expect(getMoonDiceRank([1, 1, 1, 1, 1, 4])).toBe('wzdyx')
  })

  it('榜眼：一到六各一个', () => {
    expect(getMoonDiceRank([1, 2, 3, 4, 5, 6])).toBe('by')
  })

  it('状元：四个 4（且不是插金花）', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 1, 3])).toBe('zy')
  })

  it('五王：五个 4', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 4, 2])).toBe('ww')
  })

  it('二举/一秀：两个 4 / 一个 4', () => {
    expect(getMoonDiceRank([4, 4, 1, 2, 3, 5])).toBe('eq')
    expect(getMoonDiceRank([4, 1, 2, 3, 5, 6])).toBe('yx')
  })

  it('没有：不符合任何规则', () => {
    expect(getMoonDiceRank([1, 2, 2, 3, 3, 5])).toBe('none')
  })
})
