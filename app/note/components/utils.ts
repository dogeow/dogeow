import { Text } from 'slate'

// 标准化tokens，使其扁平化并按行分组
export const normalizeTokens = (tokens: unknown[]): { types: string[], content: string }[][] => {
  const normalizedTokens: { types: string[], content: string }[][] = [[]]
  let currentLine = 0

  const processToken = (token: unknown, types: string[] = []): void => {
    if (typeof token === 'string') {
      const lines = token.split('\n')
      
      if (lines.length > 1) {
        for (let i = 0; i < lines.length; i++) {
          if (i !== 0) {
            normalizedTokens[currentLine] = normalizedTokens[currentLine] || []
          }
          
          if (lines[i] !== '') {
            normalizedTokens[currentLine].push({
              types,
              content: lines[i],
            })
          }
          
          if (i !== lines.length - 1) {
            currentLine++
          }
        }
      } else if (token !== '') {
        normalizedTokens[currentLine].push({
          types,
          content: token,
        })
      }
    } else if (token && typeof token === 'object' && 'content' in token) {
      const tokenObj = token as { content: unknown; type?: string }
      if (typeof tokenObj.content === 'string') {
        processToken(tokenObj.content, [...types, tokenObj.type || ''])
      } else if (Array.isArray(tokenObj.content)) {
        for (const subToken of tokenObj.content) {
          processToken(subToken, [...types, tokenObj.type || ''])
        }
      }
    }
  }

  for (const token of tokens) {
    processToken(token)
  }

  return normalizedTokens
}

// 计算装饰范围
export const getTokensForCodeBlock = (node: unknown): unknown[] => {
  if (!Text.isText(node)) return []

  const ranges: unknown[] = []
  
  return ranges
}

// 合并多个Map
export const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>()

  for (const m of maps) {
    for (const [key, value] of m.entries()) {
      map.set(key, value)
    }
  }

  return map
} 