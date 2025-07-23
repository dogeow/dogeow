import { Descendant, Text, Element as SlateElement } from 'slate'
import { CustomElement, CustomText, initialValue as defaultInitialValue } from '../types/editor'

// 将字符串解析为 Slate 编辑器格式的函数
export const deserialize = (markdownString: string): Descendant[] => {
  // 如果为空，返回默认初始值
  if (!markdownString.trim()) {
    return defaultInitialValue as Descendant[]
  }

  // 简单的解析，将文本按行分割处理
  const lines = markdownString.split('\n')
  const nodes: Descendant[] = []

  let currentList: CustomElement | null = null
  let inCodeBlock = false
  let codeBlockContent = ''
  let codeBlockLanguage = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 处理代码块开始和结束
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // 开始代码块
        inCodeBlock = true
        codeBlockLanguage = line.substring(3).trim()
        codeBlockContent = ''
      } else {
        // 结束代码块
        inCodeBlock = false
        nodes.push({
          type: 'code-block',
          language: codeBlockLanguage,
          children: [{ text: codeBlockContent }],
        } as CustomElement)
      }
      continue
    }

    // 在代码块内部，收集内容
    if (inCodeBlock) {
      codeBlockContent += line + '\n'
      continue
    }

    // 跳过空行
    if (!line && i < lines.length - 1) continue

    // 处理标题
    if (line.startsWith('# ')) {
      nodes.push({
        type: 'heading-one',
        children: [{ text: line.substring(2) }],
      } as CustomElement)
      continue
    }

    if (line.startsWith('## ')) {
      nodes.push({
        type: 'heading-two',
        children: [{ text: line.substring(3) }],
      } as CustomElement)
      continue
    }

    if (line.startsWith('### ')) {
      nodes.push({
        type: 'heading-three',
        children: [{ text: line.substring(4) }],
      } as CustomElement)
      continue
    }

    // 处理列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItem = {
        type: 'list-item',
        children: [{ text: line.substring(2) }],
      } as CustomElement

      if (!currentList || currentList.type !== 'bulleted-list') {
        currentList = {
          type: 'bulleted-list',
          children: [listItem],
        } as CustomElement
        nodes.push(currentList)
      } else {
        ;(currentList.children as CustomElement[]).push(listItem)
      }
      continue
    }

    // 处理引用
    if (line.startsWith('> ')) {
      nodes.push({
        type: 'block-quote',
        children: [{ text: line.substring(2) }],
      } as CustomElement)
      continue
    }

    // 普通段落（可能包含链接和行内代码）
    if (line || i === lines.length - 1) {
      // 处理行内格式
      const textParts: CustomText[] = []
      const currentText = line
      let lastIndex = 0

      // 处理行内代码 `code`
      const inlineCodeRegex = /`([^`]+)`/g
      let codeMatch
      let codeProcessed = false

      while ((codeMatch = inlineCodeRegex.exec(currentText)) !== null) {
        codeProcessed = true
        // 添加代码前的文本
        if (codeMatch.index > lastIndex) {
          // 这部分文本需要进一步处理可能的链接和其他格式
          const plainText = currentText.substring(lastIndex, codeMatch.index)
          textParts.push({ text: plainText })
        }

        // 添加代码
        textParts.push({
          text: codeMatch[1],
          code: true,
        })

        lastIndex = codeMatch.index + codeMatch[0].length
      }

      // 如果处理了代码，添加剩余文本
      if (codeProcessed) {
        if (lastIndex < currentText.length) {
          textParts.push({ text: currentText.substring(lastIndex) })
        }
      } else {
        // 如果没有代码，处理链接
        // 简单处理链接 [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        let match
        lastIndex = 0

        while ((match = linkRegex.exec(line)) !== null) {
          // 添加链接前的普通文本
          if (match.index > lastIndex) {
            textParts.push({ text: line.substring(lastIndex, match.index) })
          }

          // 添加链接
          textParts.push({
            text: match[1],
            link: true,
            url: match[2],
          })

          lastIndex = match.index + match[0].length
        }

        // 添加剩余文本
        if (lastIndex < line.length) {
          textParts.push({ text: line.substring(lastIndex) })
        }
      }

      // 如果没有找到任何格式化内容，添加整行文本
      if (textParts.length === 0) {
        textParts.push({ text: line })
      }

      nodes.push({
        type: 'paragraph',
        children: textParts,
      } as CustomElement)
      continue
    }
  }

  // 如果代码块未关闭，添加它
  if (inCodeBlock) {
    nodes.push({
      type: 'code-block',
      language: codeBlockLanguage,
      children: [{ text: codeBlockContent }],
    } as CustomElement)
  }

  return nodes.length ? nodes : (defaultInitialValue as Descendant[])
}

// 序列化为 Markdown
export const serialize = (nodes: Descendant[]): string => {
  return nodes
    .map(node => {
      if (Text.isText(node)) {
        let text = node.text

        // 处理换行符，确保它们在代码中保持原样
        if (node.code && text.includes('\n')) {
          // 行内代码通常不应包含换行符，但我们提供保存支持
          // 返回时先处理代码格式
          return `\`${text}\``
        }

        if (node.code) {
          text = `\`${text}\``
        }
        if (node.link && node.url) {
          text = `[${text}](${node.url})`
        }
        if (node.bold) {
          text = `**${text}**`
        }
        if (node.italic) {
          text = `*${text}*`
        }
        return text
      }

      if (!SlateElement.isElement(node)) return ''

      const children = node.children.map(n => serialize([n as Descendant])).join('')

      switch (node.type) {
        case 'paragraph':
          return `${children}\n\n`
        case 'heading-one':
          return `# ${children}\n\n`
        case 'heading-two':
          return `## ${children}\n\n`
        case 'heading-three':
          return `### ${children}\n\n`
        case 'bulleted-list':
          return children
        case 'numbered-list':
          return children
        case 'list-item':
          return `- ${children}\n`
        case 'block-quote':
          return `> ${children}\n\n`
        case 'code-block':
          const language = 'language' in node ? node.language || '' : ''
          return `\`\`\`${language}\n${children}\n\`\`\`\n\n`
        case 'table':
          return `${children}\n`
        case 'table-row':
          return `${children}|\n`
        case 'table-cell':
          return `|${children}`
        default:
          return children
      }
    })
    .join('')
}
