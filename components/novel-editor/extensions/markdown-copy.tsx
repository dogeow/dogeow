import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

// 简单的Markdown序列化器
const serializeToMarkdown = (node: ProseMirrorNode): string => {
  let result = ''

  if (node.isText) {
    let text = node.text || ''

    // 处理文本标记
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type.name) {
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'code':
            text = `\`${text}\``
            break
          case 'link':
            const href = mark.attrs.href
            text = `[${text}](${href})`
            break
        }
      }
    }

    return text
  }

  // 处理块级元素
  switch (node.type.name) {
    case 'heading':
      const level = node.attrs.level || 1
      const headingPrefix = '#'.repeat(level)
      return `${headingPrefix} ${node.textContent}\n\n`

    case 'paragraph':
      node.content.forEach(child => {
        result += serializeToMarkdown(child)
      })
      return result + '\n\n'

    case 'blockquote':
      return `> ${node.textContent}\n\n`

    case 'codeBlock':
      const language = node.attrs.language || ''
      return `\`\`\`${language}\n${node.textContent}\n\`\`\`\n\n`

    case 'bulletList':
      node.content.forEach(listItem => {
        result += `- ${listItem.textContent}\n`
      })
      return result + '\n'

    case 'orderedList':
      node.content.forEach((listItem, index) => {
        result += `${index + 1}. ${listItem.textContent}\n`
      })
      return result + '\n'

    default:
      // 递归处理子节点
      if (node.content) {
        node.content.forEach(child => {
          result += serializeToMarkdown(child)
        })
      }
      return result
  }
}

// 检查文本是否包含Markdown格式的辅助函数
const hasMarkdownFormatting = (text: string): boolean => {
  // 检查常见的Markdown格式标记
  const markdownPatterns = [
    /\*\*.*?\*\*/, // 粗体
    /\*.*?\*/, // 斜体
    /`.*?`/, // 行内代码
    /^#{1,6}\s/m, // 标题
    /^>\s/m, // 引用
    /^[-*+]\s/m, // 列表项
    /^\d+\.\s/m, // 数字列表
    /```[\s\S]*?```/, // 代码块
    /\[.*?\]\(.*?\)/, // 链接
    /!\[.*?\]\(.*?\)/, // 图片
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}

// 自定义扩展：复制时自动格式化为Markdown
export const MarkdownCopyExtension = Extension.create({
  name: 'markdownCopy',

  onCreate() {
    console.log('MarkdownCopyExtension loaded successfully')
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownCopy'),
        props: {
          handleDOMEvents: {
            copy: (view, event) => {
              console.log('Copy event triggered')
              const { state } = view
              const { selection } = state

              // 如果没有选中内容，让浏览器默认处理
              if (selection.empty) {
                console.log('No selection, using default copy')
                return false
              }

              try {
                // 获取选中的内容片段
                const selectedContent = selection.content()

                // 使用我们自己的序列化器
                let markdownResult = ''
                selectedContent.content.forEach(node => {
                  markdownResult += serializeToMarkdown(node)
                })

                // 清理结果
                markdownResult = markdownResult.trim()

                // 获取纯文本版本用于比较
                const plainText = state.doc.textBetween(selection.from, selection.to)

                // 检查是否真的包含格式（markdown结果与纯文本不同）
                if (
                  markdownResult &&
                  markdownResult !== plainText.trim() &&
                  hasMarkdownFormatting(markdownResult)
                ) {
                  console.log('Copying formatted text as markdown:', markdownResult)
                  // 设置剪贴板内容
                  event.clipboardData?.setData('text/plain', markdownResult)
                  event.preventDefault()
                  return true
                }

                console.log('No formatting detected, using default copy behavior')
              } catch (error) {
                console.warn('Failed to convert selection to markdown:', error)
              }

              // 如果没有格式或转换失败，让浏览器默认处理
              return false
            },
          },
        },
      }),
    ]
  },
})
