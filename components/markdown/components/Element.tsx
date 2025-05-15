import { RenderElementProps } from 'slate-react'
import { LanguageSelector } from './LanguageSelector'
import { Node } from 'slate'

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
              onChange={value => {
                // 这个回调将在LanguageSelector组件内处理
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
            <img
              src={element.url}
              alt="上传的图片"
              className="max-w-full max-h-[500px] object-contain rounded-md"
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