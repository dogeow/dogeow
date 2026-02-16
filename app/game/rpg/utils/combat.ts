const ACT_NAMES: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
}

export function getActName(actNum: number): string {
  return `第${ACT_NAMES[actNum] ?? actNum}幕`
}
