import { describe, it, expect } from 'vitest'
import { ensureEven } from '../mathUtils'

describe('mathUtils', () => {
  describe('ensureEven', () => {
    it('should return the same number if it is already even', () => {
      expect(ensureEven(0)).toBe(0)
      expect(ensureEven(2)).toBe(2)
      expect(ensureEven(4)).toBe(4)
      expect(ensureEven(10)).toBe(10)
      expect(ensureEven(100)).toBe(100)
      expect(ensureEven(1000)).toBe(1000)
    })

    it('should return number minus 1 if it is odd', () => {
      expect(ensureEven(1)).toBe(0)
      expect(ensureEven(3)).toBe(2)
      expect(ensureEven(5)).toBe(4)
      expect(ensureEven(11)).toBe(10)
      expect(ensureEven(99)).toBe(98)
      expect(ensureEven(1001)).toBe(1000)
    })

    it('should handle negative even numbers', () => {
      expect(ensureEven(-2)).toBe(-2)
      expect(ensureEven(-4)).toBe(-4)
      expect(ensureEven(-10)).toBe(-10)
      expect(ensureEven(-100)).toBe(-100)
    })

    it('should handle negative odd numbers', () => {
      expect(ensureEven(-1)).toBe(-2)
      expect(ensureEven(-3)).toBe(-4)
      expect(ensureEven(-5)).toBe(-6)
      expect(ensureEven(-11)).toBe(-12)
      expect(ensureEven(-99)).toBe(-100)
    })

    it('should handle large numbers', () => {
      expect(ensureEven(999999)).toBe(999998)
      expect(ensureEven(1000000)).toBe(1000000)
      expect(ensureEven(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER - 1) // MAX_SAFE_INTEGER is odd
      expect(ensureEven(Number.MAX_SAFE_INTEGER - 1)).toBe(Number.MAX_SAFE_INTEGER - 1) // Even
    })

    it('should handle decimal numbers (treating them as integers)', () => {
      // Note: The function uses modulo operator which works with decimals
      expect(ensureEven(2.5)).toBe(1.5) // 2.5 % 2 = 0.5, so it's treated as odd
      expect(ensureEven(4.0)).toBe(4.0) // 4.0 % 2 = 0, so it's treated as even
      expect(ensureEven(3.7)).toBe(2.7) // 3.7 % 2 = 1.7, so it's treated as odd
    })

    it('should handle edge case of zero', () => {
      expect(ensureEven(0)).toBe(0) // 0 is even
    })
  })
})
