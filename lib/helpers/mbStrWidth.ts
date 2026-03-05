/**
 * 按「显示列宽」计算字符串宽度（兼容 PHP mb_strwidth 语义）
 * 用于固定宽度截断、终端/表格对齐等场景。
 * 规则：控制字符 0，半角 1，全角 2，半角片假名 1。
 *
 * @see http://php.net/manual/ja/function.mb-strwidth.php
 */

/**
 * 计算字符串的显示列宽（display width）
 * @param str 输入字符串
 * @returns 列宽（整数）
 */
export function mbStrWidth(str: string): number {
  if (typeof str !== 'string') return 0
  const strLength = str.length
  let totalWidth = 0
  for (let i = 0; i < strLength; i++) {
    const code = str.charCodeAt(i)
    if (code >= 0x0000 && code <= 0x0019) {
      totalWidth += 0
    } else if (code >= 0x0020 && code <= 0x1fff) {
      totalWidth += 1
    } else if (code >= 0x2000 && code <= 0xff60) {
      totalWidth += 2
    } else if (code >= 0xff61 && code <= 0xff9f) {
      totalWidth += 1
    } else if (code >= 0xffa0) {
      totalWidth += 2
    }
  }
  return totalWidth
}

/**
 * 单字符的显示宽度（用于逐字累加）
 */
function charWidth(char: string): number {
  if (char.length === 0) return 0
  return mbStrWidth(char)
}

/**
 * 按显示宽度截断字符串，并在末尾追加 trimMarker（总宽度不超过 width）
 *
 * @param str 输入字符串
 * @param start 起始位置（字符索引）
 * @param width 最大显示宽度（含 trimMarker）
 * @param trimMarker 截断时追加的标记，默认为空
 * @returns 截断后的字符串
 * @see http://www.php.net/manual/ja/function.mb-strimwidth.php
 */
export function mbStrImWidth(str: string, start: number, width: number, trimMarker = ''): string {
  if (typeof str !== 'string' || width < 0) return ''
  const trimMarkerWidth = mbStrWidth(trimMarker)
  const maxContentWidth = width - trimMarkerWidth
  if (maxContentWidth <= 0) return trimMarker

  const len = str.length
  let currentWidth = 0
  let end = start

  for (let i = start; i < len; i++) {
    const c = str[i]
    const w = charWidth(c)
    if (currentWidth + w > maxContentWidth) {
      break
    }
    currentWidth += w
    end = i + 1
  }

  const trimmed = str.slice(start, end)
  const wasTrimmed = end < len
  return wasTrimmed ? trimmed + trimMarker : trimmed
}
