import React from 'react'
import { RenderLeafProps } from 'slate-react'

// 自定义文本渲染
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let classNames = ""
  
  if (leaf.code) {
    classNames += "bg-gray-100 px-1.5 py-0.5 rounded font-mono text-red-500 whitespace-pre-wrap"
    children = <code className={classNames}>{children}</code>
    return <span {...attributes}>{children}</span>
  }
  
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }
  
  if (leaf.link && leaf.url) {
    children = <a href={leaf.url} className="text-blue-500 hover:underline">{children}</a>
  }

  return <span {...attributes}>{children}</span>
}

export default Leaf 