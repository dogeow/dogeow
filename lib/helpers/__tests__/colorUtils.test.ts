import { describe, it, expect, vi } from 'vitest'
import { isLightColor, generateRandomColor, hexToHSL } from '../colorUtils'

describe('colorUtils', () => {
  describe('isLightColor', () => {
    it('should return true for light colors', () => {
      expect(isLightColor('#ffffff')).toBe(true) // white
      expect(isLightColor('#FFFFFF')).toBe(true) // white uppercase
      expect(isLightColor('#f0f0f0')).toBe(true) // light gray
      expect(isLightColor('#ffff00')).toBe(true) // yellow
      expect(isLightColor('#00ff00')).toBe(true) // green
      expect(isLightColor('#ff69b4')).toBe(true) // hot pink
    })

    it('should return false for dark colors', () => {
      expect(isLightColor('#000000')).toBe(false) // black
      expect(isLightColor('#333333')).toBe(false) // dark gray
      expect(isLightColor('#800080')).toBe(false) // purple
      expect(isLightColor('#008000')).toBe(false) // dark green
      expect(isLightColor('#000080')).toBe(false) // navy
    })

    it('should handle short hex format (#RGB)', () => {
      expect(isLightColor('#fff')).toBe(true) // white
      expect(isLightColor('#000')).toBe(false) // black
      expect(isLightColor('#f0f')).toBe(false) // magenta (actually dark)
      expect(isLightColor('#333')).toBe(false) // dark gray
    })

    it('should handle colors without # prefix', () => {
      expect(isLightColor('ffffff')).toBe(true) // white
      expect(isLightColor('000000')).toBe(false) // black
      expect(isLightColor('fff')).toBe(true) // white short
      expect(isLightColor('000')).toBe(false) // black short
    })

    it('should return false for invalid color formats and log warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(isLightColor('#gggggg')).toBe(false) // invalid hex
      expect(isLightColor('#12345')).toBe(false) // wrong length
      expect(isLightColor('#1234567')).toBe(false) // too long
      expect(isLightColor('')).toBe(false) // empty string
      expect(isLightColor('invalid')).toBe(false) // not hex

      expect(consoleSpy).toHaveBeenCalledTimes(5)
      expect(consoleSpy).toHaveBeenCalledWith('无效的颜色格式: #gggggg，默认为深色')

      consoleSpy.mockRestore()
    })

    it('should use correct brightness threshold (128)', () => {
      // Test colors right around the threshold
      expect(isLightColor('#808080')).toBe(false) // exactly 128, should be false
      expect(isLightColor('#818181')).toBe(true) // just above 128
      expect(isLightColor('#7f7f7f')).toBe(false) // just below 128
    })
  })

  describe('generateRandomColor', () => {
    it('should generate valid hex color format', () => {
      const color = generateRandomColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should generate different colors on multiple calls', () => {
      const colors = new Set()
      for (let i = 0; i < 100; i++) {
        colors.add(generateRandomColor())
      }
      // Should generate at least some different colors (very unlikely to get all same)
      expect(colors.size).toBeGreaterThan(1)
    })

    it('should generate colors with proper hex padding', () => {
      // Mock Math.random to test edge cases
      const originalRandom = Math.random

      // Test with very small values that need padding
      Math.random = vi.fn().mockReturnValue(0.001) // Should generate #000000 or similar
      let color = generateRandomColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
      expect(color.length).toBe(7)

      // Test with maximum values
      Math.random = vi.fn().mockReturnValue(0.999) // Should generate #ffffff or similar
      color = generateRandomColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
      expect(color.length).toBe(7)

      Math.random = originalRandom
    })
  })

  describe('hexToHSL', () => {
    it('should convert basic colors correctly', () => {
      expect(hexToHSL('#000000')).toBe('hsl(0 0% 0%)') // black
      expect(hexToHSL('#ffffff')).toBe('hsl(0 0% 100%)') // white
      expect(hexToHSL('#ff0000')).toBe('hsl(0 100% 50%)') // red
      expect(hexToHSL('#00ff00')).toBe('hsl(120 100% 50%)') // green
      expect(hexToHSL('#0000ff')).toBe('hsl(240 100% 50%)') // blue
    })

    it('should handle short hex format (#RGB)', () => {
      expect(hexToHSL('#000')).toBe('hsl(0 0% 0%)') // black
      expect(hexToHSL('#fff')).toBe('hsl(0 0% 100%)') // white
      expect(hexToHSL('#f00')).toBe('hsl(0 100% 50%)') // red
      expect(hexToHSL('#0f0')).toBe('hsl(120 100% 50%)') // green
      expect(hexToHSL('#00f')).toBe('hsl(240 100% 50%)') // blue
    })

    it('should handle colors without # prefix', () => {
      expect(hexToHSL('000000')).toBe('hsl(0 0% 0%)') // black
      expect(hexToHSL('ffffff')).toBe('hsl(0 0% 100%)') // white
      expect(hexToHSL('ff0000')).toBe('hsl(0 100% 50%)') // red
    })

    it('should handle uppercase hex values', () => {
      expect(hexToHSL('#FF0000')).toBe('hsl(0 100% 50%)') // red
      expect(hexToHSL('#00FF00')).toBe('hsl(120 100% 50%)') // green
      expect(hexToHSL('#0000FF')).toBe('hsl(240 100% 50%)') // blue
    })

    it('should convert gray colors correctly', () => {
      expect(hexToHSL('#808080')).toBe('hsl(0 0% 50%)') // medium gray
      expect(hexToHSL('#404040')).toBe('hsl(0 0% 25%)') // dark gray
      expect(hexToHSL('#c0c0c0')).toBe('hsl(0 0% 75%)') // light gray
    })

    it('should handle complex colors correctly', () => {
      expect(hexToHSL('#ff69b4')).toBe('hsl(330 100% 71%)') // hot pink
      expect(hexToHSL('#ffa500')).toBe('hsl(39 100% 50%)') // orange
      expect(hexToHSL('#800080')).toBe('hsl(300 100% 25%)') // purple
    })

    it('should return default HSL for invalid formats and log warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(hexToHSL('#gggggg')).toBe('hsl(0 0% 0%)') // invalid hex
      expect(hexToHSL('#12345')).toBe('hsl(0 0% 0%)') // wrong length
      expect(hexToHSL('#1234567')).toBe('hsl(0 0% 0%)') // too long
      expect(hexToHSL('')).toBe('hsl(0 0% 0%)') // empty string
      expect(hexToHSL('invalid')).toBe('hsl(0 0% 0%)') // not hex

      expect(consoleSpy).toHaveBeenCalledTimes(5)
      expect(consoleSpy).toHaveBeenCalledWith('无效的颜色格式: #gggggg，返回默认 HSL 值')

      consoleSpy.mockRestore()
    })

    it('should handle edge cases in HSL calculation', () => {
      // Test colors that might cause edge cases in hue calculation
      expect(hexToHSL('#ffff00')).toBe('hsl(60 100% 50%)') // yellow
      expect(hexToHSL('#ff00ff')).toBe('hsl(300 100% 50%)') // magenta
      expect(hexToHSL('#00ffff')).toBe('hsl(180 100% 50%)') // cyan
    })
  })
})
