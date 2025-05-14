import React from 'react'
import { RenderElementProps } from 'slate-react'

// 自定义元素渲染
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes} className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc pl-5 my-4">{children}</ul>
    case 'heading-one':
      return <h1 {...attributes} className="text-3xl font-bold my-4">{children}</h1>
    case 'heading-two':
      return <h2 {...attributes} className="text-2xl font-bold my-3">{children}</h2>
    case 'heading-three':
      return <h3 {...attributes} className="text-xl font-bold my-2">{children}</h3>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal pl-5 my-4">{children}</ol>
    case 'code-block':
      return (
        <div {...attributes} className="my-4">
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            <code className="text-sm font-mono">
              {children}
            </code>
          </pre>
        </div>
      )
    case 'table':
      return (
        <table {...attributes} className="border-collapse border border-gray-300 my-4 w-full">
          <tbody>{children}</tbody>
        </table>
      )
    case 'table-row':
      return <tr {...attributes} className="border-b border-gray-300">{children}</tr>
    case 'table-cell':
      return <td {...attributes} className="border border-gray-300 p-2">{children}</td>
    default:
      return <p {...attributes} className="my-2">{children}</p>
  }
}

export default Element 