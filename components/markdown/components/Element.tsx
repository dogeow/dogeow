import { RenderElementProps } from 'slate-react'
import { LanguageSelector } from './LanguageSelector'
import Image from "next/image";
import { Transforms } from 'slate'
import { useSlate } from 'slate-react'

// 自定义组件选项
type CustomRenderElementProps = RenderElementProps & {
  element: {
    type: string
    language?: string
    url?: string
  }
}

export const Element = (props: CustomRenderElementProps) => {
  const { attributes, children, element } = props
  const editor = useSlate()

  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-2 italic text-gray-700 dark:text-gray-300" {...attributes}>
          {children}
        </blockquote>
      )
      
    case 'bulleted-list':
      return (
        <ul className="list-disc ml-5 my-2" {...attributes}>
          {children}
        </ul>
      )
      
    case 'numbered-list':
      return (
        <ol className="list-decimal ml-5 my-2" {...attributes}>
          {children}
        </ol>
      )
      
    case 'heading-one':
      return (
        <h1 className="text-3xl font-bold my-3" {...attributes}>
          {children}
        </h1>
      )
      
    case 'heading-two':
      return (
        <h2 className="text-2xl font-bold my-2" {...attributes}>
          {children}
        </h2>
      )
      
    case 'heading-three':
      return (
        <h3 className="text-xl font-bold my-2" {...attributes}>
          {children}
        </h3>
      )
      
    case 'list-item':
      return (
        <li className="my-1" {...attributes}>
          {children}
        </li>
      )
      
    case 'code-block':
      return (
        <div {...attributes}>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-t-md px-3 py-1 text-sm">
            <LanguageSelector
              value={element.language}
              onChange={newLanguage => {
                // 找到当前元素的路径并更新语言属性
                const path = editor.selection?.anchor.path
                if (path) {
                  const elementPath = path.slice(0, -1) // 获取元素路径（去掉文本节点路径）
                  Transforms.setNodes(
                    editor,
                    { language: newLanguage },
                    { at: elementPath }
                  )
                }
              }}
            />
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-b-md overflow-x-auto whitespace-pre-wrap break-words">
            <code className="text-sm font-mono">{children}</code>
          </pre>
        </div>
      )

    case 'image':
      return (
        <div {...attributes} className="my-4 relative">
          {children}
          <div contentEditable={false} className="flex justify-center">
            <Image
              src={element.url || '/images/placeholder.png'}
              alt="上传的图片"
              width={500}
              height={500}
              className="object-contain rounded-md"
              style={{ maxWidth: "100%", maxHeight: 500 }}
            />
          </div>
        </div>
      )
      
    default:
      return (
        <p className="my-2 leading-relaxed" {...attributes}>
          {children}
        </p>
      )
  }
} 