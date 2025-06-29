import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// 检查文本是否包含Markdown格式的辅助函数
const hasMarkdownFormatting = (text: string): boolean => {
  // 检查常见的Markdown格式标记
  const markdownPatterns = [
    /\*\*.*?\*\*/,        // 粗体
    /\*.*?\*/,            // 斜体
    /`.*?`/,              // 行内代码
    /^#{1,6}\s/m,         // 标题
    /^>\s/m,              // 引用
    /^[-*+]\s/m,          // 列表项
    /^\d+\.\s/m,          // 数字列表
    /```[\s\S]*?```/,     // 代码块
    /\[.*?\]\(.*?\)/,     // 链接
    /!\[.*?\]\(.*?\)/,    // 图片
  ]
  
  return markdownPatterns.some(pattern => pattern.test(text))
}

// 自定义扩展：复制时自动格式化为Markdown
export const MarkdownCopyExtension = Extension.create({
  name: 'markdownCopy',

  addProseMirrorPlugins() {
    const editor = this.editor
    
    return [
      new Plugin({
        key: new PluginKey('markdownCopy'),
        props: {
          handleDOMEvents: {
            copy: (view, event) => {
              const { state } = view
              const { selection } = state
              
              // 如果没有选中内容，让浏览器默认处理
              if (selection.empty) {
                return false
              }
              
              try {
                // 使用编辑器的getMarkdown方法获取整个文档的markdown
                const fullMarkdown = editor.storage.markdown.getMarkdown()
                
                // 获取选中文本的纯文本版本
                const selectedText = state.doc.textBetween(selection.from, selection.to)
                
                // 如果选中的是纯文本且没有格式，直接返回
                if (!hasMarkdownFormatting(selectedText)) {
                  return false
                }
                
                // 尝试从完整的markdown中提取对应的部分
                // 这是一个简化的方法，对于复杂的选择可能不完美
                const lines = fullMarkdown.split('\n')
                const selectedLines = selectedText.split('\n')
                
                // 查找匹配的markdown部分
                let markdownResult = selectedText
                
                // 简单的格式化检测和转换
                if (selection.from !== selection.to) {
                  // 遍历选中的节点来构建markdown
                  const selectedContent = selection.content()
                  const fragment = selectedContent.content
                  
                  // 使用编辑器的markdown序列化器
                  if (editor.storage.markdown && editor.storage.markdown.serializer) {
                    markdownResult = editor.storage.markdown.serializer.serialize(fragment)
                  }
                }
                
                // 检查是否包含格式
                if (markdownResult && hasMarkdownFormatting(markdownResult)) {
                  // 设置剪贴板内容
                  event.clipboardData?.setData('text/plain', markdownResult)
                  event.preventDefault()
                  return true
                }
              } catch (error) {
                console.warn('Failed to convert selection to markdown:', error)
              }
              
              // 如果没有格式或转换失败，让浏览器默认处理
              return false
            }
          }
        }
      })
    ]
  }
}) 