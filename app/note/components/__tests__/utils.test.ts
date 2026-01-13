import { describe, it, expect } from 'vitest'
import { normalizeTokens, getTokensForCodeBlock, mergeMaps } from '../utils'

describe('utils', () => {
  describe('normalizeTokens', () => {
    it('should handle empty array', () => {
      const result = normalizeTokens([])
      expect(result).toEqual([[]])
    })

    it('should normalize simple string token', () => {
      const result = normalizeTokens(['hello'])
      expect(result).toEqual([
        [
          {
            types: [],
            content: 'hello',
          },
        ],
      ])
    })

    it('should split token by newlines', () => {
      const result = normalizeTokens(['line1\nline2\nline3'])
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual([{ types: [], content: 'line1' }])
      expect(result[1]).toEqual([{ types: [], content: 'line2' }])
      expect(result[2]).toEqual([{ types: [], content: 'line3' }])
    })

    it('should handle empty lines', () => {
      const result = normalizeTokens(['line1\n\nline3'])
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual([{ types: [], content: 'line1' }])
      expect(result[1]).toEqual([])
      expect(result[2]).toEqual([{ types: [], content: 'line3' }])
    })

    it('should handle token objects with type and content', () => {
      const token = {
        type: 'keyword',
        content: 'function',
      }
      const result = normalizeTokens([token])
      expect(result).toEqual([
        [
          {
            types: ['keyword'],
            content: 'function',
          },
        ],
      ])
    })

    it('should handle nested token objects', () => {
      const token = {
        type: 'block',
        content: [
          {
            type: 'keyword',
            content: 'if',
          },
        ],
      }
      const result = normalizeTokens([token])
      expect(result).toEqual([
        [
          {
            types: ['block', 'keyword'],
            content: 'if',
          },
        ],
      ])
    })

    it('should handle array of tokens', () => {
      const tokens = [
        { type: 'keyword', content: 'const' },
        ' ',
        { type: 'variable', content: 'x' },
      ]
      const result = normalizeTokens(tokens)
      expect(result).toEqual([
        [
          { types: ['keyword'], content: 'const' },
          { types: [], content: ' ' },
          { types: ['variable'], content: 'x' },
        ],
      ])
    })

    it('should handle complex nested structure', () => {
      const tokens = [
        {
          type: 'function',
          content: [
            { type: 'keyword', content: 'function' },
            ' ',
            { type: 'name', content: 'test' },
          ],
        },
      ]
      const result = normalizeTokens(tokens)
      expect(result).toEqual([
        [
          { types: ['function', 'keyword'], content: 'function' },
          { types: ['function'], content: ' ' },
          { types: ['function', 'name'], content: 'test' },
        ],
      ])
    })

    it('should handle multiline content in nested tokens', () => {
      const tokens = [
        {
          type: 'block',
          content: 'line1\nline2',
        },
      ]
      const result = normalizeTokens(tokens)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual([{ types: ['block'], content: 'line1' }])
      expect(result[1]).toEqual([{ types: ['block'], content: 'line2' }])
    })

    it('should skip empty string tokens', () => {
      const tokens = ['hello', '', 'world']
      const result = normalizeTokens(tokens)
      expect(result).toEqual([
        [
          { types: [], content: 'hello' },
          { types: [], content: 'world' },
        ],
      ])
    })

    it('should handle token without content property', () => {
      const token = { type: 'test' }
      const result = normalizeTokens([token])
      expect(result).toEqual([[]])
    })
  })

  describe('getTokensForCodeBlock', () => {
    it('should return empty array for non-text node', () => {
      const node = { type: 'element', children: [] }
      const result = getTokensForCodeBlock(node)
      expect(result).toEqual([])
    })

    it('should return empty array for any input (not implemented)', () => {
      const node = { text: 'some text' }
      const result = getTokensForCodeBlock(node)
      expect(result).toEqual([])
    })
  })

  describe('mergeMaps', () => {
    it('should handle empty maps', () => {
      const result = mergeMaps()
      expect(result).toEqual(new Map())
    })

    it('should merge single map', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const result = mergeMaps(map1)
      expect(result).toEqual(
        new Map([
          ['a', 1],
          ['b', 2],
        ])
      )
    })

    it('should merge multiple maps', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map2 = new Map([
        ['c', 3],
        ['d', 4],
      ])
      const result = mergeMaps(map1, map2)
      expect(result).toEqual(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ])
      )
    })

    it('should override values with later maps', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map2 = new Map([
        ['b', 3],
        ['c', 4],
      ])
      const result = mergeMaps(map1, map2)
      expect(result).toEqual(
        new Map([
          ['a', 1],
          ['b', 3],
          ['c', 4],
        ])
      )
    })

    it('should handle maps with different value types', () => {
      const map1 = new Map<string, number | string>([
        ['a', 1],
        ['b', 'text'],
      ])
      const map2 = new Map<string, number | string>([
        ['c', 3],
        ['d', 'more'],
      ])
      const result = mergeMaps<string, number | string>(map1, map2)
      expect(result).toEqual(
        new Map<string, number | string>([
          ['a', 1],
          ['b', 'text'],
          ['c', 3],
          ['d', 'more'],
        ])
      )
    })

    it('should merge three or more maps', () => {
      const map1 = new Map([['a', 1]])
      const map2 = new Map([['b', 2]])
      const map3 = new Map([['c', 3]])
      const map4 = new Map([['d', 4]])
      const result = mergeMaps(map1, map2, map3, map4)
      expect(result).toEqual(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ])
      )
    })

    it('should not modify original maps', () => {
      const map1 = new Map([['a', 1]])
      const map2 = new Map([['b', 2]])
      const result = mergeMaps(map1, map2)

      expect(map1).toEqual(new Map([['a', 1]]))
      expect(map2).toEqual(new Map([['b', 2]]))
      expect(result).toEqual(
        new Map([
          ['a', 1],
          ['b', 2],
        ])
      )
    })
  })
})
