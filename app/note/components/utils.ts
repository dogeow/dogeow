import { Text } from 'slate'

// 标准化tokens，使其扁平化并按行分组
export const normalizeTokens = (tokens: any[]): { types: string[], content: string }[][] => {
  const normalizedTokens: { types: string[], content: string }[][] = [[]]
  let currentLine = 0

  const processToken = (token: any, types: string[] = []): void => {
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
    } else if (token.content) {
      if (typeof token.content === 'string') {
        processToken(token.content, [...types, token.type])
      } else {
        for (const subToken of token.content) {
          processToken(subToken, [...types, token.type])
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
export const getTokensForCodeBlock = (node: any, path: number[]): any[] => {
  if (!Text.isText(node)) return []

  const ranges: any[] = []
  const text = node.text
  
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