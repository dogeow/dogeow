/**
 * 字符长度计算工具函数
 * 中文、emoji 算 2 个字符，数字和字母算 1 个字符
 */

/**
 * 计算文本的字符长度（中文/emoji算2，数字/字母算1）
 * @param text 要计算的文本
 * @returns 字符长度（整数）
 */
export function calculateCharLength(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  let length = 0
  // 使用数组迭代器正确处理 emoji 和代理对
  const chars = [...text]

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const codePoint = char.codePointAt(0)

    if (codePoint === undefined) {
      continue
    }

    // 检查是否是中文字符（包括 CJK 统一表意文字）
    if (
      (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK 统一表意文字
      (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK 扩展 A
      (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK 扩展 B
      (codePoint >= 0x2a700 && codePoint <= 0x2b73f) || // CJK 扩展 C
      (codePoint >= 0x2b740 && codePoint <= 0x2b81f) || // CJK 扩展 D
      (codePoint >= 0xf900 && codePoint <= 0xfaff) // CJK 兼容表意文字
    ) {
      length += 2
    }
    // 检查是否是 emoji（使用 Unicode 范围）
    else if (
      (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) || // 杂项符号和象形文字
      (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // 表情符号
      (codePoint >= 0x2600 && codePoint <= 0x26ff) || // 杂项符号
      (codePoint >= 0x2700 && codePoint <= 0x27bf) || // 装饰符号
      (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) // 区域指示符号（国旗）
    ) {
      length += 2
    }
    // 数字和字母算 1 个字符
    else {
      length += 1
    }
  }

  return length
}

/**
 * 检查文本是否超过最大字符长度
 * @param text 要检查的文本
 * @param maxLength 最大字符长度
 * @returns 是否超过
 */
export function exceedsMaxLength(text: string, maxLength: number): boolean {
  return calculateCharLength(text) > maxLength
}

/**
 * 检查文本是否少于最小字符长度
 * @param text 要检查的文本
 * @param minLength 最小字符长度
 * @returns 是否少于
 */
export function belowMinLength(text: string, minLength: number): boolean {
  return calculateCharLength(text) < minLength
}
