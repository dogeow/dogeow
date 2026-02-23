// 标准化tokens，使其扁平化并按行分组
export const normalizeTokens = (tokens: unknown[]): { types: string[]; content: string }[][] => {
  const normalizedTokens: { types: string[]; content: string }[][] = [[]]
  let currentLine = 0

  const processToken = (token: unknown, types: string[] = []): void => {
    if (typeof token === 'string') {
      const lines = token.split('\n')
      lines.forEach((line, i) => {
        if (i !== 0) {
          currentLine++
          normalizedTokens[currentLine] = normalizedTokens[currentLine] || []
        }
        if (line !== '') {
          normalizedTokens[currentLine].push({
            types,
            content: line,
          })
        }
      })
    } else if (token && typeof token === 'object' && 'content' in token) {
      const { content, type } = token as { content: unknown; type?: string }
      const newTypes = type ? [...types, type] : types
      if (typeof content === 'string') {
        processToken(content, newTypes)
      } else if (Array.isArray(content)) {
        content.forEach(subToken => processToken(subToken, newTypes))
      }
    }
  }

  tokens.forEach(token => processToken(token))

  return normalizedTokens
}

// 计算装饰范围（预留接口，目前未实现）
export const getTokensForCodeBlock = (node: unknown): unknown[] => {
  if (!node || typeof node !== 'object' || !('text' in node)) return []
  return []
}

// 合并多个Map
export const mergeMaps = <K, V>(...maps: Map<K, V>[]): Map<K, V> => {
  const map = new Map<K, V>()
  maps.forEach(m => {
    m.forEach((value, key) => {
      map.set(key, value)
    })
  })
  return map
}
