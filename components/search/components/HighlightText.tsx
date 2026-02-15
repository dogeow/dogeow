'use client'

import { memo } from 'react'

/**
 * 搜索高亮组件 Props
 */
interface HighlightTextProps {
  text: string
  highlight: string
  /** 高亮 className */
  highlightClassName?: string
  /** 是否大小写敏感 */
  caseSensitive?: boolean
}

/**
 * 搜索高亮文本组件
 *
 * @example
 * ```tsx
 * <HighlightText text="Hello World" highlight="hello" />
 * // 输出: <span>Hello</span> World
 * ```
 */
export const HighlightText = memo<HighlightTextProps>(
  ({
    text,
    highlight,
    highlightClassName = 'text-primary font-semibold',
    caseSensitive = false,
  }) => {
    if (!highlight.trim() || !text) {
      return <>{text}</>
    }

    const flags = caseSensitive ? 'g' : 'gi'
    const pattern = new RegExp(`(${escapeRegExp(highlight)})`, flags)
    const parts = text.split(pattern)

    if (parts.length === 1) {
      return <>{text}</>
    }

    return (
      <>
        {parts.map((part, index) =>
          pattern.test(part) ? (
            <span key={index} className={highlightClassName}>
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }
)

HighlightText.displayName = 'HighlightText'

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
