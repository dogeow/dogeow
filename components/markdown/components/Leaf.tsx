import { RenderLeafProps } from 'slate-react'

export interface CustomRenderLeafProps extends RenderLeafProps {
  leaf: {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    link?: boolean;
    url?: string;
    // 代码高亮相关属性
    token?: boolean;
    comment?: boolean;
    operator?: boolean;
    urlLink?: boolean;
    keyword?: boolean;
    variable?: boolean;
    regex?: boolean;
    number?: boolean;
    boolean?: boolean;
    string?: boolean;
    function?: boolean;
    tag?: boolean;
    selector?: boolean;
    punctuation?: boolean;
    builtin?: boolean;
    important?: boolean;
  }
}

export const Leaf = ({ attributes, children, leaf }: CustomRenderLeafProps) => {
  // 应用基本格式
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.code) {
    children = <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-sm">{children}</code>
  }

  if (leaf.link) {
    children = (
      <a 
        href={leaf.url} 
        className="text-blue-500 underline hover:text-blue-700"
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  // 代码高亮处理
  if (leaf.token) {
    let className = ''
    
    if (leaf.comment) className = 'token comment'
    if (leaf.operator) className = 'token operator'
    if (leaf.keyword) className = 'token keyword'
    if (leaf.variable) className = 'token variable'
    if (leaf.number) className = 'token number'
    if (leaf.string) className = 'token string'
    if (leaf.function) className = 'token function'
    if (leaf.tag) className = 'token tag'
    if (leaf.selector) className = 'token selector'
    if (leaf.regex) className = 'token regex'
    if (leaf.punctuation) className = 'token punctuation'
    if (leaf.boolean) className = 'token boolean'
    if (leaf.builtin) className = 'token builtin'
    if (leaf.important) className = 'token important'
    
    children = <span className={className}>{children}</span>
  }

  return <span {...attributes}>{children}</span>
} 