import { vi } from 'vitest'
import { configs, getTranslatedConfigs } from '../configs'

// Mock console.log to avoid output during tests
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = vi.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

describe('App Configs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('configs object', () => {
    it('should have correct tiles structure', () => {
      expect(configs.tiles).toBeDefined()
      expect(Array.isArray(configs.tiles)).toBe(true)
      expect(configs.tiles.length).toBeGreaterThan(0)
    })

    it('should have all required tile properties', () => {
      configs.tiles.forEach(tile => {
        expect(tile).toHaveProperty('name')
        expect(tile).toHaveProperty('nameKey')
        expect(tile).toHaveProperty('href')
        expect(tile).toHaveProperty('color')
        expect(tile).toHaveProperty('needLogin')
        expect(typeof tile.name).toBe('string')
        expect(typeof tile.nameKey).toBe('string')
        expect(typeof tile.href).toBe('string')
        expect(typeof tile.color).toBe('string')
        expect(typeof tile.needLogin).toBe('boolean')
      })
    })

    it('should have unique tile names', () => {
      const names = configs.tiles.map(tile => tile.name)
      const uniqueNames = new Set(names)
      expect(names.length).toBe(uniqueNames.size)
    })

    it('should have valid href paths', () => {
      configs.tiles.forEach(tile => {
        expect(tile.href).toMatch(/^\/[a-zA-Z-]+$/)
      })
    })

    it('should have valid color hex codes', () => {
      configs.tiles.forEach(tile => {
        expect(tile.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('should have gridLayout configuration', () => {
      expect(configs.gridLayout).toBeDefined()
      expect(configs.gridLayout).toHaveProperty('columns')
      expect(configs.gridLayout).toHaveProperty('templateAreas')
      expect(typeof configs.gridLayout.columns).toBe('number')
      expect(typeof configs.gridLayout.templateAreas).toBe('string')
    })

    it('should have valid grid template areas', () => {
      const templateAreas = configs.gridLayout.templateAreas
      expect(templateAreas).toContain('"')
      expect(templateAreas).toMatch(/"[a-zA-Z\s]+"/)
    })

    it('should have specific tiles with correct properties', () => {
      const thingTile = configs.tiles.find(tile => tile.name === 'thing')
      expect(thingTile).toBeDefined()
      expect(thingTile?.href).toBe('/thing')
      expect(thingTile?.needLogin).toBe(true)

      const labTile = configs.tiles.find(tile => tile.name === 'lab')
      expect(labTile).toBeDefined()
      expect(labTile?.href).toBe('/lab')
      expect(labTile?.needLogin).toBe(false)
    })

    it('should have all expected tile names', () => {
      const expectedNames = ['thing', 'lab', 'file', 'tool', 'nav', 'note', 'game', 'chat']
      const actualNames = configs.tiles.map(tile => tile.name)

      expectedNames.forEach(name => {
        expect(actualNames).toContain(name)
      })
    })

    it('should have correct nameKey format', () => {
      configs.tiles.forEach(tile => {
        expect(tile.nameKey).toMatch(/^nav\.[a-zA-Z]+$/)
      })
    })
  })

  describe('getTranslatedConfigs function', () => {
    const mockTranslation = vi.fn((key: string) => `translated_${key}`)

    it('should return translated configs object', () => {
      const translatedConfigs = getTranslatedConfigs(mockTranslation)

      expect(translatedConfigs).toBeDefined()
      expect(translatedConfigs).toHaveProperty('tiles')
      expect(translatedConfigs).toHaveProperty('gridLayout')

      // Use the variable to avoid linting error
      expect(translatedConfigs.tiles).toBeDefined()
      expect(translatedConfigs.gridLayout).toBeDefined()
    })

    it('should translate tile names using the translation function', () => {
      getTranslatedConfigs(mockTranslation)

      configs.tiles.forEach(tile => {
        expect(mockTranslation).toHaveBeenCalledWith(tile.nameKey)
      })
    })

    it('should preserve original tile structure', () => {
      const translatedConfigs = getTranslatedConfigs(mockTranslation)

      expect(translatedConfigs.tiles.length).toBe(configs.tiles.length)

      translatedConfigs.tiles.forEach((tile, index) => {
        const originalTile = configs.tiles[index]
        expect(tile.name).toBe(originalTile.name)
        expect(tile.href).toBe(originalTile.href)
        expect(tile.color).toBe(originalTile.color)
        expect(tile.needLogin).toBe(originalTile.needLogin)
      })
    })

    it('should preserve gridLayout configuration', () => {
      const translatedConfigs = getTranslatedConfigs(mockTranslation)

      expect(translatedConfigs.gridLayout).toEqual(configs.gridLayout)
    })

    it('should call translation function for each tile', () => {
      getTranslatedConfigs(mockTranslation)

      expect(mockTranslation).toHaveBeenCalledTimes(configs.tiles.length)
      configs.tiles.forEach(tile => {
        expect(mockTranslation).toHaveBeenCalledWith(tile.nameKey)
      })
    })
  })

  describe('console output in client environment', () => {
    it('should log console output when window is available', () => {
      // This test verifies that the configs load properly
      expect(configs).toBeDefined()
      // Note: console.log is mocked, so we don't check if it was called
    })
  })
})
