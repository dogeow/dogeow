import { describe, it, expect } from 'vitest'
import { cn, isLightColor, generateRandomColor, hexToHSL } from '../index'

describe('helpers index', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('should handle conditional classes', () => {
      expect(cn('px-2', true && 'py-1', false && 'hidden')).toBe('px-2 py-1')
    })

    it('should resolve Tailwind conflicts', () => {
      // tailwind-merge should resolve conflicts, keeping the last one
      expect(cn('px-2', 'px-4')).toBe('px-4')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle arrays and objects', () => {
      expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1')
      expect(cn({ 'px-2': true, 'py-1': false })).toBe('px-2')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })

    it('should handle complex combinations', () => {
      expect(
        cn(
          'px-2 py-1',
          { 'bg-red-500': true, 'bg-blue-500': false },
          ['text-white', 'font-bold'],
          'hover:bg-red-600'
        )
      ).toBe('px-2 py-1 bg-red-500 text-white font-bold hover:bg-red-600')
    })
  })

  describe('re-exported functions', () => {
    it('should re-export isLightColor function', () => {
      expect(typeof isLightColor).toBe('function')
      expect(isLightColor('#ffffff')).toBe(true)
      expect(isLightColor('#000000')).toBe(false)
    })

    it('should re-export generateRandomColor function', () => {
      expect(typeof generateRandomColor).toBe('function')
      const color = generateRandomColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should re-export hexToHSL function', () => {
      expect(typeof hexToHSL).toBe('function')
      expect(hexToHSL('#ffffff')).toBe('hsl(0 0% 100%)')
      expect(hexToHSL('#000000')).toBe('hsl(0 0% 0%)')
    })
  })
})
