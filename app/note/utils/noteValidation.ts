// 校验 Novel/Tiptap JSON 格式
export function isValidNovelJson(str: string): boolean {
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'object' && parsed.type === 'doc' && Array.isArray(parsed.content)
  } catch {
    return false
  }
}

export const DEFAULT_NOVEL_CONTENT = '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
