/**
 * 字数统计工具函数
 * 支持中英文混合文本的准确字数统计
 */

/**
 * 计算文本的字数（适用于中英文混合）
 * @param text 要统计的文本
 * @returns 字数
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  // 移除HTML标签
  const cleanText = text.replace(/<[^>]*>/g, '')

  // 移除多余的空白字符
  const trimmedText = cleanText.trim()

  if (!trimmedText) {
    return 0
  }

  // 中文字符正则表达式（只包括汉字，不包括标点符号）
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/

  // 英文字符正则表达式
  const englishRegex = /[a-zA-Z]/

  let wordCount = 0
  let i = 0

  while (i < trimmedText.length) {
    const char = trimmedText[i]

    if (chineseRegex.test(char)) {
      // 中文字符，每个字符算一个字
      wordCount++
      i++
    } else if (englishRegex.test(char)) {
      // 英文字符，需要找到完整的单词
      let wordEnd = i
      while (
        wordEnd < trimmedText.length &&
        (englishRegex.test(trimmedText[wordEnd]) ||
          trimmedText[wordEnd] === "'" ||
          trimmedText[wordEnd] === '-')
      ) {
        wordEnd++
      }

      // 检查是否形成了有效的英文单词
      const word = trimmedText.slice(i, wordEnd)
      if (word.length > 0) {
        wordCount++
      }

      i = wordEnd
    } else {
      // 其他字符（标点符号、空格等），跳过
      i++
    }
  }

  return wordCount
}

/**
 * 计算文本的字符数（包括所有字符）
 * @param text 要统计的文本
 * @returns 字符数
 */
export function countCharacters(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  // 移除HTML标签
  const cleanText = text.replace(/<[^>]*>/g, '')

  // 移除多余的空白字符
  const trimmedText = cleanText.trim()

  return trimmedText.length
}

/**
 * 从编辑器的JSON内容中提取纯文本
 * @param jsonContent 编辑器的JSON内容
 * @returns 提取的纯文本
 */
export function extractTextFromJSON(jsonContent: unknown): string {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return ''
  }

  let text = ''

  function traverse(node: unknown) {
    if (!node || typeof node !== 'object') return

    const nodeObj = node as Record<string, unknown>

    if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
      text += nodeObj.text
    } else if (nodeObj.content && Array.isArray(nodeObj.content)) {
      nodeObj.content.forEach(traverse)
    }
  }

  traverse(jsonContent)
  return text
}

/**
 * 从编辑器的HTML内容中提取纯文本
 * @param htmlContent 编辑器的HTML内容
 * @returns 提取的纯文本
 */
export function extractTextFromHTML(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return ''
  }

  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // 获取纯文本内容
  return tempDiv.textContent || tempDiv.innerText || ''
}
