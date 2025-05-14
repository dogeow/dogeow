import React from 'react'
import { RenderLeafProps } from 'slate-react'

// 自定义文本渲染
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.code) {
    children = <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-red-500">{children}</code>
  }
  
  if (leaf.link && leaf.url) {
    children = <a href={leaf.url} className="text-blue-500 hover:underline">{children}</a>
  }

  return <span {...attributes}>{children}</span>
}

export default Leaf 